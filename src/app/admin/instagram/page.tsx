// src/app/admin/instagram/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Trash2, Eye, EyeOff, Upload, Link as LinkIcon,
  ImagePlus, Loader2, X, Pencil, Check, Instagram, ExternalLink, Save, AtSign, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { InstagramPost, InstagramPostInsert } from '@/types/database';

const EMPTY: InstagramPostInsert = {
  image_url: '', caption: null, post_url: null,
  is_active: true, sort_order: 0,
};

type ImageMode = 'upload' | 'url';

export default function AdminInstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [form, setForm] = useState<InstagramPostInsert>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageMode, setImageMode] = useState<ImageMode>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InstagramPost>>({});
  const [editUploading, setEditUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // ── Profile settings state ─────────────────────────────────────────────────
  const [instaHandle, setInstaHandle] = useState('@daisy.jewels');
  const [instaHashtag, setInstaHashtag] = useState('#DaisyElegance');
  const [instaProfileUrl, setInstaProfileUrl] = useState('https://instagram.com/daisy.jewels');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    // Fetch posts
    supabase.from('instagram_posts').select('*').order('sort_order').then(({ data }) => {
      setPosts((data as InstagramPost[]) || []);
      setLoading(false);
    });

    // Fetch profile settings from site_settings
    supabase.from('site_settings').select('key, value')
      .in('key', ['instagram_handle', 'instagram_hashtag', 'instagram_profile_url'])
      .then(({ data }) => {
        if (data) {
          data.forEach((row: { key: string; value: string }) => {
            if (row.key === 'instagram_handle') setInstaHandle(row.value);
            if (row.key === 'instagram_hashtag') setInstaHashtag(row.value);
            if (row.key === 'instagram_profile_url') setInstaProfileUrl(row.value);
          });
        }
        setSettingsLoaded(true);
      });
  }, []);

  // ── Save profile settings ──────────────────────────────────────────────────
  const saveProfileSettings = async () => {
    setSavingSettings(true);
    try {
      const settings = [
        { key: 'instagram_handle', value: instaHandle },
        { key: 'instagram_hashtag', value: instaHashtag },
        { key: 'instagram_profile_url', value: instaProfileUrl },
      ];

      for (const s of settings) {
        const { error } = await supabase.from('site_settings')
          .upsert({ key: s.key, value: s.value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
      }

      toast.success('Instagram profile settings saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Upload helper ──────────────────────────────────────────────────────────
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5 MB)`); return null; }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `instagram/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Try banner-images bucket first, then product-images as fallback
    let bucket = 'banner-images';
    let result = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (result.error && (result.error.message.includes('not found') || result.error.message.includes('Bucket'))) {
      bucket = 'product-images';
      result = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
    }

    if (result.error) {
      toast.error(`Upload failed: ${result.error.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(result.data.path);
    return urlData?.publicUrl ?? null;
  };

  // ── Add-post handlers ──────────────────────────────────────────────────────
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { toast.error('Image is required'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('instagram_posts').insert([form]).select().single();
    if (error) { toast.error(error.message); }
    else {
      setPosts(p => [...p, data as InstagramPost]);
      setForm(EMPTY);
      setPreviewUrl('');
      toast.success('Instagram post added!');
    }
    setSaving(false);
  };

  // ── Existing-post handlers ─────────────────────────────────────────────────
  const togglePost = async (id: string, active: boolean) => {
    await supabase.from('instagram_posts').update({ is_active: !active }).eq('id', id);
    setPosts(p => p.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this Instagram post?')) return;
    await supabase.from('instagram_posts').delete().eq('id', id);
    setPosts(p => p.filter(x => x.id !== id));
    toast.success('Post deleted');
  };

  const startEdit = (post: InstagramPost) => {
    setEditingId(post.id);
    setEditForm({
      image_url: post.image_url, caption: post.caption,
      post_url: post.post_url, sort_order: post.sort_order,
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('instagram_posts').update(editForm).eq('id', editingId);
    if (error) { toast.error(error.message); return; }
    setPosts(p => p.map(x => x.id === editingId ? { ...x, ...editForm } as InstagramPost : x));
    setEditingId(null);
    toast.success('Post updated!');
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
      <div className="flex items-center gap-3 mb-10">
        <Instagram size={28} className="text-daisy-600" />
        <div>
          <h1 className="font-heading text-4xl text-daisy-900 font-light">Instagram Gallery</h1>
          <p className="font-body text-sm text-daisy-500 mt-1">
            Manage the Instagram section on your homepage. Add new posts whenever you post on Instagram.
          </p>
        </div>
      </div>

      {/* ── Instagram Profile Settings ───────────────────────────────────── */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl text-daisy-800">Profile Settings</h2>
            <p className="font-body text-xs text-daisy-400 mt-1">
              Your Instagram handle and hashtag shown on the homepage
            </p>
          </div>
          {settingsLoaded && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="font-body text-[10px] text-green-700 tracking-widest uppercase">Live on Homepage</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-6">
          <div>
            <label className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2 flex items-center gap-1.5">
              <AtSign size={12} /> Instagram Handle
            </label>
            <input type="text" value={instaHandle}
              onChange={e => setInstaHandle(e.target.value)}
              placeholder="@yourusername"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors mt-1" />
          </div>
          <div>
            <label className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2 flex items-center gap-1.5">
              <Hash size={12} /> Hashtag
            </label>
            <input type="text" value={instaHashtag}
              onChange={e => setInstaHashtag(e.target.value)}
              placeholder="#YourHashtag"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors mt-1" />
          </div>
          <div>
            <label className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2 flex items-center gap-1.5">
              <LinkIcon size={12} /> Profile URL
            </label>
            <input type="text" value={instaProfileUrl}
              onChange={e => setInstaProfileUrl(e.target.value)}
              placeholder="https://instagram.com/yourusername"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors mt-1" />
          </div>
        </div>

        {/* Preview + Save */}
        <div className="flex items-center justify-between pt-4 border-t border-nude-100">
          <div className="font-body text-xs text-daisy-400">
            Preview: <span className="text-daisy-800 font-medium">{instaHandle}</span> · Tag us with <strong>{instaHashtag}</strong>
          </div>
          <button onClick={saveProfileSettings} disabled={savingSettings}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Settings
          </button>
        </div>
      </section>

      {/* ── How it works tip ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-5 mb-8">
        <h3 className="font-body text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <Instagram size={16} className="text-purple-600" />
          How Auto-Sync Works
        </h3>
        <ul className="font-body text-xs text-purple-700 space-y-1.5 leading-relaxed">
          <li>• <strong>Upload images</strong> or <strong>paste URLs</strong> of your Instagram posts here</li>
          <li>• Paste the <strong>Instagram post link</strong> so visitors can tap through to your profile</li>
          <li>• The homepage gallery <strong>instantly reflects</strong> any changes you make here</li>
          <li>• <strong>Toggle visibility</strong> to show/hide posts without deleting them</li>
          <li>• Change your <strong>handle & hashtag</strong> above — it updates on homepage immediately</li>
        </ul>
      </div>

      {/* ── Add Post Form ────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <h2 className="font-heading text-xl text-daisy-800 mb-6">Add New Post</h2>
        <form onSubmit={handleSave} className="space-y-6">

          {/* Text fields */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">
                Caption (optional)
              </label>
              <input type="text" placeholder="e.g. Our latest collection 💎"
                value={form.caption || ''} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">
                Instagram Post URL (optional)
              </label>
              <input type="text" placeholder="https://www.instagram.com/p/..."
                value={form.post_url || ''} onChange={e => setForm(f => ({ ...f, post_url: e.target.value }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} min={0}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
          </div>

          {/* Image section */}
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Post Image *</label>

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
                    : <><Upload size={32} className="text-daisy-300" /><span className="font-body text-sm text-daisy-600">Click to upload Instagram image</span><span className="font-body text-[11px] text-daisy-400">PNG, JPG, WEBP up to 5 MB</span></>
                  }
                </button>
              </>
            )}

            {/* URL input */}
            {imageMode === 'url' && !previewUrl && (
              <div className="flex gap-3">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-...?w=400"
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
                  <Image src={previewUrl} alt="Post preview" fill className="object-cover" sizes="800px"
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
              <input type="checkbox" checked={form.is_active}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                className="accent-daisy-700 w-4 h-4" />
              <span className="font-body text-sm text-daisy-700">Active</span>
            </label>
            <button type="submit" disabled={saving || uploading || !form.image_url}
              className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-60">
              {saving ? <span className="spinner" /> : <Plus size={16} />}
              Add Post
            </button>
          </div>
        </form>
      </section>

      {/* ── Posts Grid ────────────────────────────────────────────────────── */}
      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200 flex items-center justify-between">
          <h2 className="font-heading text-xl text-daisy-800">All Posts ({posts.length})</h2>
          <p className="font-body text-xs text-daisy-400">Shows on homepage in sort order</p>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center">
            <Instagram size={40} className="text-daisy-200 mx-auto mb-3" />
            <p className="font-body text-sm text-daisy-400">No Instagram posts yet. Add some above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-nude-100">
            {posts.map(p => (
              <div key={p.id} className="bg-white relative group">
                {editingId === p.id ? (
                  /* ── Inline edit ── */
                  <div className="p-4 space-y-3">
                    <div className="relative w-full aspect-square bg-nude-100 overflow-hidden border border-nude-200">
                      {editForm.image_url && (
                        <Image src={editForm.image_url} alt="edit preview" fill className="object-cover" sizes="300px" />
                      )}
                    </div>
                    <input ref={editFileRef} type="file" accept="image/*"
                      onChange={e => handleEditImageUpload(e.target.files)} className="hidden" />
                    <button type="button" onClick={() => editFileRef.current?.click()} disabled={editUploading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-nude-200 font-body text-xs text-daisy-600 hover:border-daisy-400 transition-colors disabled:opacity-60">
                      {editUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {editUploading ? 'Uploading...' : 'Change Image'}
                    </button>
                    <input value={editForm.caption || ''} onChange={e => setEditForm(f => ({ ...f, caption: e.target.value }))}
                      placeholder="Caption" className="w-full border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400 transition-colors" />
                    <input value={editForm.post_url || ''} onChange={e => setEditForm(f => ({ ...f, post_url: e.target.value }))}
                      placeholder="Instagram post URL" className="w-full border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400 transition-colors" />
                    <input type="number" value={editForm.sort_order ?? 0} onChange={e => setEditForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      placeholder="Sort order" className="w-full border border-nude-200 px-3 py-2 font-body text-xs outline-none focus:border-daisy-400 transition-colors" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-daisy-900 text-cream font-body text-xs hover:bg-daisy-700 transition-colors">
                        <Check size={12} /> Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-nude-200 font-body text-xs text-daisy-600 hover:border-daisy-400 transition-colors">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal card ── */
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={p.image_url} alt={p.caption || 'Instagram post'} fill
                        className="object-cover" sizes="(max-width: 768px) 50vw, 33vw"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => startEdit(p)} title="Edit"
                          className="p-2 bg-white/90 text-daisy-900 hover:bg-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => togglePost(p.id, p.is_active)} title={p.is_active ? 'Hide' : 'Show'}
                          className="p-2 bg-white/90 text-daisy-900 hover:bg-white transition-colors">
                          {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {p.post_url && (
                          <a href={p.post_url} target="_blank" rel="noopener noreferrer" title="View on Instagram"
                            className="p-2 bg-white/90 text-daisy-900 hover:bg-white transition-colors">
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button onClick={() => deletePost(p.id)} title="Delete"
                          className="p-2 bg-white/90 text-red-600 hover:bg-white transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {/* Status badges */}
                      {!p.is_active && (
                        <span className="absolute top-2 left-2 bg-gray-800/80 text-white font-body text-[9px] px-2 py-0.5 tracking-widest uppercase">
                          Hidden
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/60 text-white font-body text-[9px] px-2 py-0.5">
                        #{p.sort_order}
                      </span>
                    </div>
                    {p.caption && (
                      <p className="px-3 py-2 font-body text-xs text-daisy-600 truncate border-t border-nude-100">
                        {p.caption}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
