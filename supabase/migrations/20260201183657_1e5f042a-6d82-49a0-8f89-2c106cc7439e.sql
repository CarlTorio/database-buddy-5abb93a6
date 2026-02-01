-- Create contact_categories table
CREATE TABLE public.contact_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for categories"
ON public.contact_categories FOR SELECT USING (true);

CREATE POLICY "Allow insert for categories"
ON public.contact_categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for categories"
ON public.contact_categories FOR UPDATE USING (true);

CREATE POLICY "Allow delete for categories"
ON public.contact_categories FOR DELETE USING (true);

-- Create contacts table
CREATE TABLE public.contacts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.contact_categories(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    mobile_number TEXT,
    value NUMERIC,
    status TEXT NOT NULL DEFAULT 'Lead',
    link TEXT,
    notes TEXT,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    contact_count INTEGER NOT NULL DEFAULT 0,
    priority_level TEXT,
    follow_up_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for contacts"
ON public.contacts FOR SELECT USING (true);

CREATE POLICY "Allow insert for contacts"
ON public.contacts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for contacts"
ON public.contacts FOR UPDATE USING (true);

CREATE POLICY "Allow delete for contacts"
ON public.contacts FOR DELETE USING (true);

-- Create email_templates table
CREATE TABLE public.email_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for email_templates"
ON public.email_templates FOR SELECT USING (true);

CREATE POLICY "Allow insert for email_templates"
ON public.email_templates FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for email_templates"
ON public.email_templates FOR UPDATE USING (true);

CREATE POLICY "Allow delete for email_templates"
ON public.email_templates FOR DELETE USING (true);

-- Create trigger for contacts updated_at
CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for email_templates updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default email template
INSERT INTO public.email_templates (name, subject, body)
VALUES ('Default', 'Hello from our team', 'Hi there,

Thank you for your interest. We would love to connect with you.

Best regards');