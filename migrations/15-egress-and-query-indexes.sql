-- 15-egress-and-query-indexes.sql
-- Recommended indexes for the heavily-queried tables surfaced during the
-- Supabase egress audit. Indexes do NOT reduce egress bytes directly, but they
-- cut query latency/CPU and make the recommended server-side filtering,
-- pagination and aggregation (which DO cut egress) cheap.
--
-- All statements use IF NOT EXISTS and CONCURRENTLY-safe patterns; running them
-- is non-destructive and changes no data. Review column names against your live
-- schema before applying (a few are defensive — drop any that don't apply).

-- ── products ─────────────────────────────────────────────────────────────────
-- Homepage/featured queries (now push .eq('is_featured', true) to the DB).
CREATE INDEX IF NOT EXISTS idx_products_featured
  ON products (is_featured) WHERE is_featured = true;
-- Default listing order + recency.
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
-- Slug lookups (product detail, slug param) and category filtering.
CREATE INDEX IF NOT EXISTS idx_products_slug      ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku       ON products (sku);

-- ── product option tables (fetched via .in('product_id', ...)) ───────────────
CREATE INDEX IF NOT EXISTS idx_metal_opts_product ON product_metal_options (product_id);
CREATE INDEX IF NOT EXISTS idx_size_opts_product  ON product_size_options  (product_id);

-- ── reviews (rating aggregation via .in('product_id', ...)) ──────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_product    ON reviews (product_id);

-- ── categories (hierarchy + slug/name resolution) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_parent  ON categories (parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug    ON categories (slug);

-- ── orders (admin dashboard sums, lists, lookups) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_user        ON orders (user_id);

-- ── messages (inbox / unread / per-conversation latest) ──────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_conv_time ON messages (conversation_id, created_at DESC);

-- ── analytics (dashboard aggregation over time windows) ──────────────────────
CREATE INDEX IF NOT EXISTS idx_analytics_created  ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event    ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_sessions_created   ON page_sessions (created_at DESC);

-- ── blogs (visible + recency + slug) ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blogs_visible_time ON blogs (is_visible, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_slug         ON blogs (slug);

-- ── ledger ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ledger_created_at  ON ledger_entries (created_at DESC);
