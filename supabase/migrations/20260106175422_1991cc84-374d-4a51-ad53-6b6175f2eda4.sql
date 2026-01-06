-- Add follow_up_at and priority_level columns to contacts table
ALTER TABLE public.contacts 
ADD COLUMN follow_up_at timestamp with time zone,
ADD COLUMN priority_level text DEFAULT 'low';