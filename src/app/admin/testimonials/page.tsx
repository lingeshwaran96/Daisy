// src/app/admin/testimonials/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Plus, Trash2, Edit, X, Save, Upload, Star, BadgeCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Testimonial, TestimonialInsert } from '@/types/database';

const EMPTY: Omit<Testimonial, 'id' | 'created_at'> = {
  customer_name: '', customer_photo: null, rating: 5, review_text: '',
  product_name: null, is_verified: false, is_active: true, sort_order: 0,
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('testimonials').select('*').order('sort_order').then(({ data }) => {
      setItems((data as Testimonial[]) || []);
      setLoading(false);
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Not an image'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `testimonials/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    setForm(f => ({ ...f, customer_photo: urlData.publicUrl }));
    toast.success('Photo uploaded!');
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.review_text) { toast.error('Name and review are required'); return; }
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    if (editId) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editId);
      if (error) { toast.error(error.message); }
      else { setItems(i => i.map(x => x.id === editId ? { ...x, ...payload } as Testimonial : x)); toast.success('Updated!'); setEditId(null); setForm(EMPTY); }
    } else {
      const { data, error } = await supabase.from('testimonials').insert([payload]).select().single();
      if (error) { toast.error(error.message); }
      else { setItems(i => [...i, data as Testimonial]); setForm(EMPTY); toast.success('Testimonial added!'); }
    }
    setSaving(false);
  };

  const startEdit = (t: Testimonial) => {
    setEditId(t.id);
    setForm({ customer_name: t.customer_name, customer_photo: t.customer_photo, rating: t.rating, review_text: t.review_text, product_name: t.product_name, is_verified: t.is_verified, is_active: t.is_active, sort_order: t.sort_order });
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    setItems(i => i.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('testimonials').update({ is_active: !active }).eq('id', id);
    setItems(i => i.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-2">Testimonials</h1>
      <p className="font-body text-sm text-daisy-400 mb-10">These appear in the homepage reviews carousel</p>

      {/* Form */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-daisy-800">{editId ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
          {editId && <button onClick={() => { setEditId(null); setForm(EMPTY); }} className="flex items-center gap-1 font-body text-xs text-daisy-400 hover:text-daisy-900"><X size={14}/> Cancel</button>}
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Customer Name *</label>
              <input type="text" value={form.customer_name} onChange={set('customer_name')} placeholder="e.g. Priya Sharma"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Product Name</label>
              <input type="text" value={form.product_name || ''} onChange={set('product_name')} placeholder="e.g. Gold Necklace Set"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Rating *</label>
              <div className="flex gap-1 pt-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                    <Star size={24} className={n <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-daisy-200'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} min={0} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Review Text *</label>
            <textarea value={form.review_text} onChange={set('review_text')} rows={3} placeholder="What did the customer say?"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors resize-none" />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-3">Customer Photo (optional)</label>
            {form.customer_photo ? (
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-nude-200">
                  <Image src={form.customer_photo} alt="preview" width={64} height={64} className="object-cover w-full h-full" />
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, customer_photo: null }))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 border border-dashed border-nude-300 px-4 py-3 font-body text-sm text-daisy-500 hover:border-daisy-400 transition-colors disabled:opacity-60">
                  {uploading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_verified} onChange={set('is_verified')} className="accent-daisy-700 w-4 h-4" />
              <span className="font-body text-sm text-daisy-700 flex items-center gap-1"><BadgeCheck size={14} className="text-blue-500"/>Verified Badge</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-daisy-700 w-4 h-4" />
              <span className="font-body text-sm text-daisy-700">Active</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin"/> : editId ? <Save size={16}/> : <Plus size={16}/>}
              {editId ? 'Update' : 'Add Testimonial'}
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200">
          <h2 className="font-heading text-xl text-daisy-800">All Testimonials ({items.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin"/></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-daisy-400">No testimonials yet. Add one above.</div>
        ) : (
          <div className="divide-y divide-nude-100">
            {items.map(t => (
              <div key={t.id} className="flex items-start gap-4 p-4 hover:bg-nude-50 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-nude-100 border border-nude-200 flex-shrink-0">
                  {t.customer_photo
                    ? <Image src={t.customer_photo} alt={t.customer_name} width={40} height={40} className="object-cover w-full h-full"/>
                    : <div className="w-full h-full flex items-center justify-center text-daisy-400 font-heading">{t.customer_name[0]}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-body text-sm font-medium text-daisy-900">{t.customer_name}</p>
                    {t.is_verified && <BadgeCheck size={13} className="text-blue-500"/>}
                    <span className={`font-body text-[10px] px-2 py-0.5 ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-daisy-100'}/>)}
                  </div>
                  <p className="font-body text-xs text-daisy-600 line-clamp-2">{t.review_text}</p>
                  {t.product_name && <p className="font-body text-[10px] text-daisy-400 mt-0.5">Product: {t.product_name}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(t)} className="p-2 text-daisy-400 hover:text-daisy-900 transition-colors"><Edit size={15}/></button>
                  <button onClick={() => toggleActive(t.id, t.is_active)} className="p-2 text-daisy-400 hover:text-daisy-700 transition-colors">
                    <span className="font-body text-[10px]">{t.is_active ? 'Hide' : 'Show'}</span>
                  </button>
                  <button onClick={() => deleteItem(t.id)} className="p-2 text-daisy-400 hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
