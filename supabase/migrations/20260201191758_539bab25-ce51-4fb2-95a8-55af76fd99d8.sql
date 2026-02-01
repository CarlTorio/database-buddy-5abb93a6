-- Add new columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS sales_stage TEXT DEFAULT 'Lead',
ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 1;

-- Rename last_contacted_at to last_update for clarity (we'll use updated_at instead since it already exists)
-- Remove columns that are no longer needed
ALTER TABLE public.contacts 
DROP COLUMN IF EXISTS priority_level,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS value,
DROP COLUMN IF EXISTS follow_up_at;