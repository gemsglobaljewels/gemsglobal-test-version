-- ============================================================
-- Saved Blogs
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table
CREATE TABLE IF NOT EXISTS saved_blogs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id    UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, blog_id)
);

-- RLS
ALTER TABLE saved_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved blogs"
  ON saved_blogs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save blogs"
  ON saved_blogs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave blogs"
  ON saved_blogs FOR DELETE
  USING (auth.uid() = user_id);
