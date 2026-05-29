// src/app/admin/footer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type Settings = Record<string, string>;
interface FooterLink { label: string; href: string; }

const SETTINGS_FIELDS = [
  {
    section: 'Brand & Identity',
    fields: [
      { key: 'company_name', label: 'Company Name', placeholder: 'DAISY' },
      { key: 'tagline', label: 'Tagline', placeholder: 'Elegance That Blooms' },
      { key: 'description', label: 'Brand Description', placeholder: 'Curated luxury for the modern woman...', multiline: true },
      { key: 'copyright_text', label: 'Copyright Text', placeholder: '© 2025 DAISY. All rights reserved.' },
    ],
  },
  {
    section: 'Newsletter',
    fields: [
      { key: 'newsletter_title', label: 'Newsletter Heading', placeholder: 'Join the DAISY Circle' },
      { key: 'newsletter_description', label: 'Newsletter Subtext', placeholder: 'Exclusive offers, new arrivals & luxury picks...' },
    ],
  },
  {
    section: 'Contact Information',
    fields: [
      { key: 'contact_phone', label: 'Phone Number', placeholder: '+91 86103 44774' },
      { key: 'contact_email', label: 'Email Address', placeholder: 'hello@daisy.in' },
      { key: 'contact_address', label: 'Address', placeholder: 'Chennai, Tamil Nadu, India' },
      { key: 'whatsapp_number', label: 'WhatsApp Number (with country code)', placeholder: '918610344774' },
    ],
  },
  {
    section: 'Social Media Links',
    fields: [
      { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/yourpage' },
      { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/yourpage' },
      { key: 'youtube_url', label: 'YouTube URL', placeholder: 'https://youtube.com/@yourpage' },
    ],
  },
  {
    section: 'Shipping & Delivery',
    fields: [
      { key: 'announcement_text', label: 'Announcement Bar Text', placeholder: '🌸 Free Shipping on orders above ₹1000' },
      { key: 'free_shipping_threshold', label: 'Free Shipping Above (₹)', placeholder: '1000' },
      { key: 'shipping_fee', label: 'Shipping Fee (₹)', placeholder: '99' },
    ],
  },
];

const DEFAULT_SHOP: FooterLink[] = [
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/bestsellers' },
  { label: 'Jewellery', href: '/collections/jewellery' },
  { label: 'Sarees', href: '/collections/sarees' },
  { label: 'Skincare', href: '/collections/skincare' },
  { label: 'Gifts', href: '/collections/gifts' },
];

const DEFAULT_INFO: FooterLink[] = [
  { label: 'About Us', href: '/pages/about-us' },
  { label: 'Our Story', href: '/pages/our-story' },
  { label: 'Blog', href: '/pages/blog' },
  { label: 'Careers', href: '/pages/careers' },
  { label: 'Contact Us', href: '/pages/contact-us' },
];

const DEFAULT_HELP: FooterLink[] = [
  { label: 'Shipping Policy', href: '/pages/shipping-policy' },
  { label: 'Return & Refund', href: '/pages/return-policy' },
  { label: 'Privacy Policy', href: '/pages/privacy-policy' },
  { label: 'Terms & Conditions', href: '/pages/terms-and-conditions' },
  { label: 'Track Order', href: '/track-order' },
];

function parseLinks(json: string | undefined, fallback: FooterLink[]): FooterLink[] {
  if (!json) return fallback;
  try { return JSON.parse(json) as FooterLink[]; } catch { return fallback; }
}

// ---- Link Column Editor ----
function LinkColumnEditor({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  const update = (i: number, field: keyof FooterLink, val: string) => {
    const next = links.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    onChange(next);
  };
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const add = () => onChange([...links, { label: '', href: '' }]);
  const move = (i: number, dir: -1 | 1) => {
    const next = [...links];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="bg-white border border-nude-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-xl text-daisy-800">{title}</h2>
        <button
          onClick={add}
          className="flex items-center gap-1.5 text-xs font-body font-medium text-daisy-600 hover:text-daisy-800 border border-daisy-200 hover:border-daisy-400 px-3 py-1.5 transition-colors"
        >
          <Plus size={13} /> Add Link
        </button>
      </div>

      {links.length === 0 && (
        <p className="font-body text-xs text-daisy-400 text-center py-6">No links yet. Click "Add Link" to start.</p>
      )}

      <div className="space-y-3">
        {links.map((link, i) => (
          <div key={i} className="flex items-center gap-2 group">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="text-daisy-300 hover:text-daisy-600 disabled:opacity-20 transition-colors">
                <ChevronUp size={14} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === links.length - 1}
                className="text-daisy-300 hover:text-daisy-600 disabled:opacity-20 transition-colors">
                <ChevronDown size={14} />
              </button>
            </div>
            <input
              value={link.label}
              onChange={e => update(i, 'label', e.target.value)}
              placeholder="Link Label"
              className="flex-1 border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors"
            />
            <input
              value={link.href}
              onChange={e => update(i, 'href', e.target.value)}
              placeholder="/path or https://..."
              className="flex-[2] border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors font-mono text-xs"
            />
            <button onClick={() => remove(i)}
              className="text-red-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function AdminFooterPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [shopLinks, setShopLinks] = useState<FooterLink[]>(DEFAULT_SHOP);
  const [infoLinks, setInfoLinks] = useState<FooterLink[]>(DEFAULT_INFO);
  const [helpLinks, setHelpLinks] = useState<FooterLink[]>(DEFAULT_HELP);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      const s: Settings = {};
      (data || []).forEach((r: any) => { s[r.key] = r.value || ''; });
      setSettings(s);
      setShopLinks(parseLinks(s['footer_shop_links'], DEFAULT_SHOP));
      setInfoLinks(parseLinks(s['footer_info_links'], DEFAULT_INFO));
      setHelpLinks(parseLinks(s['footer_help_links'], DEFAULT_HELP));
      setLoading(false);
    });
  }, []);

  const set = (key: string, value: string) => setSettings(s => ({ ...s, [key]: value }));

  const saveAll = async () => {
    setSaving(true);
    try {
      // Merge link arrays into settings
      const merged: Settings = {
        ...settings,
        footer_shop_links: JSON.stringify(shopLinks),
        footer_info_links: JSON.stringify(infoLinks),
        footer_help_links: JSON.stringify(helpLinks),
      };
      const rows = Object.entries(merged).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString(),
      }));
      const { error } = await supabase
        .from('site_settings')
        .upsert(rows, { onConflict: 'key' });
      if (error) toast.error(error.message);
      else toast.success('✅ Footer settings saved!');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-10 flex justify-center">
      <Loader2 size={24} className="text-daisy-400 animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl text-daisy-900 font-light">Footer & Site Settings</h1>
          <p className="font-body text-sm text-daisy-400 mt-1">All content pulled live from database</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8 disabled:opacity-60 shrink-0"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save All
        </button>
      </div>

      <div className="space-y-6">
        {/* Settings sections */}
        {SETTINGS_FIELDS.map(({ section, fields }) => (
          <section key={section} className="bg-white border border-nude-200 p-6">
            <h2 className="font-heading text-xl text-daisy-800 mb-6">{section}</h2>
            <div className="space-y-4">
              {fields.map((f: any) => (
                <div key={f.key}>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      value={settings[f.key] || ''}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={settings[f.key] || ''}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Footer Navigation Links */}
        <div>
          <div className="mb-4">
            <h2 className="font-heading text-2xl text-daisy-900 font-light">Footer Navigation Links</h2>
            <p className="font-body text-xs text-daisy-400 mt-1">
              Edit the three link columns shown in the footer. Use <code className="bg-nude-100 px-1">/pages/slug</code> for CMS pages, or any URL.
            </p>
          </div>
          <div className="space-y-4">
            <LinkColumnEditor title="SHOP Column" links={shopLinks} onChange={setShopLinks} />
            <LinkColumnEditor title="INFO Column" links={infoLinks} onChange={setInfoLinks} />
            <LinkColumnEditor title="HELP Column" links={helpLinks} onChange={setHelpLinks} />
          </div>
        </div>

        {/* Trust Badges */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-2">Trust Badges</h2>
          <p className="font-body text-xs text-daisy-400 mb-4">Toggle which badges appear in the footer strip</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'badge_secure_payment', label: '🔒 Secure Payment' },
              { key: 'badge_free_shipping', label: '🚚 Free Shipping' },
              { key: 'badge_easy_returns', label: '↩️ Easy Returns' },
              { key: 'badge_authentic', label: '✅ Authentic Products' },
              { key: 'badge_happy_customers', label: '😊 Happy Customers' },
              { key: 'badge_cod', label: '💵 Cash on Delivery' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer p-3 border border-nude-100 hover:border-nude-300 transition-colors">
                <input
                  type="checkbox"
                  checked={settings[key] !== 'false'}
                  onChange={e => set(key, e.target.checked ? 'true' : 'false')}
                  className="accent-daisy-700 w-4 h-4"
                />
                <span className="font-body text-xs text-daisy-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Save button bottom */}
        <div className="flex justify-end pb-6">
          <button
            onClick={saveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-10 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}
