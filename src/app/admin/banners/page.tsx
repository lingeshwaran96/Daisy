// src/app/admin/banners/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Eye, EyeOff, Upload, Link as LinkIcon, ImagePlus, Loader2, X, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Banner, BannerInsert } from '@/types/database';

const EMPTY: BannerInsert = {
  title: '', subtitle: '', image_url: '', mobile_image_url: null,
  link: null, position: 'hero', is_active: true, sort_order: 0,
};

type ImageMode = 'upload' | 'url';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState<BannerInsert>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Banner>>({});
  const [editUploading, setEditUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('banners').select('*').order('sort_order').then(({ data }) => {
      setBanners((data as Banner[]) || []);
      setLoading(false);
    });
  }, []);

  // ── Upload helpers ──────────────────────────────────────────────────────────
  const uploadFile = async (file: File, bucket = 'banner-images'): Promise<string | null> => {
    if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5 MB)`); return null; }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `banners/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (error) {
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        toast.error('Storage bucket "banner-images" not found. Create it in Supabase Dashboard → Storage.');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return urlData?.publicUrl ?? null;
  };

  // ── Add-banner handlers ─────────────────────────────────────────────────────
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const url = await uploadFile(files[0]);
    if (url) {
      setForm(f => ({ ...f, image_url: url }));
      setPreviewUrl(url);
      toast.success('Image uploaded!');
    }
    setUploading(false);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http')) { toast.error('Enter a valid URL starting with https://'); return; }
    setForm(f => ({ ...f, image_url: urlInput.trim() }));
    setPreviewUrl(urlInput.trim());
    setUrlInput('');
    toast.success('Image URL set!');
  };

  const clearImage = () => {
    setForm(f => ({ ...f, image_url: '' }));
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.image_url) { toast.error('Title and image are required'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('banners').insert([form]).select().single();
    if (error) { toast.error(error.message); }
    else {
      setBanners(b => [...b, data as Banner]);
      setForm(EMPTY);
      setPreviewUrl('');
      toast.success('Banner added!');
    }
    setSaving(false);
  };

  // ── Existing-banner handlers ────────────────────────────────────────────────
  const toggleBanner = async (id: string, active: boolean) => {
    await supabase.from('banners').update({ is_active: !active }).eq('id', id);
    setBanners(b => b.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  const deleteBanner = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    setBanners(b => b.filter(x => x.id !== id));
    toast.success('Banner deleted');
  };

  const startEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setEditForm({ title: banner.title, subtitle: banner.subtitle, image_url: banner.image_url, link: banner.link, position: banner.position, sort_order: banner.sort_order });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('banners').update(editForm).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    setBanners(b => b.map(x => x.id === editingId ? { ...x, ...editForm } as Banner : x));
    setEditingId(null);
    toast.success('Banner updated!');
  };

  const handleEditImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setEditUploading(true);
    const url = await uploadFile(files[0]);
    if (url) setEditForm(f => ({ ...f, image_url: url }));
    setEditUploading(false);
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Manage Banners</h1>

      {/* ── Add Banner Form ─────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <h2 className="font-heading text-xl text-daisy-800 mb-6">Add New Banner</h2>
        <form onSubmit={handleSave} className="space-y-6">

          {/* Text fields */}
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { key: 'title', label: 'Title *', placeholder: 'Banner heading' },
              { key: 'subtitle', label: 'Subtitle', placeholder: 'Sub-heading (optional)' },
              { key: 'link', label: 'Link (optional)', placeholder: '/collections or https://...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">{label}</label>
                <input type="text" placeholder={placeholder} value={(form as any)[key] || ''} onChange={set(key)}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
              </div>
            ))}
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Position</label>
              <select value={form.position} onChange={set('position')}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white transition-colors">
                {['hero', 'middle', 'bottom', 'popup'].map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={set('sort_order')} min={0}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
          </div>

          {/* Image section */}
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Banner Image *</label>

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

            {/* Upload drop zone */}
            {imageMode === 'upload' && !previewUrl && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={e => handleFileSelect(e.target.files)} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full border-2 border-dashed border-nude-300 hover:border-daisy-400 p-10 flex flex-col items-center gap-3 transition-colors disabled:opacity-60">
                  {uploading
                    ? <><Loader2 size={32} className="text-daisy-400 animate-spin" /><span className="font-body text-sm text-daisy-500">Uploading...</span></>
                    : <><Upload size={32} className="text-daisy-300" /><span className="font-body text-sm text-daisy-600">Click to upload banner image</span><span className="font-body text-[11px] text-daisy-400">PNG, JPG, WEBP up to 5 MB</span></>
                  }
                </button>
              </>
            )}

            {/* URL input */}
            {imageMode === 'url' && !previewUrl && (
              <div className="flex gap-3">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-...?w=1920"
                  className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }} />
                <button type="button" onClick={handleAddUrl} className="btn-primary flex items-center gap-2 px-6">
                  <Plus size={16} /> Set
                </button>
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div className="relative">
                <div className="relative w-full h-48 bg-nude-100 overflow-hidden border border-nude-200">
                  <Image src={previewUrl} alt="Banner preview" fill className="object-cover" sizes="800px"
                    onError={() => toast.error('Could not load image — check the URL')} />
                  <span className="absolute top-2 left-2 bg-green-600 text-white font-body text-[10px] px-2 py-1 tracking-widest uppercase">Preview</span>
                </div>
                <button type="button" onClick={clearImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 hover:bg-red-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Footer row */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-daisy-700 w-4 h-4" />
              <span className="font-body text-sm text-daisy-700">Active</span>
            </label>
            <button type="submit" disabled={saving || uploading || !form.image_url}
              className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-60">
              {saving ? <span className="spinner" /> : <Plus size={16} />}
              Add Banner
            </button>
          </div>
        </form>
      </section>

      {/* ── Banners List ────────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200">
          <h2 className="font-heading text-xl text-daisy-800">All Banners ({banners.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin" /></div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-daisy-400">No banners yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-nude-100">
            {banners.map(b => (
              <div key={b.id} className="p-4 hover:bg-nude-50 transition-colors">
                {editingId === b.id ? (
                  /* ── Inline edit row ── */
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <input value={editForm.title || ''} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="Title" className="border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                      <input value={editForm.subtitle || ''} onChange={e => setEditForm(f => ({ ...f, subtitle: e.target.value }))}
                        placeholder="Subtitle" className="border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                      <input value={editForm.link || ''} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))}
                        placeholder="Link (optional)" className="border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                      <select value={editForm.position || 'hero'} onChange={e => setEditForm(f => ({ ...f, position: e.target.value as any }))}
                        className="border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 bg-white transition-colors">
                        {['hero', 'middle', 'bottom', 'popup'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Edit image */}
                    <div className="flex items-center gap-3">
                      {editForm.image_url && (
                        <div className="relative w-24 h-14 bg-nude-100 overflow-hidden border border-nude-200 shrink-0">
                          <Image src={editForm.image_url} alt="edit preview" fill className="object-cover" sizes="96px" />
                        </div>
                      )}
                      <input ref={editFileRef} type="file" accept="image/*"
                        onChange={e => handleEditImageUpload(e.target.files)} className="hidden" />
                      <button type="button" onClick={() => editFileRef.current?.click()} disabled={editUploading}
                        className="flex items-center gap-2 px-4 py-2 border border-nude-200 font-body text-sm text-daisy-600 hover:border-daisy-400 transition-colors disabled:opacity-60">
                        {editUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {editUploading ? 'Uploading...' : 'Change Image'}
                      </button>
                      <input value={editForm.image_url || ''} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                        placeholder="or paste image URL" className="flex-1 border border-nude-200 px-3 py-2 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-2 px-4 py-2 bg-daisy-900 text-cream font-body text-sm hover:bg-daisy-700 transition-colors">
                        <Check size={14} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-2 px-4 py-2 border border-nude-200 font-body text-sm text-daisy-600 hover:border-daisy-400 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-12 bg-nude-100 flex-shrink-0 overflow-hidden border border-nude-100">
                      {b.image_url
                        ? <Image src={b.image_url} alt={b.title} fill className="object-cover" sizes="80px" />
                        : <div className="w-full h-full flex items-center justify-center text-daisy-300"><ImagePlus size={18} /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-medium text-daisy-900 truncate">{b.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-body text-xs text-daisy-400 capitalize">{b.position}</span>
                        <span className={`font-body text-[10px] px-2 py-0.5 ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {b.is_active ? 'Active' : 'Hidden'}
                        </span>
                        {b.link && <span className="font-body text-[10px] text-daisy-400 truncate max-w-[120px]">{b.link}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(b)} title="Edit"
                        className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleBanner(b.id, b.is_active)} title={b.is_active ? 'Hide' : 'Show'}
                        className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors">
                        {b.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button onClick={() => deleteBanner(b.id)} title="Delete"
                        className="p-2 text-daisy-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
