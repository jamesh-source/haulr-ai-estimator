-- ============================================================
-- Migration 003: Schema fixes for crew roles and truck color
-- ============================================================

-- Add color column to trucks (used for calendar display)
ALTER TABLE trucks
  ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#f97316';

-- Expand crew_members role constraint to match the app's role options.
-- Original: ('lead','worker','driver')
-- App uses:  'driver', 'laborer', 'supervisor', 'helper'
ALTER TABLE crew_members
  DROP CONSTRAINT IF EXISTS crew_members_role_check;

ALTER TABLE crew_members
  ADD CONSTRAINT crew_members_role_check
  CHECK (role IN ('driver', 'laborer', 'supervisor', 'helper', 'lead', 'worker'));
