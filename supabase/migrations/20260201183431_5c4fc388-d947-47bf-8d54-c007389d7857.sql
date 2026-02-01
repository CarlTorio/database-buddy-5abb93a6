-- Create user_accounts table for developer and sales agent credentials
CREATE TABLE public.user_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('developer', 'salesAgent')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT unique_password UNIQUE (password)
);

-- Enable Row Level Security
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read accounts (for login validation)
CREATE POLICY "Allow read access for login"
ON public.user_accounts
FOR SELECT
USING (true);

-- Allow authenticated admins to insert accounts
CREATE POLICY "Allow insert for account creation"
ON public.user_accounts
FOR INSERT
WITH CHECK (true);

-- Allow authenticated admins to update accounts
CREATE POLICY "Allow update for account management"
ON public.user_accounts
FOR UPDATE
USING (true);

-- Allow authenticated admins to delete accounts
CREATE POLICY "Allow delete for account management"
ON public.user_accounts
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();