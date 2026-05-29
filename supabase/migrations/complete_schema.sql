-- ============================================================
-- DAISY Complete Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Testimonials (Admin-managed, shown on homepage) ──────────
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_photo text,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  product_name text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Newsletter ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

-- ── Site Settings (key-value store for all admin-editable content) ──
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Menu Items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  parent_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  open_in_new_tab boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── CMS Pages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  meta_title text,
  meta_description text,
  og_image text,
  is_published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── SEO Settings (per-page) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path text UNIQUE NOT NULL,
  meta_title text,
  meta_description text,
  og_image text,
  keywords text,
  canonical_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Addresses (saved by customers) ───────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  country text NOT NULL DEFAULT 'India',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Tracking Numbers on orders ─────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- ── Default CMS Pages ──────────────────────────────────────────
INSERT INTO cms_pages (slug, title, content, meta_title, meta_description) VALUES
  ('about-us', 'About Us', '<h2>Welcome to DAISY</h2><p>We bring you exquisite jewellery and fashion crafted with love and precision.</p>', 'About Us | DAISY', 'Learn about DAISY – our story, values, and commitment to quality jewellery.'),
  ('our-story', 'Our Story', '<h2>The DAISY Story</h2><p>Founded with a passion for elegance, DAISY was born to bring premium jewellery to every home.</p>', 'Our Story | DAISY', 'Discover the story behind DAISY – where luxury meets accessibility.'),
  ('contact-us', 'Contact Us', '<h2>Get in Touch</h2><p>We''d love to hear from you. Reach out to us at support@daisy.com</p>', 'Contact Us | DAISY', 'Contact DAISY for support, queries, or feedback.'),
  ('shipping-policy', 'Shipping Policy', '<h2>Shipping Policy</h2><p>We ship across India. Free shipping on orders above ₹1000. Standard delivery: 5-7 business days.</p>', 'Shipping Policy | DAISY', 'Read DAISY''s shipping policy – delivery timelines, charges, and more.'),
  ('return-policy', 'Return Policy', '<h2>Return Policy</h2><p>We accept returns within 7 days of delivery for unused products in original packaging.</p>', 'Return Policy | DAISY', 'DAISY''s hassle-free return and refund policy.'),
  ('privacy-policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. We do not share your personal data with third parties.</p>', 'Privacy Policy | DAISY', 'DAISY''s privacy policy – how we collect and use your data.'),
  ('terms-and-conditions', 'Terms & Conditions', '<h2>Terms & Conditions</h2><p>By using our website you agree to our terms of service.</p>', 'Terms & Conditions | DAISY', 'Read the terms and conditions for using the DAISY platform.'),
  ('blog', 'Blog', '<h2>DAISY Blog</h2><p>Coming soon – tips, trends, and stories from the world of jewellery and fashion.</p>', 'Blog | DAISY', 'Read DAISY''s blog for jewellery care tips, styling ideas, and more.'),
  ('careers', 'Careers', '<h2>Careers at DAISY</h2><p>Join our growing team. Send your resume to careers@daisy.com</p>', 'Careers | DAISY', 'Explore career opportunities at DAISY.')
ON CONFLICT (slug) DO NOTHING;

-- ── Default Site Settings ──────────────────────────────────────
INSERT INTO site_settings (key, value) VALUES
  ('company_name', 'DAISY'),
  ('tagline', 'Elegance That Blooms'),
  ('description', 'Premium jewellery, designer sarees, and luxury gifts crafted with love.'),
  ('copyright_text', '© 2025 DAISY. All rights reserved.'),
  ('instagram_url', 'https://instagram.com/daisy'),
  ('facebook_url', ''),
  ('youtube_url', ''),
  ('whatsapp_number', '918610344774'),
  ('contact_phone', '+91 86103 44774'),
  ('contact_email', 'hello@daisy.in'),
  ('contact_address', 'Chennai, Tamil Nadu, India'),
  ('newsletter_title', 'Join the DAISY Circle'),
  ('newsletter_description', 'Get early access to new collections, exclusive offers and styling tips.'),
  ('free_shipping_threshold', '1000'),
  ('shipping_fee', '99'),
  ('announcement_text', '🌸 Free Shipping on orders above ₹1000 | Use code DAISY10 for 10% off')
ON CONFLICT (key) DO NOTHING;

-- ── Default Menu Items ─────────────────────────────────────────
INSERT INTO menu_items (label, href, sort_order, is_active) VALUES
  ('Home', '/', 1, true),
  ('Collections', '/collections', 2, true),
  ('About Us', '/pages/about-us', 3, true),
  ('Blog', '/pages/blog', 4, true),
  ('Contact', '/pages/contact-us', 5, true)
ON CONFLICT DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────────
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Public read for frontend
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (is_active = true);
CREATE POLICY "Public read cms_pages" ON cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Public read seo_settings" ON seo_settings FOR SELECT USING (true);

-- Admin full access (via service role in API routes)
CREATE POLICY "Admin all testimonials" ON testimonials FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin all newsletter" ON newsletter_subscribers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin all settings" ON site_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin all menu" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin all cms" ON cms_pages FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin all seo" ON seo_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Newsletter: anyone can insert
CREATE POLICY "Anyone subscribe newsletter" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

-- Addresses: user owns their own
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);
