-- =============================================
-- DAISY: Seed missing CMS pages + footer link defaults
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Insert all missing CMS pages (upsert by slug so safe to re-run)
INSERT INTO cms_pages (slug, title, content, is_published, meta_title, meta_description, created_at, updated_at)
VALUES
  (
    'about-us',
    'About Us',
    '<p>Welcome to <strong>DAISY</strong> — a curated luxury lifestyle brand for the modern Indian woman. We believe every piece of jewellery, every saree, and every skincare ritual should tell a story of elegance and craftsmanship.</p>
<p>Founded with a passion for timeless beauty, DAISY brings together the finest artisans and the most exquisite materials to create collections that celebrate femininity in all its forms.</p>
<h2>Our Mission</h2>
<p>To make luxury accessible, authentic, and deeply personal — one beautiful piece at a time.</p>',
    true,
    'About Us | DAISY',
    'Learn about DAISY — a curated luxury lifestyle brand celebrating elegance and craftsmanship for the modern Indian woman.',
    now(), now()
  ),
  (
    'our-story',
    'Our Story',
    '<p>DAISY was born from a simple idea: that every woman deserves to feel like a work of art.</p>
<p>Our journey began in Chennai, where our founder — surrounded by the rich textile heritage of Tamil Nadu — dreamed of a brand that would bring the finest Indian craftsmanship to the world stage.</p>
<h2>The Beginning</h2>
<p>Starting with a small collection of handcrafted jewellery, DAISY quickly grew into a beloved destination for luxury-conscious women across India.</p>
<h2>Today</h2>
<p>We serve over 10,000 happy customers with collections spanning jewellery, sarees, skincare, and gifts — all curated with the same passion and attention to detail that started it all.</p>',
    true,
    'Our Story | DAISY',
    'The story behind DAISY — from a dream in Chennai to a luxury lifestyle brand loved by thousands.',
    now(), now()
  ),
  (
    'blog',
    'Blog',
    '<p>Welcome to the DAISY Journal — your source for style inspiration, beauty tips, and stories from the world of luxury living.</p>
<p>New articles coming soon. Stay tuned!</p>',
    true,
    'Blog | DAISY',
    'Style inspiration, beauty tips and stories from the DAISY universe.',
    now(), now()
  ),
  (
    'careers',
    'Careers',
    '<p>Join the DAISY family! We are always looking for passionate, creative, and driven individuals to help us grow.</p>
<h2>Current Openings</h2>
<p>We currently do not have any open positions, but we are always happy to hear from talented individuals. Send your resume to <a href="mailto:careers@daisy.in">careers@daisy.in</a>.</p>',
    true,
    'Careers | DAISY',
    'Explore career opportunities at DAISY. Join a passionate team dedicated to luxury and craftsmanship.',
    now(), now()
  ),
  (
    'contact-us',
    'Contact Us',
    '<p>We would love to hear from you. Reach out to us through any of the channels below.</p>
<h2>Get in Touch</h2>
<ul>
  <li><strong>Email:</strong> <a href="mailto:hello@daisy.in">hello@daisy.in</a></li>
  <li><strong>WhatsApp:</strong> Available on our website</li>
  <li><strong>Address:</strong> Chennai, Tamil Nadu, India</li>
</ul>
<h2>Customer Support Hours</h2>
<p>Monday – Saturday: 10 AM – 6 PM IST</p>
<p>We aim to respond to all queries within 24 hours.</p>',
    true,
    'Contact Us | DAISY',
    'Get in touch with DAISY. We are here to help with orders, queries, and everything in between.',
    now(), now()
  ),
  (
    'shipping-policy',
    'Shipping Policy',
    '<h2>Delivery Timeline</h2>
<p>We ship all orders within 1–2 business days of confirmation. Standard delivery takes <strong>5–7 business days</strong> across India.</p>
<h2>Free Shipping</h2>
<p>Enjoy free shipping on all orders above ₹1,000. A flat shipping fee of ₹99 applies to orders below this threshold.</p>
<h2>Order Tracking</h2>
<p>Once your order ships, you will receive a tracking link via email and SMS. You can also use our <a href="/track-order">Track Order</a> page.</p>
<h2>Packaging</h2>
<p>All DAISY products are carefully packed in our signature luxury gift boxes, making every delivery a special experience.</p>',
    true,
    'Shipping Policy | DAISY',
    'Learn about DAISY''s shipping timelines, free shipping eligibility, and order tracking.',
    now(), now()
  ),
  (
    'return-policy',
    'Return & Refund Policy',
    '<h2>7-Day Return Window</h2>
<p>We offer hassle-free returns within <strong>7 days</strong> of delivery for most products. Items must be unused, in original packaging, and in the same condition as received.</p>
<h2>How to Initiate a Return</h2>
<ol>
  <li>Contact us at <a href="mailto:returns@daisy.in">returns@daisy.in</a> with your order number</li>
  <li>Our team will guide you through the return process</li>
  <li>Once received and inspected, refunds are processed within 5–7 business days</li>
</ol>
<h2>Non-Returnable Items</h2>
<p>Skincare products, personalised items, and gift cards cannot be returned for hygiene and customisation reasons.</p>
<h2>Refund Method</h2>
<p>Refunds are credited to your original payment method. For COD orders, refunds are issued via bank transfer.</p>',
    true,
    'Return & Refund Policy | DAISY',
    'DAISY''s easy 7-day return and refund policy. Learn how to initiate a return and what to expect.',
    now(), now()
  ),
  (
    'privacy-policy',
    'Privacy Policy',
    '<p>At DAISY, we are committed to protecting your personal information and your right to privacy.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly: name, email address, phone number, shipping address, and payment details (processed securely via Razorpay).</p>
<h2>How We Use Your Information</h2>
<ul>
  <li>To process and fulfil your orders</li>
  <li>To send order confirmations and shipping updates</li>
  <li>To send promotional communications (with your consent)</li>
  <li>To improve our products and services</li>
</ul>
<h2>Data Security</h2>
<p>We implement industry-standard security measures. Payment information is never stored on our servers.</p>
<h2>Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:privacy@daisy.in">privacy@daisy.in</a>.</p>
<h2>Contact</h2>
<p>For privacy-related queries: <a href="mailto:privacy@daisy.in">privacy@daisy.in</a></p>',
    true,
    'Privacy Policy | DAISY',
    'Read DAISY''s privacy policy to understand how we collect, use, and protect your personal information.',
    now(), now()
  ),
  (
    'terms-and-conditions',
    'Terms & Conditions',
    '<p>Welcome to DAISY. By accessing or using our website, you agree to be bound by these Terms & Conditions.</p>
<h2>Use of Website</h2>
<p>You agree to use our website only for lawful purposes and in a manner that does not infringe the rights of others.</p>
<h2>Products & Pricing</h2>
<p>All prices are in Indian Rupees (INR) and inclusive of applicable taxes. We reserve the right to modify prices without prior notice.</p>
<h2>Orders & Payment</h2>
<p>An order confirmation email does not constitute acceptance of your order. We reserve the right to cancel any order at our discretion, with a full refund.</p>
<h2>Intellectual Property</h2>
<p>All content on this website — including images, text, logos, and designs — is the property of DAISY and may not be reproduced without written permission.</p>
<h2>Governing Law</h2>
<p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai, Tamil Nadu.</p>
<h2>Contact</h2>
<p>For queries: <a href="mailto:hello@daisy.in">hello@daisy.in</a></p>',
    true,
    'Terms & Conditions | DAISY',
    'Read DAISY''s terms and conditions governing the use of our website and services.',
    now(), now()
  )
ON CONFLICT (slug) DO UPDATE
  SET
    content     = EXCLUDED.content,
    is_published = EXCLUDED.is_published,
    meta_title  = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    updated_at  = now();

-- =============================================
-- 2. Seed default footer link columns into site_settings
-- (only insert if not already set)
-- =============================================

INSERT INTO site_settings (key, value, updated_at)
VALUES
  (
    'footer_shop_links',
    '[{"label":"New Arrivals","href":"/collections/new-arrivals"},{"label":"Best Sellers","href":"/collections/bestsellers"},{"label":"Jewellery","href":"/collections/jewellery"},{"label":"Sarees","href":"/collections/sarees"},{"label":"Skincare","href":"/collections/skincare"},{"label":"Gifts","href":"/collections/gifts"}]',
    now()
  ),
  (
    'footer_info_links',
    '[{"label":"About Us","href":"/pages/about-us"},{"label":"Our Story","href":"/pages/our-story"},{"label":"Blog","href":"/pages/blog"},{"label":"Careers","href":"/pages/careers"},{"label":"Contact Us","href":"/pages/contact-us"}]',
    now()
  ),
  (
    'footer_help_links',
    '[{"label":"Shipping Policy","href":"/pages/shipping-policy"},{"label":"Return & Refund","href":"/pages/return-policy"},{"label":"Privacy Policy","href":"/pages/privacy-policy"},{"label":"Terms & Conditions","href":"/pages/terms-and-conditions"},{"label":"Track Order","href":"/track-order"}]',
    now()
  )
ON CONFLICT (key) DO NOTHING;

-- Done! All 9 CMS pages created + footer link defaults seeded.
