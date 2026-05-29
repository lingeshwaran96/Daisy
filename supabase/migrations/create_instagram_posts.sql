-- =====================================================
-- DAISY: Instagram Posts Table Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL)
-- =====================================================

-- Create the instagram_posts table
CREATE TABLE IF NOT EXISTS instagram_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  post_url    TEXT,                -- Link to actual Instagram post
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view active posts on homepage)
CREATE POLICY "Public can view active instagram posts"
  ON instagram_posts FOR SELECT
  USING (is_active = true);

-- Admin full access (authenticated users with admin role)
CREATE POLICY "Admins can manage instagram posts"
  ON instagram_posts FOR ALL
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

-- Index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_instagram_posts_sort
  ON instagram_posts (sort_order, created_at DESC);

-- Index for active filtering
CREATE INDEX IF NOT EXISTS idx_instagram_posts_active
  ON instagram_posts (is_active);
