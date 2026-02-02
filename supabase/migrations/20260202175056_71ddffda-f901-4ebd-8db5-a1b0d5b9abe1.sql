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
-- BASE TABLES
-- ============================================================================

-- Contact Categories Table
CREATE TABLE public.contact_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacts Table
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
    output_link TEXT,
    lead_source TEXT,
    sales_stage TEXT NOT NULL DEFAULT 'Lead',
    contact_count INTEGER NOT NULL DEFAULT 0,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    value NUMERIC,
    deposit NUMERIC,
    priority_level TEXT,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    current_phase INTEGER NOT NULL DEFAULT 1,
    demo_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email Templates Table
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Accounts Table
CREATE TABLE public.user_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    password TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Emails Table
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
-- NEW FEATURE TABLES
-- ============================================================================

-- Developer Projects Table
CREATE TABLE public.developer_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.contact_categories(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    lovable_link TEXT,
    github_link TEXT,
    email_used TEXT,
    status TEXT NOT NULL DEFAULT 'For Demo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sticky Notes Table
CREATE TABLE public.sticky_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT NOT NULL,
    color TEXT DEFAULT 'yellow',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compensation Entries Table
CREATE TABLE public.compensation_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    website_name TEXT NOT NULL,
    total_paid NUMERIC NOT NULL DEFAULT 0,
    expenses NUMERIC NOT NULL DEFAULT 0,
    developer_name TEXT,
    notes TEXT,
    date_completed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compensation Sales Splits Table
CREATE TABLE public.compensation_sales_splits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    compensation_entry_id UUID NOT NULL REFERENCES public.compensation_entries(id) ON DELETE CASCADE,
    sales_agent_name TEXT NOT NULL,
    share_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compensation_sales_splits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (All access for internal tool)
-- ============================================================================

CREATE POLICY "Allow all access to contact_categories" ON public.contact_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to email_templates" ON public.email_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_accounts" ON public.user_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to user_emails" ON public.user_emails FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to developer_projects" ON public.developer_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sticky_notes" ON public.sticky_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to compensation_entries" ON public.compensation_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to compensation_sales_splits" ON public.compensation_sales_splits FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_accounts_updated_at BEFORE UPDATE ON public.user_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_emails_updated_at BEFORE UPDATE ON public.user_emails FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_developer_projects_updated_at BEFORE UPDATE ON public.developer_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sticky_notes_updated_at BEFORE UPDATE ON public.sticky_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_compensation_entries_updated_at BEFORE UPDATE ON public.compensation_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.email_templates (name, subject, body) VALUES ('Default', 'Hello from our team', 'Hi there,

We wanted to reach out and introduce our services.

Best regards,
The Team');