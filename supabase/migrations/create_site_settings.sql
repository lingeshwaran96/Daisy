-- =====================================================
-- DAISY: Site Settings Table Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- =====================================================

-- Key-value store for site-wide settings
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public read access (frontend needs to read settings)
CREATE POLICY "Public can view site settings"
  ON site_settings FOR SELECT
  USING (true);

-- Admin full access
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Seed default Instagram settings
INSERT INTO site_settings (key, value) VALUES
  ('instagram_handle', '@daisy.jewels'),
  ('instagram_hashtag', '#DaisyElegance'),
  ('instagram_profile_url', 'https://instagram.com/daisy.jewels')
ON CONFLICT (key) DO NOTHING;
