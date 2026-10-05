-- Run this SQL in your Supabase SQL Editor to create the page_sessions table
-- This table stores per-page visit durations with proper integer columns

CREATE TABLE IF NOT EXISTS page_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  path text NOT NULL,
  page_title text DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fast queries by path and session
CREATE INDEX IF NOT EXISTS idx_page_sessions_path ON page_sessions (path);
CREATE INDEX IF NOT EXISTS idx_page_sessions_session_id ON page_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_page_sessions_created_at ON page_sessions (created_at DESC);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE page_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (from the frontend tracker)
CREATE POLICY "Allow anonymous inserts" ON page_sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated reads (for admin analytics page)
CREATE POLICY "Allow authenticated reads" ON page_sessions
  FOR SELECT TO authenticated USING (true);

-- Also allow service role full access (for API routes)
CREATE POLICY "Allow service role full access" ON page_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
