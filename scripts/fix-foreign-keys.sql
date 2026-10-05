
-- ======================================
-- FIX CATEGORY DELETION ISSUE
-- Run this in Supabase SQL Editor
-- ======================================

-- 1. First, drop the existing foreign key constraint (it probably has a name like products_category_id_fkey)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_id_fkey;

-- 2. Re-add the foreign key constraint with ON DELETE SET NULL
-- This way, when a category is deleted, any products in that category will have category_id set to NULL instead of preventing deletion
ALTER TABLE products 
ADD CONSTRAINT products_category_id_fkey 
FOREIGN KEY (category_id) 
REFERENCES categories(id) 
ON DELETE SET NULL;

-- Done!
