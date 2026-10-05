-- Add product_images column to existing testimonials table
-- Run this in Supabase SQL Editor if you already have testimonials table
ALTER TABLE testimonials 
  ADD COLUMN IF NOT EXISTS product_images JSONB DEFAULT '[]';
