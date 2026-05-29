// src/app/admin/products/new/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, X, Plus, Save, Link as LinkIcon, ImagePlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [variants, setVariants] = useState<{ name: string; options: string }[]>([]);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', short_description: '',
    price: '', offer_price: '', stock: '',
    category_id: '', material: '', weight: '', occasion: '',
    is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false,
    meta_title: '', meta_description: '', video_url: '',
  });

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).then(({ data }) => {
      setCategories((data as Category[]) || []);
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === 'name') {
      setForm((f) => ({
        ...f,
        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }));
    }
  };

  // Upload file to Supabase Storage
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      // Validate size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (error) {
        // If bucket doesn't exist, try creating it or show helpful error
        if (error.message.includes('not found') || error.message.includes('Bucket')) {
          toast.error('Storage bucket "product-images" not found. Please create it in Supabase Dashboard → Storage.');
        } else {
          toast.error(`Upload failed: ${error.message}`);
        }
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      setImages(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded!`);
    }
    setUploading(false);
  };

  // Add URL to images list
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    setImages(prev => [...prev, urlInput.trim()]);
    setUrlInput('');
    toast.success('Image URL added!');
  };

  // Remove image from list
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);

    const specsObj = specs.reduce((acc: Record<string, string>, { key, value }) => {
      if (key && value) acc[key] = value;
      return acc;
    }, {});

    const variantsArr = variants
      .filter((v) => v.name && v.options)
      .map((v) => ({ name: v.name, options: v.options.split(',').map((o) => o.trim()) }));

    const payload = {
      ...form,
      price: parseFloat(form.price),
      offer_price: form.offer_price ? parseFloat(form.offer_price) : null,
      stock: parseInt(form.stock) || 0,
      images: images.filter(Boolean),
      variants: variantsArr,
      specifications: Object.keys(specsObj).length ? specsObj : null,
      tags: [],
    };

    const { error } = await supabase.from('products').insert([payload]);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Product added successfully!');
    router.push('/admin/products');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Add New Product</h1>
        <p className="font-body text-sm text-daisy-500 mt-1">Fill in the details below</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Info */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-6">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Product Name *</label>
              <input type="text" value={form.name} onChange={set('name')} required
                placeholder="e.g. 925 Silver Lotus Necklace"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Slug (URL)</label>
              <input type="text" value={form.slug} onChange={set('slug')}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-600 outline-none focus:border-daisy-400 transition-colors bg-nude-50" />
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Category *</label>
              <select value={form.category_id} onChange={set('category_id')} required
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors bg-white">
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Short Description</label>
              <input type="text" value={form.short_description} onChange={set('short_description')}
                placeholder="Brief one-liner for product cards"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Material</label>
              <input type="text" value={form.material} onChange={set('material')}
                placeholder="e.g. 925 Sterling Silver"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div className="md:col-span-2">
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Full Description (HTML supported)</label>
              <textarea value={form.description} onChange={set('description')} rows={5}
                placeholder="Full product description. You can use basic HTML."
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors resize-none" />
            </div>
          </div>
        </section>

        {/* Pricing & Stock */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-6">Pricing & Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { key: 'price', label: 'Price (₹) *', placeholder: '1299' },
              { key: 'offer_price', label: 'Sale Price (₹)', placeholder: '999 (optional)' },
              { key: 'stock', label: 'Stock Quantity', placeholder: '10' },
              { key: 'weight', label: 'Weight', placeholder: 'e.g. 5g' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">{label}</label>
                <input type={key === 'weight' ? 'text' : 'number'} value={(form as any)[key]} onChange={set(key)}
                  placeholder={placeholder}
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* Images - DUAL MODE (Upload + URL) */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-2">Product Images</h2>
          <p className="font-body text-xs text-daisy-400 mb-6">Upload images directly or paste image URLs</p>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => setImageMode('upload')}
              className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all duration-200 ${
                imageMode === 'upload'
                  ? 'bg-daisy-900 text-cream border-daisy-900'
                  : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
              }`}>
              <ImagePlus size={16} />
              Upload Image
            </button>
            <button type="button" onClick={() => setImageMode('url')}
              className={`flex items-center gap-2 px-4 py-2.5 font-body text-sm border transition-all duration-200 ${
                imageMode === 'url'
                  ? 'bg-daisy-900 text-cream border-daisy-900'
                  : 'border-nude-200 text-daisy-600 hover:border-daisy-400'
              }`}>
              <LinkIcon size={16} />
              Paste URL
            </button>
          </div>

          {/* Upload Mode */}
          {imageMode === 'upload' && (
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-nude-300 hover:border-daisy-400 p-8 flex flex-col items-center gap-3 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={32} className="text-daisy-400 animate-spin" />
                    <span className="font-body text-sm text-daisy-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-daisy-300" />
                    <span className="font-body text-sm text-daisy-600">Click to upload images</span>
                    <span className="font-body text-[11px] text-daisy-400">PNG, JPG, WEBP up to 5MB each • Multiple files supported</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* URL Mode */}
          {imageMode === 'url' && (
            <div className="flex gap-3 mb-6">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="btn-primary flex items-center gap-2 px-6"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          )}

          {/* Image Previews */}
          {images.length > 0 && (
            <div>
              <p className="font-body text-xs tracking-widest uppercase text-daisy-500 mb-3">
                {images.length} Image{images.length !== 1 ? 's' : ''} Added
              </p>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative group aspect-square bg-nude-100 border border-nude-200 overflow-hidden">
                    <Image
                      src={url}
                      alt={`Product image ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
                    />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 bg-daisy-700 text-cream font-body text-[9px] px-1.5 py-0.5 tracking-widest uppercase">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="font-body text-[11px] text-daisy-400 mt-2">First image will be used as the main product image. Drag to reorder (coming soon).</p>
            </div>
          )}

          {/* Video URL */}
          <div className="mt-6">
            <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Video URL (optional)</label>
            <input type="url" value={form.video_url} onChange={set('video_url')} placeholder="https://..."
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm text-daisy-900 outline-none focus:border-daisy-400 transition-colors" />
          </div>
        </section>

        {/* Variants */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-2">Product Variants</h2>
          <p className="font-body text-xs text-daisy-400 mb-6">e.g. Size: S, M, L — separate options with commas</p>
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="flex gap-3">
                <input type="text" placeholder="Variant name (e.g. Size)" value={v.name}
                  onChange={(e) => { const u = [...variants]; u[i].name = e.target.value; setVariants(u); }}
                  className="w-40 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                <input type="text" placeholder="Options (e.g. S, M, L)" value={v.options}
                  onChange={(e) => { const u = [...variants]; u[i].options = e.target.value; setVariants(u); }}
                  className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                <button type="button" onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                  className="p-3 text-daisy-400 hover:text-red-500 border border-nude-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setVariants([...variants, { name: '', options: '' }])}
              className="flex items-center gap-2 font-body text-sm text-daisy-600 hover:text-daisy-900 transition-colors">
              <Plus size={16} /> Add Variant
            </button>
          </div>
        </section>

        {/* Specifications */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-6">Specifications</h2>
          <div className="space-y-3">
            {specs.map((s, i) => (
              <div key={i} className="flex gap-3">
                <input type="text" placeholder="Key (e.g. Metal)" value={s.key}
                  onChange={(e) => { const u = [...specs]; u[i].key = e.target.value; setSpecs(u); }}
                  className="w-48 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                <input type="text" placeholder="Value (e.g. 925 Sterling Silver)" value={s.value}
                  onChange={(e) => { const u = [...specs]; u[i].value = e.target.value; setSpecs(u); }}
                  className="flex-1 border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
                <button type="button" onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                  className="p-3 text-daisy-400 hover:text-red-500 border border-nude-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setSpecs([...specs, { key: '', value: '' }])}
              className="flex items-center gap-2 font-body text-sm text-daisy-600 hover:text-daisy-900 transition-colors">
              <Plus size={16} /> Add Specification
            </button>
          </div>
        </section>

        {/* Flags */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-6">Product Flags</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'is_active', label: 'Active (visible)' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_bestseller', label: 'Best Seller' },
              { key: 'is_new_arrival', label: 'New Arrival' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer p-3 border border-nude-200 hover:border-daisy-400 transition-colors">
                <input type="checkbox" checked={(form as any)[key]} onChange={set(key)} className="accent-daisy-700 w-4 h-4" />
                <span className="font-body text-sm text-daisy-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* SEO */}
        <section className="bg-white border border-nude-200 p-6">
          <h2 className="font-heading text-xl text-daisy-800 mb-6">SEO (Optional)</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Meta Title</label>
              <input type="text" value={form.meta_title} onChange={set('meta_title')} placeholder="SEO title"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-daisy-500 mb-2">Meta Description</label>
              <textarea value={form.meta_description} onChange={set('meta_description')} rows={2} placeholder="SEO description (max 160 chars)"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors resize-none" />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? <span className="spinner" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Product'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-outline">Cancel</button>
        </div>
      </form>
    </div>
  );
}
