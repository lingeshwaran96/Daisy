// src/app/admin/categories/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Eye, EyeOff, Edit, X, Save, Upload, Link as LinkIcon, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Category, CategoryInsert } from '@/types/database';

const EMPTY = { name: '', slug: '', image_url: null as string | null, description: null as string | null, is_active: true, sort_order: 0 };

type ImageMode = 'upload' | 'url';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories((data as Category[]) || []);
      setLoading(false);
    });
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (k === 'name') {
      setForm(f => ({
        ...f,
        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) { toast.error('Not an image file'); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return null; }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('category-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      if (error.message.includes('Bucket') || error.message.includes('not found')) {
        toast.error('Create a public bucket named "category-images" in Supabase Storage first.');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
      return null;
    }
    const { data: urlData } = supabase.storage.from('category-images').getPublicUrl(data.path);
    return urlData?.publicUrl ?? null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploading(true);
    const url = await uploadImage(files[0]);
    if (url) { setForm(f => ({ ...f, image_url: url })); toast.success('Image uploaded!'); }
    setUploading(false);
  };

  const handleAddUrl = () => {
    if (!urlInput.startsWith('http')) { toast.error('Enter a valid URL'); return; }
    setForm(f => ({ ...f, image_url: urlInput.trim() }));
    setUrlInput('');
    toast.success('Image URL set!');
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug, image_url: form.image_url || null,
      description: form.description || null, is_active: form.is_active, sort_order: form.sort_order,
    };
    if (editId) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editId);
      if (error) { toast.error(error.message); }
      else {
        setCategories(c => c.map(x => x.id === editId ? { ...x, ...payload } as Category : x));
        toast.success('Category updated!');
        setEditId(null); setForm(EMPTY);
      }
    } else {
      const { data, error } = await supabase.from('categories').insert([payload]).select().single();
      if (error) { toast.error(error.message); }
      else { setCategories(c => [...c, data as Category]); setForm(EMPTY); toast.success('Category added!'); }
    }
    setSaving(false);
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, image_url: cat.image_url, description: cat.description, is_active: cat.is_active, sort_order: cat.sort_order });
  };

  const cancelEdit = () => { setEditId(null); setForm(EMPTY); };

  const toggleCategory = async (id: string, active: boolean) => {
    await supabase.from('categories').update({ is_active: !active }).eq('id', id);
    setCategories(c => c.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products won't be deleted.")) return;
    await supabase.from('categories').delete().eq('id', id);
    setCategories(c => c.filter(x => x.id !== id));
    toast.success('Category deleted');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Categories</h1>

      {/* ── Add / Edit Form ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-daisy-800">
            {editId ? 'Edit Category' : 'Add New Category'}
          </h2>
          {editId && (
            <button onClick={cancelEdit} className="flex items-center gap-1 font-body text-xs text-daisy-500 hover:text-daisy-900 transition-colors">
              <X size={14} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Text fields */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Name *</label>
              <input type="text" placeholder="e.g. Jewellery" value={form.name} onChange={set('name')}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Slug (URL)</label>
              <input type="text" value={form.slug} onChange={set('slug')}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-600 outline-none focus:border-daisy-400 transition-colors bg-nude-50" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} min={0}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Description (shown as subtitle)</label>
              <input type="text" value={form.description || ''} onChange={set('description')} placeholder="e.g. 120+ styles"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
          </div>

          {/* Image section */}
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Category Image</label>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setImageMode('upload')}
                className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all duration-200 ${
                  imageMode === 'upload' ? 'bg-daisy-900 text-cream border-daisy-900' : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
                }`}>
                <ImagePlus size={15} /> Upload Image
              </button>
              <button type="button" onClick={() => setImageMode('url')}
                className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all duration-200 ${
                  imageMode === 'url' ? 'bg-daisy-900 text-cream border-daisy-900' : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
                }`}>
                <LinkIcon size={15} /> Paste URL
              </button>
            </div>

            {/* Current image preview */}
            {form.image_url && (
              <div className="relative mb-4 inline-block">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-nude-200 bg-nude-100">
                  <Image src={form.image_url} alt="preview" fill className="object-cover" sizes="96px" />
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, image_url: null }))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Upload zone */}
            {imageMode === 'upload' && !form.image_url && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*"
                  onChange={e => handleFileSelect(e.target.files)} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full border-2 border-dashed border-nude-300 hover:border-daisy-400 p-8 flex flex-col items-center gap-2 transition-colors disabled:opacity-60">
                  {uploading
                    ? <><Loader2 size={28} className="text-daisy-400 animate-spin" /><span className="font-body text-sm text-daisy-500">Uploading...</span></>
                    : <><Upload size={28} className="text-daisy-300" /><span className="font-body text-sm text-daisy-600">Click to upload category image</span><span className="font-body text-[11px] text-daisy-400">PNG, JPG, WEBP up to 5 MB • Will display as a circle</span></>
                  }
                </button>
              </>
            )}

            {/* URL input */}
            {imageMode === 'url' && !form.image_url && (
              <div className="flex gap-3">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-...?w=600"
                  className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }} />
                <button type="button" onClick={handleAddUrl} className="btn-primary flex items-center gap-2 px-6">
                  <Plus size={16} /> Set
                </button>
              </div>
            )}
          </div>

          {/* Footer row */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-daisy-700 w-4 h-4" />
              <span className="font-body text-sm text-daisy-700">Active (visible on homepage)</span>
            </label>
            <button type="submit" disabled={saving || uploading} className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-60">
              {saving ? <span className="spinner" /> : editId ? <Save size={16} /> : <Plus size={16} />}
              {editId ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Categories List ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200">
          <h2 className="font-heading text-xl text-daisy-800">All Categories ({categories.length})</h2>
          <p className="font-body text-xs text-daisy-400 mt-1">Changes appear live on the homepage "Shop by Category" section</p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin" /></div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-daisy-400">No categories yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-nude-100">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 p-4 hover:bg-nude-50 transition-colors">
                {/* Circle image */}
                <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-nude-100 border border-nude-200">
                  {cat.image_url ? (
                    <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="48px"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-daisy-300 font-heading text-lg">
                      {cat.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-daisy-900 truncate">{cat.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="font-body text-xs text-daisy-400">/{cat.slug}</span>
                    <span className="font-body text-xs text-daisy-400">Order: {cat.sort_order}</span>
                    {cat.description && <span className="font-body text-xs text-daisy-400">{cat.description}</span>}
                    <span className={`font-body text-[10px] px-2 py-0.5 ${cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(cat)} title="Edit"
                    className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => toggleCategory(cat.id, cat.is_active)} title={cat.is_active ? 'Hide' : 'Show'}
                    className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors">
                    {cat.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} title="Delete"
                    className="p-2 text-daisy-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
