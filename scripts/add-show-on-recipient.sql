-- Add show_on_recipient column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_on_recipient BOOLEAN DEFAULT FALSE;
