-- Drop the old constraint first - this must happen before the UPDATE
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_status_check;