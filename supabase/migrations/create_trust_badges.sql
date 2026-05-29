-- =====================================================
-- DAISY: Trust Badges Table Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- =====================================================

-- Table for site-wide trust/feature badges
CREATE TABLE IF NOT EXISTS public.trust_badges (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  icon        TEXT NOT NULL,          -- Name of the Lucide icon (e.g. 'Truck', 'Shield')
  title       TEXT NOT NULL,          -- Header text (e.g. 'Free Shipping')
  description TEXT,                   -- Supporting description text
  sort_order  INTEGER DEFAULT 0,      -- Custom order of badges
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;

-- Public read access (any guest can view trust badges)
CREATE POLICY "Anyone can view trust badges"
  ON public.trust_badges FOR SELECT
  USING (true);

-- Admin/Authenticated write/manage access
CREATE POLICY "Authenticated users can manage trust badges"
  ON public.trust_badges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed default trust badges
INSERT INTO public.trust_badges (icon, title, description, sort_order) VALUES
  ('Truck', 'Free Shipping', 'On orders above ₹1000', 1),
  ('Shield', '100% Authentic', 'Certified silver & gold', 2),
  ('RefreshCw', '7-Day Returns', 'Hassle-free returns', 3),
  ('Award', 'Premium Quality', 'Hallmark certified', 4),
  ('Headphones', '24/7 Support', 'WhatsApp & email', 5);
