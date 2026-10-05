-- Migration 018: Admin-managed appointment services.
-- Run this in the Supabase SQL Editor.
--
-- Backs the booking page's service lists (previously hardcoded SERVICES /
-- ONLINE_SERVICES arrays) with a table the admin can add to, edit and delete.
--   * mode = 'visit'  → only offered for in-person visits
--   * mode = 'online' → only offered for online consultations
--   * mode = 'both'   → offered for both

CREATE TABLE IF NOT EXISTS appointment_services (
  key         VARCHAR(64) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  duration    VARCHAR(40),
  tag         VARCHAR(60),
  mode        VARCHAR(20) DEFAULT 'both',
  is_enabled  BOOLEAN DEFAULT TRUE,
  position    INTEGER DEFAULT 0
);

-- Seed defaults (mirrors the previous hardcoded lists). Safe to re-run.
INSERT INTO appointment_services (key, name, description, duration, tag, mode, is_enabled, position)
VALUES
  ('consultation', 'Personal Consultation', 'One-on-one with our jewellery specialists in a private salon', '45 min', 'Most Popular', 'both',   true, 0),
  ('fitting',      'Jewellery Fitting',     'Precision sizing and bespoke fitting for every piece',          '30 min', NULL,           'visit',  true, 1),
  ('custom-design','Custom Design Session', 'Co-create your dream piece with our master jewellers',          '90 min', 'Exclusive',    'both',   true, 2),
  ('repair',       'Repair Assessment',     'Expert evaluation, restoration, and transparent quotation',     '30 min', NULL,           'visit',  true, 3),
  ('styling',      'Styling Advice',        'Curated recommendations based on your wardrobe and occasion',   '30 min', NULL,           'online', true, 4)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_appointment_services_position ON appointment_services(position);
