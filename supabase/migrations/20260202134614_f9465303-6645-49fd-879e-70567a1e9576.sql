-- Create contact_categories table
CREATE TABLE IF NOT EXISTS public.contact_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table with all columns including new demo_instructions and current_phase
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.contact_categories(id) ON DELETE CASCADE,
  assigned_to TEXT,
  business_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT,
  email TEXT,
  mobile_number TEXT,
  value NUMERIC,
  sales_stage TEXT NOT NULL DEFAULT 'Lead',
  link TEXT,
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER NOT NULL DEFAULT 0,
  lead_source TEXT,
  priority_level TEXT,
  follow_up_at TIMESTAMP WITH TIME ZONE,
  demo_instructions TEXT,
  current_phase INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS public.user_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_emails table
CREATE TABLE IF NOT EXISTS public.user_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 0,
  max_monthly_credits INTEGER NOT NULL DEFAULT 100,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  last_copied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow all operations for now (no auth required for this app)
ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- Create public access policies (this app uses its own auth system)
CREATE POLICY "Allow public access to contact_categories" ON public.contact_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to contacts" ON public.contact_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to contacts_table" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to email_templates" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public access to user_emails" ON public.user_emails FOR ALL USING (true) WITH CHECK (true);