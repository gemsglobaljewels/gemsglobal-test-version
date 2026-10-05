-- Change rating column from INTEGER to DECIMAL(3,2) to support fractional ratings
ALTER TABLE reviews ALTER COLUMN rating TYPE DECIMAL(3,2);

-- Update the check constraint if it exists (usually Supabase might have one)
-- In 01_init_schema.sql it was: rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
-- We should drop and recreate it if necessary, but usually just changing the type works if the values are still within range.
