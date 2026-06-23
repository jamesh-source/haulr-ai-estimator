-- ============================================================
-- HAULR AI Estimator - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. BUSINESS_SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS business_settings (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id     text        NOT NULL UNIQUE,
  company_name      text,
  address           text,
  city              text,
  state             text,
  zip               text,
  phone             text,
  email             text,
  website           text,
  logo_url          text,
  tax_rate          numeric(5,4) NOT NULL DEFAULT 0.0,
  pricing_config    jsonb        NOT NULL DEFAULT '{}',
  created_at        timestamptz  NOT NULL DEFAULT NOW(),
  updated_at        timestamptz  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_settings_clerk_user_id
  ON business_settings (clerk_user_id);

-- RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_settings_select_own" ON business_settings
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "business_settings_insert_own" ON business_settings
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "business_settings_update_own" ON business_settings
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "business_settings_delete_own" ON business_settings
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id   text        NOT NULL,
  name            text,
  email           text,
  phone           text,
  address         text,
  city            text,
  state           text,
  zip             text,
  notes           text,
  status          text        NOT NULL DEFAULT 'lead'
                  CHECK (status IN ('lead','contacted','quoted','follow_up','scheduled','in_progress','completed','cancelled')),
  lead_source     text,
  tags            text[]      NOT NULL DEFAULT '{}',
  total_jobs      int         NOT NULL DEFAULT 0,
  total_revenue   numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT NOW(),
  updated_at      timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_clerk_user_id ON customers (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_status        ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at    ON customers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_clerk_status  ON customers (clerk_user_id, status);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select_own" ON customers
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "customers_insert_own" ON customers
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "customers_update_own" ON customers
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "customers_delete_own" ON customers
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. TRUCKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS trucks (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id    text        NOT NULL,
  name             text,
  make             text,
  model            text,
  year             int,
  license_plate    text,
  max_cubic_yards  numeric(6,2),
  status           text        NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','maintenance','inactive')),
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trucks_clerk_user_id ON trucks (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_trucks_status        ON trucks (status);

-- RLS
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trucks_select_own" ON trucks
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "trucks_insert_own" ON trucks
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "trucks_update_own" ON trucks
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "trucks_delete_own" ON trucks
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_trucks_updated_at
  BEFORE UPDATE ON trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. CREW_MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS crew_members (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text         NOT NULL,
  name           text,
  email          text,
  phone          text,
  role           text         NOT NULL DEFAULT 'worker'
                 CHECK (role IN ('lead','worker','driver')),
  status         text         NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive')),
  hourly_rate    numeric(8,2),
  created_at     timestamptz  NOT NULL DEFAULT NOW(),
  updated_at     timestamptz  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crew_members_clerk_user_id ON crew_members (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_status        ON crew_members (status);

-- RLS
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_members_select_own" ON crew_members
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "crew_members_insert_own" ON crew_members
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "crew_members_update_own" ON crew_members
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "crew_members_delete_own" ON crew_members
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_crew_members_updated_at
  BEFORE UPDATE ON crew_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. QUOTES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id                   uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id          uuid          REFERENCES customers(id) ON DELETE CASCADE,
  clerk_user_id        text          NOT NULL,
  quote_number         text          UNIQUE,
  status               text          NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','sent','approved','rejected','expired')),
  -- Snapshot of customer info at time of quote
  customer_name        text,
  customer_email       text,
  customer_phone       text,
  customer_address     text,
  service_address      text,
  job_description      text,
  -- Load estimation
  load_fraction        text,
  load_cubic_yards     numeric(8,2),
  truck_percentage     numeric(5,2),
  -- Fee line items
  base_charge          numeric(10,2) NOT NULL DEFAULT 0,
  load_charge          numeric(10,2) NOT NULL DEFAULT 0,
  distance_charge      numeric(10,2) NOT NULL DEFAULT 0,
  labor_charge         numeric(10,2) NOT NULL DEFAULT 0,
  heavy_item_fees      numeric(10,2) NOT NULL DEFAULT 0,
  stair_fees           numeric(10,2) NOT NULL DEFAULT 0,
  specialty_fees       numeric(10,2) NOT NULL DEFAULT 0,
  construction_fees    numeric(10,2) NOT NULL DEFAULT 0,
  custom_fees          numeric(10,2) NOT NULL DEFAULT 0,
  discounts            numeric(10,2) NOT NULL DEFAULT 0,
  subtotal             numeric(10,2) NOT NULL DEFAULT 0,
  tax_rate             numeric(5,4)  NOT NULL DEFAULT 0,
  tax_amount           numeric(10,2) NOT NULL DEFAULT 0,
  total                numeric(10,2) NOT NULL DEFAULT 0,
  -- Structured line items (for display/printing)
  line_items           jsonb         NOT NULL DEFAULT '[]',
  -- Full AI estimate response
  ai_estimate          jsonb,
  -- Attached photos (storage paths or public URLs)
  photos               text[]        NOT NULL DEFAULT '{}',
  notes                text,
  terms                text,
  expiry_date          date,
  sent_at              timestamptz,
  approved_at          timestamptz,
  created_at           timestamptz   NOT NULL DEFAULT NOW(),
  updated_at           timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_clerk_user_id ON quotes (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id   ON quotes (customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status        ON quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at    ON quotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number  ON quotes (quote_number);

-- RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_select_own" ON quotes
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "quotes_insert_own" ON quotes
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "quotes_update_own" ON quotes
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "quotes_delete_own" ON quotes
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id                       uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              uuid          REFERENCES customers(id),
  quote_id                 uuid          REFERENCES quotes(id),
  clerk_user_id            text          NOT NULL,
  title                    text,
  description              text,
  status                   text          NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','quoted','scheduled','in_progress','completed','cancelled')),
  service_address          text,
  scheduled_date           date,
  scheduled_time           time,
  scheduled_duration_hours numeric(4,2),
  truck_id                 uuid          REFERENCES trucks(id),
  crew_ids                 uuid[]        NOT NULL DEFAULT '{}',
  actual_start             timestamptz,
  actual_end               timestamptz,
  actual_hours             numeric(6,2),
  actual_dump_fee          numeric(10,2),
  actual_revenue           numeric(10,2),
  actual_cubic_yards       numeric(8,2),
  before_photos            text[]        NOT NULL DEFAULT '{}',
  after_photos             text[]        NOT NULL DEFAULT '{}',
  customer_signature       text,
  notes                    text,
  completion_notes         text,
  created_at               timestamptz   NOT NULL DEFAULT NOW(),
  updated_at               timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_clerk_user_id   ON jobs (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status          ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date  ON jobs (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id     ON jobs (customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_quote_id        ON jobs (quote_id);
CREATE INDEX IF NOT EXISTS idx_jobs_truck_id        ON jobs (truck_id);
CREATE INDEX IF NOT EXISTS idx_jobs_clerk_status    ON jobs (clerk_user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_clerk_schedule  ON jobs (clerk_user_id, scheduled_date);

-- RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_own" ON jobs
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "jobs_insert_own" ON jobs
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "jobs_update_own" ON jobs
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "jobs_delete_own" ON jobs
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. PHOTO_UPLOADS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS photo_uploads (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text        NOT NULL,
  customer_id    uuid        REFERENCES customers(id),
  job_id         uuid        REFERENCES jobs(id),
  quote_id       uuid        REFERENCES quotes(id),
  storage_path   text        NOT NULL,
  public_url     text,
  file_type      text,
  file_size      bigint,
  photo_type     text        CHECK (photo_type IN ('estimate','before','after','marketing')),
  ai_analyzed    boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_uploads_clerk_user_id ON photo_uploads (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_customer_id   ON photo_uploads (customer_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_job_id        ON photo_uploads (job_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_quote_id      ON photo_uploads (quote_id);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_photo_type    ON photo_uploads (photo_type);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_ai_analyzed   ON photo_uploads (ai_analyzed);

-- RLS
ALTER TABLE photo_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photo_uploads_select_own" ON photo_uploads
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "photo_uploads_insert_own" ON photo_uploads
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "photo_uploads_update_own" ON photo_uploads
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "photo_uploads_delete_own" ON photo_uploads
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- ============================================================
-- 8. AI_ANALYSIS_RESULTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_analysis_results (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id              uuid          REFERENCES quotes(id),
  photo_ids             text[],
  detected_items        jsonb,
  total_cubic_yards     numeric(8,2),
  truck_percentage      numeric(5,2),
  estimated_labor_hours numeric(6,2),
  estimated_dump_cost   numeric(10,2),
  suggested_price       numeric(10,2),
  suggested_margin      numeric(5,2),
  hazard_warnings       text[],
  donation_items        text[],
  recycling_items       text[],
  confidence_score      numeric(3,2),
  raw_response          jsonb,
  model_version         text,
  created_at            timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_quote_id ON ai_analysis_results (quote_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_created  ON ai_analysis_results (created_at DESC);

-- RLS: ai_analysis_results are accessed via quote ownership
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_analysis_results_select_via_quote" ON ai_analysis_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = ai_analysis_results.quote_id
        AND q.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "ai_analysis_results_insert_via_quote" ON ai_analysis_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = ai_analysis_results.quote_id
        AND q.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "ai_analysis_results_update_via_quote" ON ai_analysis_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = ai_analysis_results.quote_id
        AND q.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "ai_analysis_results_delete_via_quote" ON ai_analysis_results
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = ai_analysis_results.quote_id
        AND q.clerk_user_id = auth.uid()::text
    )
  );

-- ============================================================
-- 9. INVOICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                        uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                    uuid          REFERENCES jobs(id),
  quote_id                  uuid          REFERENCES quotes(id),
  customer_id               uuid          REFERENCES customers(id),
  clerk_user_id             text          NOT NULL,
  invoice_number            text          UNIQUE,
  status                    text          NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','sent','paid','partial','overdue','cancelled')),
  amount                    numeric(10,2),
  amount_paid               numeric(10,2) NOT NULL DEFAULT 0,
  stripe_payment_intent_id  text,
  stripe_invoice_id         text,
  due_date                  date,
  paid_at                   timestamptz,
  created_at                timestamptz   NOT NULL DEFAULT NOW(),
  updated_at                timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_clerk_user_id ON invoices (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id   ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id        ON invoices (job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id      ON invoices (quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status        ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date      ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices (invoice_number);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_own" ON invoices
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "invoices_insert_own" ON invoices
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "invoices_update_own" ON invoices
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "invoices_delete_own" ON invoices
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- Trigger
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       uuid          REFERENCES invoices(id),
  amount           numeric(10,2),
  payment_method   text,
  stripe_charge_id text,
  notes            text,
  created_at       timestamptz   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments (created_at DESC);

-- RLS: payments are accessed via invoice ownership
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_via_invoice" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
        AND i.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "payments_insert_via_invoice" ON payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
        AND i.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "payments_update_via_invoice" ON payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
        AND i.clerk_user_id = auth.uid()::text
    )
  );

CREATE POLICY "payments_delete_via_invoice" ON payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = payments.invoice_id
        AND i.clerk_user_id = auth.uid()::text
    )
  );

-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id  text        NOT NULL,
  type           text,
  title          text,
  message        text,
  read           boolean     NOT NULL DEFAULT false,
  link           text,
  created_at     timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_clerk_user_id ON notifications (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read          ON notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at    ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_clerk_read    ON notifications (clerk_user_id, read);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "notifications_insert_own" ON notifications
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (clerk_user_id = auth.uid()::text)
  WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "notifications_delete_own" ON notifications
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

-- ============================================================
-- SERVICE ROLE BYPASS POLICIES
-- Allow server-side operations (e.g., webhook handlers, admin)
-- These are additive — authenticated role still uses above policies.
-- ============================================================

-- business_settings
CREATE POLICY "business_settings_service_role_all" ON business_settings
  FOR ALL USING (auth.role() = 'service_role');

-- customers
CREATE POLICY "customers_service_role_all" ON customers
  FOR ALL USING (auth.role() = 'service_role');

-- trucks
CREATE POLICY "trucks_service_role_all" ON trucks
  FOR ALL USING (auth.role() = 'service_role');

-- crew_members
CREATE POLICY "crew_members_service_role_all" ON crew_members
  FOR ALL USING (auth.role() = 'service_role');

-- quotes
CREATE POLICY "quotes_service_role_all" ON quotes
  FOR ALL USING (auth.role() = 'service_role');

-- jobs
CREATE POLICY "jobs_service_role_all" ON jobs
  FOR ALL USING (auth.role() = 'service_role');

-- photo_uploads
CREATE POLICY "photo_uploads_service_role_all" ON photo_uploads
  FOR ALL USING (auth.role() = 'service_role');

-- ai_analysis_results
CREATE POLICY "ai_analysis_results_service_role_all" ON ai_analysis_results
  FOR ALL USING (auth.role() = 'service_role');

-- invoices
CREATE POLICY "invoices_service_role_all" ON invoices
  FOR ALL USING (auth.role() = 'service_role');

-- payments
CREATE POLICY "payments_service_role_all" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- notifications
CREATE POLICY "notifications_service_role_all" ON notifications
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- HELPER: Auto-generate quote numbers
-- Format: QUO-YYYYMMDD-XXXX (e.g. QUO-20260622-0001)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part text;
  seq_num   int;
  new_num   text;
BEGIN
  IF NEW.quote_number IS NULL THEN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1
      INTO seq_num
      FROM quotes
      WHERE quote_number LIKE 'QUO-' || date_part || '-%';
    new_num := 'QUO-' || date_part || '-' || LPAD(seq_num::text, 4, '0');
    NEW.quote_number := new_num;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_quotes_generate_number
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

-- ============================================================
-- HELPER: Auto-generate invoice numbers
-- Format: INV-YYYYMMDD-XXXX (e.g. INV-20260622-0001)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part text;
  seq_num   int;
  new_num   text;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    date_part := TO_CHAR(NOW(), 'YYYYMMDD');
    SELECT COUNT(*) + 1
      INTO seq_num
      FROM invoices
      WHERE invoice_number LIKE 'INV-' || date_part || '-%';
    new_num := 'INV-' || date_part || '-' || LPAD(seq_num::text, 4, '0');
    NEW.invoice_number := new_num;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoices_generate_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ============================================================
-- HELPER: Update customer aggregate stats when a job completes
-- ============================================================
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- When a job is marked completed and has actual_revenue, update customer totals
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_jobs    = total_jobs + 1,
      total_revenue = total_revenue + COALESCE(NEW.actual_revenue, 0),
      updated_at    = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  -- If job is un-completed (e.g. set back to in_progress), reverse the stats
  IF OLD.status = 'completed' AND NEW.status != 'completed' AND NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_jobs    = GREATEST(total_jobs - 1, 0),
      total_revenue = GREATEST(total_revenue - COALESCE(OLD.actual_revenue, 0), 0),
      updated_at    = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_update_customer_stats
  AFTER UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_customer_stats();

-- ============================================================
-- HELPER: Mark invoice overdue when due_date passes
-- (Called manually or via pg_cron scheduled job)
-- ============================================================
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE
    AND amount_paid < amount;
END;
$$ LANGUAGE plpgsql;
