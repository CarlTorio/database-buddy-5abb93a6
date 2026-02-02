-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: contact_categories
CREATE TABLE public.contact_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: contacts
CREATE TABLE public.contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.contact_categories(id) ON DELETE CASCADE,
    assigned_to TEXT,
    business_name TEXT NOT NULL DEFAULT '',
    contact_name TEXT,
    mobile_number TEXT,
    email TEXT,
    link TEXT,
    demo_link TEXT,
    lead_source TEXT,
    sales_stage TEXT NOT NULL DEFAULT 'Lead',
    contact_count INTEGER NOT NULL DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    value NUMERIC,
    priority_level TEXT,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    current_phase INTEGER NOT NULL DEFAULT 1,
    demo_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: email_templates
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: user_accounts
CREATE TABLE public.user_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: user_emails
CREATE TABLE public.user_emails (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 0,
    monthly_credits INTEGER NOT NULL DEFAULT 0,
    max_monthly_credits INTEGER NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'active',
    last_copied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (public access - internal tool)
-- ============================================================================

CREATE POLICY "Allow all access to contact_categories" 
ON public.contact_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to contacts" 
ON public.contacts 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to email_templates" 
ON public.email_templates 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to user_accounts" 
ON public.user_accounts 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all access to user_emails" 
ON public.user_emails 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at
BEFORE UPDATE ON public.user_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_emails_updated_at
BEFORE UPDATE ON public.user_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.email_templates (name, subject, body) 
VALUES ('Default', 'Hello from our team', 'Hi there,

We wanted to reach out and introduce our services.

Best regards,

The Team')
ON CONFLICT DO NOTHING;