-- Create user_emails table for storing email variations and credits tracking
CREATE TABLE public.user_emails (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Activated',
    credits INTEGER NOT NULL DEFAULT 5,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    max_monthly_credits INTEGER NOT NULL DEFAULT 30,
    last_copied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for internal admin tool
CREATE POLICY "Allow read access for user_emails"
ON public.user_emails FOR SELECT
USING (true);

CREATE POLICY "Allow insert for user_emails"
ON public.user_emails FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update for user_emails"
ON public.user_emails FOR UPDATE
USING (true);

CREATE POLICY "Allow delete for user_emails"
ON public.user_emails FOR DELETE
USING (true);

-- Create trigger for automatic updated_at
CREATE TRIGGER update_user_emails_updated_at
BEFORE UPDATE ON public.user_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();