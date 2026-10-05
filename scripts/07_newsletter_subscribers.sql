-- ============================================================
-- Newsletter Subscribers
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  is_active  BOOLEAN DEFAULT true NOT NULL
);

-- RLS — public can insert (subscribe), only service role can select
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert their email)
CREATE POLICY "Anyone can subscribe"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins via service role) can view
CREATE POLICY "Service role can view subscribers"
  ON newsletter_subscribers FOR SELECT
  USING (true);
