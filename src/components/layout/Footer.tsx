// src/components/layout/Footer.tsx
'use client';

import Link from 'next/link';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type Settings = Record<string, string>;

interface FooterLink { label: string; href: string; }

const DEFAULT_SHOP_LINKS: FooterLink[] = [
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/bestsellers' },
  { label: 'Jewellery', href: '/collections/jewellery' },
  { label: 'Sarees', href: '/collections/sarees' },
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'Gifts', href: '/collections/gifts' },
];

const DEFAULT_INFO_LINKS: FooterLink[] = [
  { label: 'About Us', href: '/pages/about-us' },
  { label: 'Our Story', href: '/pages/our-story' },
  { label: 'Blog', href: '/pages/blog' },
  { label: 'Careers', href: '/pages/careers' },
  { label: 'Contact Us', href: '/pages/contact-us' },
];

const DEFAULT_HELP_LINKS: FooterLink[] = [
  { label: 'Shipping Policy', href: '/pages/shipping-policy' },
  { label: 'Return & Refund', href: '/pages/return-policy' },
  { label: 'Privacy Policy', href: '/pages/privacy-policy' },
  { label: 'Track Order', href: '/track-order' },
  { label: 'Message Box / Inbox', href: '/inbox' },
];

const DEFAULT: Settings = {
  company_name: 'DAISY',
  tagline: 'Elegance That Blooms',
  description: 'Curated luxury for the modern woman. Every piece tells a story of elegance, craftsmanship and timeless beauty.',
  instagram_url: '',
  facebook_url: '',
  youtube_url: '',
  whatsapp_number: '',
  contact_phone: '',
  contact_email: '',
  contact_address: 'Chennai, Tamil Nadu, India',
  newsletter_title: 'Join the DAISY Circle',
  newsletter_description: 'Exclusive offers, new arrivals & luxury picks — delivered to your inbox',
  copyright_text: `© ${new Date().getFullYear()} DAISY. All rights reserved.`,
};

function parseLinks(json: string | undefined, fallback: FooterLink[]): FooterLink[] {
  if (!json) return fallback;
  try { return JSON.parse(json) as FooterLink[]; } catch { return fallback; }
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [shopLinks, setShopLinks] = useState<FooterLink[]>(DEFAULT_SHOP_LINKS);
  const [infoLinks, setInfoLinks] = useState<FooterLink[]>(DEFAULT_INFO_LINKS);
  const [helpLinks, setHelpLinks] = useState<FooterLink[]>(DEFAULT_HELP_LINKS);

  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from('site_settings').select('key, value');
      if (data && data.length > 0) {
        const map: Settings = { ...DEFAULT };
        data.forEach(({ key, value }) => { if (value) map[key] = value; });
        setSettings(map);
        setShopLinks(parseLinks(map['footer_shop_links'], DEFAULT_SHOP_LINKS));
        setInfoLinks(parseLinks(map['footer_info_links'], DEFAULT_INFO_LINKS));
        setHelpLinks(parseLinks(map['footer_help_links'], DEFAULT_HELP_LINKS));
      }
    }
    loadSettings();
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('🌸 Thank you for subscribing!');
        setEmail('');
      } else {
        toast.error(data.error || 'Already subscribed or invalid email');
      }
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const s = settings;

  const socialLinks = [
    { Icon: Instagram, href: s.instagram_url, label: 'Instagram' },
    { Icon: Facebook, href: s.facebook_url, label: 'Facebook' },
    { Icon: Youtube, href: s.youtube_url, label: 'YouTube' },
    ...(s.whatsapp_number ? [{ Icon: MessageCircle, href: `https://wa.me/${s.whatsapp_number}`, label: 'WhatsApp' }] : []),
  ].filter(l => l.href);

  const trustBadges = [
    { key: 'badge_secure_payment', icon: '🔒', label: 'Secure Payment' },
    { key: 'badge_free_shipping', icon: '🚚', label: `Free Shipping ₹${s.free_shipping_threshold || '1000'}+` },
    { key: 'badge_easy_returns', icon: '↩️', label: '7-Day Returns' },
    { key: 'badge_authentic', icon: '✓', label: 'Authentic Products' },
    { key: 'badge_happy_customers', icon: '⭐', label: '10,000+ Happy Customers' },
    { key: 'badge_cod', icon: '💵', label: 'Cash on Delivery' },
  ].filter(b => s[b.key] !== 'false');

  return (
    <footer className="bg-daisy-950 text-cream/80">
      {/* Newsletter Strip */}
      <div className="border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-heading text-2xl md:text-3xl text-cream font-light mb-1">
              {s.newsletter_title}
            </h3>
            <p className="font-body text-sm text-cream/60">
              {s.newsletter_description}
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-0">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="flex-1 md:w-72 bg-white/10 border border-white/20 px-5 py-3.5 font-body text-sm text-cream placeholder-cream/40 outline-none focus:border-daisy-400 transition-colors"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="bg-daisy-600 hover:bg-daisy-500 disabled:opacity-60 text-cream px-8 py-3.5 font-body text-xs tracking-widest uppercase font-medium transition-colors"
            >
              {subscribing ? '...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="inline-block mb-5">
            <span className="font-heading text-3xl text-cream tracking-[0.4em] uppercase">{s.company_name}</span>
            <p className="font-body text-[10px] tracking-[0.3em] text-cream/50 mt-1">{s.tagline}</p>
          </Link>
          <p className="font-body text-sm text-cream/60 leading-relaxed mb-6">
            {s.description}
          </p>
          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-daisy-400 hover:text-daisy-400 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Shop Links */}
        <div>
          <h4 className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/50 mb-6 font-medium">Shop</h4>
          <ul className="space-y-3">
            {shopLinks.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="font-body text-sm text-cream/60 hover:text-cream transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Links */}
        <div>
          <h4 className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/50 mb-6 font-medium">Info</h4>
          <ul className="space-y-3">
            {infoLinks.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="font-body text-sm text-cream/60 hover:text-cream transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help & Contact */}
        <div>
          <h4 className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/50 mb-6 font-medium">Help</h4>
          <ul className="space-y-3 mb-8">
            {helpLinks.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="font-body text-sm text-cream/60 hover:text-cream transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="space-y-3 text-sm text-cream/60">
            {s.contact_phone && (
              <a href={`tel:${s.contact_phone}`} className="flex items-center gap-2 hover:text-cream transition-colors">
                <Phone size={14} />
                {s.contact_phone}
              </a>
            )}
            {s.contact_email && (
              <a href={`mailto:${s.contact_email}`} className="flex items-center gap-2 hover:text-cream transition-colors">
                <Mail size={14} />
                {s.contact_email}
              </a>
            )}
            {s.contact_address && (
              <div className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>{s.contact_address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      {trustBadges.length > 0 && (
        <div className="border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustBadges.map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 font-body text-xs text-cream/50">
                <span>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="font-body text-xs text-cream/40">{s.copyright_text}</p>
          <div className="flex items-center gap-4">
            <img src="/images/razorpay.svg" alt="Razorpay" className="h-5 opacity-40"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <div className="flex gap-2 text-cream/40 font-body text-xs">
              <span>UPI</span><span>•</span><span>Visa</span><span>•</span>
              <span>Mastercard</span><span>•</span><span>Net Banking</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
