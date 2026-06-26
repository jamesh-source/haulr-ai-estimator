-- ============================================================
-- Migration 004: Crew pay types and job crew assignment
-- ============================================================

-- 1. Add pay type fields to crew_members
ALTER TABLE crew_members
  ADD COLUMN IF NOT EXISTS pay_type    text          NOT NULL DEFAULT 'hourly'
    CHECK (pay_type IN ('hourly', 'percent')),
  ADD COLUMN IF NOT EXISTS pay_percent numeric(5,2)  NOT NULL DEFAULT 0;

-- 2. Add estimated hours to jobs
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS estimated_hours numeric(4,1);

-- 3. Create job_crew junction table
CREATE TABLE IF NOT EXISTS job_crew (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id          uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  crew_member_id  uuid        NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  clerk_user_id   text        NOT NULL,
  assigned_at     timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, crew_member_id)
);

CREATE INDEX IF NOT EXISTS idx_job_crew_job_id        ON job_crew (job_id);
CREATE INDEX IF NOT EXISTS idx_job_crew_crew_member_id ON job_crew (crew_member_id);
CREATE INDEX IF NOT EXISTS idx_job_crew_clerk_user_id  ON job_crew (clerk_user_id);

-- RLS on job_crew
ALTER TABLE job_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_crew_select_own" ON job_crew
  FOR SELECT USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_insert_own" ON job_crew
  FOR INSERT WITH CHECK (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_delete_own" ON job_crew
  FOR DELETE USING (clerk_user_id = auth.uid()::text);

CREATE POLICY "job_crew_service_role_all" ON job_crew
  FOR ALL USING (auth.role() = 'service_role');
