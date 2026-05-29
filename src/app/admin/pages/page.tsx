// src/app/admin/pages/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Edit, Eye, EyeOff, Loader2, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { CmsPage } from '@/types/database';

const BLANK: Omit<CmsPage, 'id' | 'updated_at' | 'created_at'> = {
  slug: '', title: '', content: '', meta_title: null, meta_description: null, og_image: null, is_published: true,
};

export default function AdminCmsPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selected, setSelected] = useState<CmsPage | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    supabase.from('cms_pages').select('*').order('title').then(({ data }) => {
      setPages((data as CmsPage[]) || []);
      setLoading(false);
    });
  }, []);

  const openPage = (page: CmsPage) => {
    setSelected(page);
    setIsNew(false);
    setForm({
      slug: page.slug, title: page.title, content: page.content,
      meta_title: page.meta_title, meta_description: page.meta_description,
      og_image: page.og_image, is_published: page.is_published,
    });
  };

  const newPage = () => {
    setSelected(null); setIsNew(true); setForm(BLANK);
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.title || !form.slug) { toast.error('Title and slug are required'); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug.toLowerCase().replace(/\s+/g, '-'), updated_at: new Date().toISOString() };
    if (isNew) {
      const { data, error } = await supabase.from('cms_pages').insert([payload]).select().single();
      if (error) { toast.error(error.message); }
      else {
        setPages(p => [...p, data as CmsPage]);
        setSelected(data as CmsPage); setIsNew(false);
        toast.success('Page created!');
      }
    } else if (selected) {
      const { error } = await supabase.from('cms_pages').update(payload).eq('id', selected.id);
      if (error) { toast.error(error.message); }
      else {
        setPages(p => p.map(x => x.id === selected.id ? { ...x, ...payload } as CmsPage : x));
        setSelected({ ...selected, ...payload } as CmsPage);
        toast.success('Page saved!');
      }
    }
    setSaving(false);
  };

  const togglePublish = async (page: CmsPage) => {
    await supabase.from('cms_pages').update({ is_published: !page.is_published }).eq('id', page.id);
    setPages(p => p.map(x => x.id === page.id ? { ...x, is_published: !page.is_published } : x));
    if (selected?.id === page.id) setSelected({ ...selected, is_published: !page.is_published });
  };

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading text-4xl text-daisy-900 font-light">CMS Pages</h1>
          <p className="font-body text-sm text-daisy-400 mt-1">Edit content for all static pages</p>
        </div>
        <button onClick={newPage} className="btn-primary flex items-center gap-2"><Plus size={16}/> New Page</button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Page List */}
        <div className="md:col-span-1">
          <div className="bg-white border border-nude-200">
            <div className="px-4 py-3 border-b border-nude-200">
              <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500">All Pages</p>
            </div>
            {loading ? (
              <div className="p-6 flex justify-center"><Loader2 size={20} className="text-daisy-400 animate-spin"/></div>
            ) : (
              <div className="divide-y divide-nude-100 max-h-[600px] overflow-y-auto">
                {pages.map(page => (
                  <button key={page.id} onClick={() => openPage(page)}
                    className={`w-full text-left px-4 py-3 hover:bg-nude-50 transition-colors flex items-center gap-3 ${selected?.id === page.id ? 'bg-nude-100' : ''}`}>
                    <FileText size={14} className="text-daisy-400 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm text-daisy-900 truncate">{page.title}</p>
                      <p className="font-body text-[10px] text-daisy-400">/pages/{page.slug}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${page.is_published ? 'bg-green-400' : 'bg-gray-300'}`}/>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="md:col-span-2">
          {(selected || isNew) ? (
            <div className="bg-white border border-nude-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-daisy-800">{isNew ? 'New Page' : `Edit: ${selected?.title}`}</h2>
                <div className="flex items-center gap-3">
                  {selected && (
                    <a href={`/pages/${selected.slug}`} target="_blank"
                      className="font-body text-xs text-daisy-400 hover:text-daisy-900 flex items-center gap-1">
                      <Eye size={13}/> Preview
                    </a>
                  )}
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} Save
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Title *</label>
                    <input type="text" value={form.title} onChange={set('title')} placeholder="About Us"
                      className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
                  </div>
                  <div>
                    <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Slug (URL) *</label>
                    <input type="text" value={form.slug} onChange={set('slug')} placeholder="about-us"
                      className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-nude-50"/>
                  </div>
                </div>

                <div>
                  <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Content (HTML)</label>
                  <textarea value={form.content} onChange={set('content')} rows={14}
                    placeholder="<h2>About Us</h2><p>Your content here...</p>"
                    className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 font-mono resize-y"/>
                  <p className="font-body text-[10px] text-daisy-400 mt-1">You can use HTML tags for formatting</p>
                </div>

                <div className="border-t border-nude-100 pt-4">
                  <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-4">SEO</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block font-body text-xs text-daisy-500 mb-1">Meta Title</label>
                      <input type="text" value={form.meta_title || ''} onChange={set('meta_title')}
                        placeholder="Page Title | DAISY"
                        className="w-full border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400"/>
                    </div>
                    <div>
                      <label className="block font-body text-xs text-daisy-500 mb-1">Meta Description</label>
                      <textarea value={form.meta_description || ''} onChange={set('meta_description')} rows={2}
                        placeholder="Brief description for search engines..."
                        className="w-full border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 resize-none"/>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_published}
                      onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                      className="accent-daisy-700 w-4 h-4"/>
                    <span className="font-body text-sm text-daisy-700">Published (visible on site)</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-nude-200 p-12 flex flex-col items-center justify-center text-center h-64">
              <FileText size={40} className="text-daisy-200 mb-4"/>
              <p className="font-heading text-xl text-daisy-300">Select a page to edit</p>
              <p className="font-body text-sm text-daisy-400 mt-2">or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
