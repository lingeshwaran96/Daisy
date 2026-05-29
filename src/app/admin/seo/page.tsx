// src/app/admin/seo/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Search as SearchIcon, Loader2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { SeoSetting } from '@/types/database';

const PAGES = [
  { path: '/', label: 'Homepage' },
  { path: '/collections', label: 'All Collections' },
  { path: '/pages/about-us', label: 'About Us' },
  { path: '/pages/our-story', label: 'Our Story' },
  { path: '/pages/contact-us', label: 'Contact Us' },
  { path: '/pages/shipping-policy', label: 'Shipping Policy' },
  { path: '/pages/return-policy', label: 'Return Policy' },
  { path: '/pages/privacy-policy', label: 'Privacy Policy' },
  { path: '/pages/terms-and-conditions', label: 'Terms & Conditions' },
  { path: '/pages/blog', label: 'Blog' },
  { path: '/track-order', label: 'Track Order' },
];

const BLANK: Omit<SeoSetting, 'id' | 'updated_at'> = {
  page_path: '', meta_title: '', meta_description: '', og_image: '', keywords: '', canonical_url: '',
};

export default function AdminSeoPage() {
  const [seoSettings, setSeoSettings] = useState<SeoSetting[]>([]);
  const [selected, setSelected] = useState<SeoSetting | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customPath, setCustomPath] = useState('');

  useEffect(() => {
    supabase.from('seo_settings').select('*').order('page_path').then(({ data }) => {
      setSeoSettings((data as SeoSetting[]) || []);
      setLoading(false);
    });
  }, []);

  const openPage = (path: string) => {
    const existing = seoSettings.find(s => s.page_path === path);
    if (existing) {
      setSelected(existing);
      setForm({ page_path: existing.page_path, meta_title: existing.meta_title || '', meta_description: existing.meta_description || '', og_image: existing.og_image || '', keywords: existing.keywords || '', canonical_url: existing.canonical_url || '' });
    } else {
      setSelected(null);
      setForm({ ...BLANK, page_path: path });
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.page_path) { toast.error('Page path required'); return; }
    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };
    if (selected) {
      const { error } = await supabase.from('seo_settings').update(payload).eq('id', selected.id);
      if (error) { toast.error(error.message); }
      else {
        setSeoSettings(s => s.map(x => x.id === selected.id ? { ...x, ...payload } as SeoSetting : x));
        setSelected({ ...selected, ...payload } as SeoSetting);
        toast.success('SEO settings saved!');
      }
    } else {
      const { data, error } = await supabase.from('seo_settings').insert([payload]).select().single();
      if (error) { toast.error(error.message); }
      else {
        setSeoSettings(s => [...s, data as SeoSetting]);
        setSelected(data as SeoSetting);
        toast.success('SEO settings created!');
      }
    }
    setSaving(false);
  };

  const titleLength = (form.meta_title || '').length;
  const descLength = (form.meta_description || '').length;

  return (
    <div className="p-6 md:p-10">
      <div className="mb-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">SEO Settings</h1>
        <p className="font-body text-sm text-daisy-400 mt-1">Set meta title, description, OG image, and keywords per page</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="md:col-span-1">
          <div className="bg-white border border-nude-200">
            <div className="px-4 py-3 border-b border-nude-200">
              <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500">Select Page</p>
            </div>
            <div className="divide-y divide-nude-100 max-h-[500px] overflow-y-auto">
              {PAGES.map(({ path, label }) => {
                const hasSeo = seoSettings.some(s => s.page_path === path);
                return (
                  <button key={path} onClick={() => openPage(path)}
                    className={`w-full text-left px-4 py-3 hover:bg-nude-50 transition-colors flex items-center gap-3 ${form.page_path === path ? 'bg-nude-100' : ''}`}>
                    <Globe size={13} className={hasSeo ? 'text-green-500' : 'text-daisy-200'}/>
                    <div>
                      <p className="font-body text-sm text-daisy-900">{label}</p>
                      <p className="font-body text-[10px] text-daisy-400">{path}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-nude-100">
              <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Custom Page Path</p>
              <div className="flex gap-2">
                <input type="text" value={customPath} onChange={e => setCustomPath(e.target.value)}
                  placeholder="/product/slug" className="flex-1 border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400"/>
                <button onClick={() => { if (customPath) { openPage(customPath); setCustomPath(''); } }}
                  className="btn-outline text-xs py-2 px-3"><Plus size={12}/></button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2">
          {form.page_path ? (
            <div className="bg-white border border-nude-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-daisy-800">
                  {PAGES.find(p => p.path === form.page_path)?.label || form.page_path}
                </h2>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-body text-[10px] tracking-widest uppercase text-daisy-500">Meta Title</label>
                    <span className={`font-body text-[10px] ${titleLength > 60 ? 'text-red-500' : 'text-daisy-400'}`}>{titleLength}/60</span>
                  </div>
                  <input type="text" value={form.meta_title || ''} onChange={set('meta_title')}
                    placeholder="Page Title | DAISY – Luxury Jewellery"
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-body text-[10px] tracking-widest uppercase text-daisy-500">Meta Description</label>
                    <span className={`font-body text-[10px] ${descLength > 160 ? 'text-red-500' : 'text-daisy-400'}`}>{descLength}/160</span>
                  </div>
                  <textarea value={form.meta_description || ''} onChange={set('meta_description')} rows={3}
                    placeholder="Brief description of this page for search engines..."
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 resize-none"/>
                </div>

                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">OG Image URL</label>
                  <input type="url" value={form.og_image || ''} onChange={set('og_image')}
                    placeholder="https://... (1200×630px recommended)"
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
                </div>

                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Keywords</label>
                  <input type="text" value={form.keywords || ''} onChange={set('keywords')}
                    placeholder="jewellery, necklace, silver, india"
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
                </div>

                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Canonical URL</label>
                  <input type="url" value={form.canonical_url || ''} onChange={set('canonical_url')}
                    placeholder="https://daisy.in/pages/about-us"
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
                </div>

                {/* Preview */}
                {(form.meta_title || form.meta_description) && (
                  <div className="border border-nude-200 p-4 bg-nude-50">
                    <p className="font-body text-[10px] tracking-widest uppercase text-daisy-400 mb-3">Google Preview</p>
                    <p className="font-body text-base text-blue-700 mb-1">{form.meta_title || 'Page Title'}</p>
                    <p className="font-body text-xs text-green-700 mb-1">daisy.in{form.page_path}</p>
                    <p className="font-body text-sm text-gray-600 leading-relaxed">{form.meta_description || 'Page description...'}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-nude-200 p-12 flex flex-col items-center justify-center h-64">
              <Globe size={40} className="text-daisy-200 mb-4"/>
              <p className="font-heading text-xl text-daisy-300">Select a page to configure SEO</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
