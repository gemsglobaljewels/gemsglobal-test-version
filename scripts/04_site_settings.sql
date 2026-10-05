-- Site Settings Table for Dynamic Configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default Configuration
INSERT INTO public.site_settings (key, value) 
VALUES 
    ('logo_text', 'Demoo'),
    ('logo_em', 'oo'),
    ('logo_url', ''),
    ('favicon_url', ''),
    ('site_name', 'Gems Global Jewels'),
    ('site_title', 'Gems Global'),
    ('site_description', 'Discover exquisite handcrafted jewelry. Premium diamonds, gold, and precious gemstones.'),
    ('site_keywords', 'luxury jewelry, diamonds, gold, gemstones, handcrafted, jewelry boutique'),
    ('whatsapp_number', '+91 98765 43210'),
    ('contact_email', 'hello@demoo.com')
ON CONFLICT (key) DO NOTHING;

-- Permissions
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access" 
ON public.site_settings FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow service role full access" 
ON public.site_settings FOR ALL 
TO service_role 
USING (true);
