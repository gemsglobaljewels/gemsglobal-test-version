-- Migration 017: Appointment mode, meeting link, preferred platform & location.
-- Run this in the Supabase SQL Editor.
--
-- Adds the columns the app now reads/writes so that:
--   * appointment_type   → whether a booking is an in-person "visit" or "online" consultation
--   * preferred_platform → the customer's preferred video platform (Zoom, Meet, FaceTime…)
--   * meeting_link       → per-appointment meeting link the admin fills in and that is emailed
--   * location           → the chosen showroom address (India / Canada) for in-person visits
--
-- The IF NOT EXISTS guards make this safe to run repeatedly.

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type   VARCHAR(20) DEFAULT 'visit';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS preferred_platform VARCHAR(120);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meeting_link       TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location           VARCHAR(255);

-- Backfill any legacy rows so the mode is never null.
UPDATE appointments SET appointment_type = 'visit' WHERE appointment_type IS NULL;

-- The old service_type CHECK constraint only allowed the four seeded slugs, which
-- blocks admin-defined services (and even the existing "styling" online service).
-- Drop it so service_type can hold any admin-managed service slug.
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_service_type_check;
