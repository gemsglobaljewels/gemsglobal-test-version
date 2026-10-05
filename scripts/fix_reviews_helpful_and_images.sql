-- 1. Add images column to reviews for bucket support
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. Create review_likes table to track which user liked which review
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_review_like_per_user UNIQUE (review_id, user_id)
);

-- 3. RLS Policies for review_likes
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view review likes" ON review_likes
  FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can toggle their own likes" ON review_likes
  FOR ALL USING (auth.uid() = user_id);

-- 4. Storage Bucket Setup for 'review-images'
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for review-images
CREATE POLICY "Public read review-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'review-images');

-- Authenticated upload access for review-images
CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'review-images');

-- Users can delete their own review images
CREATE POLICY "Users can delete their own review images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'review-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. RPC Functions to increment/decrement helpful_count safely
-- Using LANGUAGE sql for simpler execution
CREATE OR REPLACE FUNCTION increment_helpful_count(row_id UUID)
RETURNS VOID AS $$
  UPDATE reviews
  SET helpful_count = helpful_count + 1
  WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_helpful_count(row_id UUID)
RETURNS VOID AS $$
  UPDATE reviews
  SET helpful_count = GREATEST(0, helpful_count - 1)
  WHERE id = row_id;
$$ LANGUAGE sql SECURITY DEFINER;

