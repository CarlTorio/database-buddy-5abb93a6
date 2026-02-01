-- Create contact_categories table
CREATE TABLE public.contact_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.contact_categories(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  email TEXT,
  mobile_number TEXT,
  value NUMERIC,
  status TEXT NOT NULL DEFAULT 'Lead',
  link TEXT,
  notes TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER DEFAULT 0,
  priority_level TEXT,
  follow_up_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Default',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_emails table (for credits tracking)
CREATE TABLE public.user_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL DEFAULT 0,
  monthly_credits INTEGER NOT NULL DEFAULT 0,
  max_monthly_credits INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'active',
  last_copied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- Create open policies for internal tool access (password-protected at app level)
CREATE POLICY "Allow all access to contact_categories" ON public.contact_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to email_templates" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_emails" ON public.user_emails FOR ALL USING (true) WITH CHECK (true);

-- Insert a default email template
INSERT INTO public.email_templates (name, subject, body) VALUES ('Default', 'Hello from LogiCode', 'Hi there,\n\nThank you for your interest in our services.\n\nBest regards,\nLogiCode Team');