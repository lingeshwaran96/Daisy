// src/app/admin/coupons/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { Coupon, CouponInsert } from '@/types/database';

const EMPTY: CouponInsert = { code:'', description:'', type:'percentage', value:10, min_order_amount:0, max_uses:100, used_count:0, is_active:true, expires_at:null };

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponInsert>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false }).then(({ data }) => setCoupons((data as Coupon[]) || []));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) { toast.error('Coupon code is required'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('coupons').insert([{ ...form, code: form.code.toUpperCase() }]).select().single();
    if (error) { toast.error(error.message); } else {
      setCoupons(c => [data as Coupon, ...c]);
      setForm(EMPTY);
      toast.success('Coupon created!');
    }
    setSaving(false);
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from('coupons').update({ is_active: !active }).eq('id', id);
    setCoupons(c => c.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    setCoupons(c => c.filter(x => x.id !== id));
    toast.success('Coupon deleted');
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Coupons</h1>

      {/* Add Form */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <h2 className="font-heading text-xl text-daisy-800 mb-6">Create Coupon</h2>
        <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-5">
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Code *</label>
            <input type="text" placeholder="WELCOME10" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm uppercase outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Type</label>
            <select value={form.type} onChange={set('type')} className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white transition-colors">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </select>
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">
              {form.type === 'percentage' ? 'Discount (%)' : 'Discount (₹)'}
            </label>
            <input type="number" placeholder={form.type === 'percentage' ? '10' : '100'} value={form.value} onChange={set('value')} min={1}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Min Order (₹)</label>
            <input type="number" value={form.min_order_amount} onChange={set('min_order_amount')} min={0}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Max Uses</label>
            <input type="number" value={form.max_uses} onChange={set('max_uses')} min={1}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Expires (optional)</label>
            <input type="datetime-local" onChange={e => setForm(f => ({ ...f, expires_at: e.target.value || null }))}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Description</label>
            <input type="text" placeholder="e.g. Welcome offer" value={form.description || ''} onChange={set('description')}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors" />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60 ml-auto">
              {saving ? <span className="spinner"/> : <Plus size={16}/>}
              Create Coupon
            </button>
          </div>
        </form>
      </section>

      {/* Coupons List */}
      <div className="bg-white border border-nude-200 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-nude-50 border-b border-nude-200">
            <tr>
              {['Code','Type','Value','Min Order','Uses','Status','Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-nude-100">
            {coupons.map(c => (
              <tr key={c.id} className="hover:bg-nude-50 transition-colors">
                <td className="px-5 py-4 font-body text-sm font-bold text-daisy-900 tracking-widest">{c.code}</td>
                <td className="px-5 py-4 font-body text-sm text-daisy-600 capitalize">{c.type}</td>
                <td className="px-5 py-4 font-body text-sm text-daisy-900">
                  {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                </td>
                <td className="px-5 py-4 font-body text-sm text-daisy-600">₹{c.min_order_amount}</td>
                <td className="px-5 py-4 font-body text-sm text-daisy-600">{c.used_count}/{c.max_uses}</td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleCoupon(c.id, c.is_active)} className="flex items-center gap-1.5">
                    {c.is_active
                      ? <ToggleRight size={20} className="text-green-500"/>
                      : <ToggleLeft size={20} className="text-daisy-300"/>
                    }
                    <span className={`font-body text-xs ${c.is_active ? 'text-green-600' : 'text-daisy-400'}`}>
                      {c.is_active ? 'Active' : 'Off'}
                    </span>
                  </button>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-daisy-400 hover:text-red-500 transition-colors">
                    <Trash2 size={15}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
