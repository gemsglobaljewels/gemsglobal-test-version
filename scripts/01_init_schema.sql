-- Jewelry E-Commerce Database Schema
-- Phase 1: Core tables and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_category_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  material VARCHAR(100),
  metal_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure category_id exists on products for pre-existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_id UUID;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE public.products ADD COLUMN images TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image'
  ) THEN
    ALTER TABLE public.products ADD COLUMN image TEXT;
  END IF;
END;
$$;

-- Ensure SKU column exists on products for pre-existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'sku'
  ) THEN
    ALTER TABLE public.products ADD COLUMN sku VARCHAR(100);
  END IF;
END;
$$;

-- Ensure unique constraint on SKU exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_sku_key'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_sku_key UNIQUE (sku);
  END IF;
END;
$$;

-- Ensure updated_at exists on products for pre-existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END;
$$;

-- Ensure created_at exists on products for pre-existing databases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.products ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END;
$$;

-- Ensure foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
  END IF;
END;
$$;
-- Product Variants Table (for sizes, metal options, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users Table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  shipping_address JSONB,
  billing_address JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table (role management)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'editor')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  phone VARCHAR(20),
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT cart_unique UNIQUE NULLS NOT DISTINCT (user_id, session_id, product_id, variant_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline Sales Table (for in-store/offline transactions)
CREATE TABLE IF NOT EXISTS offline_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  customer_address JSONB,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offline Sale Items Table
CREATE TABLE IF NOT EXISTS offline_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES offline_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Movements (track stock changes/history)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255),
  change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('consultation', 'fitting', 'custom-design', 'repair')),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  content TEXT,
  helpful_count INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_review_per_user UNIQUE (product_id, user_id)
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  featured_image_url TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_wishlist UNIQUE (user_id, product_id)
);

-- Create Indexes for Performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_offline_sales_created ON offline_sales(created_at);
CREATE INDEX idx_offline_sale_items_sale ON offline_sale_items(sale_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_admin_profiles_user ON admin_profiles(user_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('page_view','click')),
  path TEXT NOT NULL,
  page_title TEXT,
  element_target TEXT,
  session_id VARCHAR(255),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- USERS RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can view profiles if needed" ON users
  FOR SELECT USING (TRUE);

-- ADMIN_USERS RLS Policies
CREATE POLICY "Only admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can view admin profiles" ON admin_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Admins can modify admin profiles" ON admin_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    ) OR auth.uid() = user_id
  );

-- PRODUCTS RLS Policies
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- CATEGORIES RLS Policies
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- PRODUCT_VARIANTS RLS Policies
CREATE POLICY "Anyone can view variants" ON product_variants
  FOR SELECT USING (TRUE);

CREATE POLICY "Only admins can modify variants" ON product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

-- CARTS RLS Policies
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (
    auth.uid() = user_id OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can manage their own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Guest carts are accessible via session" ON carts
  FOR ALL USING (user_id IS NULL);

-- ORDERS RLS Policies
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    user_id IS NULL
  );

-- ORDER_ITEMS RLS Policies
CREATE POLICY "Users can view items from their orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    ) OR
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- OFFLINE_SALES RLS Policies
CREATE POLICY "Admins can view all offline sales" ON offline_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can create offline sales" ON offline_sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update offline sales" ON offline_sales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- OFFLINE_SALE_ITEMS RLS Policies
CREATE POLICY "Admins can view offline sale items" ON offline_sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can modify offline sale items" ON offline_sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- INVENTORY_MOVEMENTS RLS Policies
CREATE POLICY "Admins can view inventory movements" ON inventory_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert inventory movements" ON inventory_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

-- APPOINTMENTS RLS Policies
CREATE POLICY "Users can view their own appointments" ON appointments
  FOR SELECT USING (
    auth.uid() = user_id OR
    customer_email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (TRUE);

-- REVIEWS RLS Policies
CREATE POLICY "Anyone can view approved reviews" ON reviews
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Admins can view all reviews" ON reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Authenticated users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- BLOG_POSTS RLS Policies
CREATE POLICY "Anyone can view published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view their own drafts" ON blog_posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all posts" ON blog_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can create posts" ON blog_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Admins can modify posts" ON blog_posts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('owner', 'admin', 'editor')
    )
  );

-- WISHLIST RLS Policies
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offline_sales_updated_at BEFORE UPDATE ON offline_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Diamond Shapes (admin-configurable)
CREATE TABLE IF NOT EXISTS diamond_shapes (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255),
  sub TEXT,
  image TEXT,
  model_3d TEXT,
  is_enabled BOOLEAN DEFAULT TRUE
);

-- Basic read access if RLS is enabled in future; keep RLS disabled by default
-- ALTER TABLE diamond_shapes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read diamond shapes" ON diamond_shapes FOR SELECT USING (TRUE);

-- Backfill: add model_3d if missing
ALTER TABLE IF EXISTS diamond_shapes
  ADD COLUMN IF NOT EXISTS model_3d TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Storage Policies for diamond shape assets
-- Note: Buckets must be created via API (see /api/diamond-shapes/upload and upload-3d).
-- These policies allow public read on specific buckets and restrict writes to service role.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Enable RLS on storage.objects if not already enabled
  BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN others THEN
    -- ignore if storage schema not present in local env
  END;
END $$;

-- Public read access for diamond-shape-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read diamond-shape-images'
  ) THEN
    CREATE POLICY "Public read diamond-shape-images"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'diamond-shape-images');
  END IF;
END $$;

-- Public read access for diamond-shape-3d
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read diamond-shape-3d'
  ) THEN
    CREATE POLICY "Public read diamond-shape-3d"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'diamond-shape-3d');
  END IF;
END $$;

-- Restrict writes to service_role for both buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role write diamond-shape-images'
  ) THEN
    CREATE POLICY "Service role write diamond-shape-images"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'diamond-shape-images')
      WITH CHECK (bucket_id = 'diamond-shape-images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role write diamond-shape-3d'
  ) THEN
    CREATE POLICY "Service role write diamond-shape-3d"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'diamond-shape-3d')
      WITH CHECK (bucket_id = 'diamond-shape-3d');
  END IF;
END $$;

-- Add videos column to products for storing video URLs
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Public read access for product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read product-images'
  ) THEN
    CREATE POLICY "Public read product-images"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Service role write for product-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role write product-images'
  ) THEN
    CREATE POLICY "Service role write product-images"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'product-images')
      WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- Optional: product-videos bucket policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read product-videos'
  ) THEN
    CREATE POLICY "Public read product-videos"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'product-videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Service role write product-videos'
  ) THEN
    CREATE POLICY "Service role write product-videos"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'product-videos')
      WITH CHECK (bucket_id = 'product-videos');
  END IF;
END $$;
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();




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
