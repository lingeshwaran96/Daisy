// src/app/admin/menu/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, X, Save, GripVertical, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { MenuItem, MenuItemInsert } from '@/types/database';

const EMPTY: Omit<MenuItem, 'id' | 'created_at'> = {
  label: '', href: '', parent_id: null, sort_order: 0, is_active: true, open_in_new_tab: false,
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('menu_items').select('*').order('sort_order').then(({ data }) => {
      setItems((data as MenuItem[]) || []);
      setLoading(false);
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.href) { toast.error('Label and URL are required'); return; }
    setSaving(true);
    const payload = { ...form, sort_order: Number(form.sort_order) || 0 };
    if (editId) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editId);
      if (error) { toast.error(error.message); }
      else {
        setItems(i => i.map(x => x.id === editId ? { ...x, ...payload } as MenuItem : x));
        toast.success('Menu item updated!'); setEditId(null); setForm(EMPTY);
      }
    } else {
      const { data, error } = await supabase.from('menu_items').insert([payload]).select().single();
      if (error) { toast.error(error.message); }
      else { setItems(i => [...i, data as MenuItem]); setForm(EMPTY); toast.success('Menu item added!'); }
    }
    setSaving(false);
  };

  const startEdit = (item: MenuItem) => {
    setEditId(item.id);
    setForm({ label: item.label, href: item.href, parent_id: item.parent_id, sort_order: item.sort_order, is_active: item.is_active, open_in_new_tab: item.open_in_new_tab });
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    await supabase.from('menu_items').delete().eq('id', id);
    setItems(i => i.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('menu_items').update({ is_active: !active }).eq('id', id);
    setItems(i => i.map(x => x.id === id ? { ...x, is_active: !active } : x));
  };

  const updateOrder = async (id: string, sort_order: number) => {
    await supabase.from('menu_items').update({ sort_order }).eq('id', id);
    setItems(i => i.map(x => x.id === id ? { ...x, sort_order } : x).sort((a, b) => a.sort_order - b.sort_order));
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-10">
        <h1 className="font-heading text-4xl text-daisy-900 font-light">Navigation Menu</h1>
        <p className="font-body text-sm text-daisy-400 mt-1">Manage top navigation links</p>
      </div>

      {/* Form */}
      <section className="bg-white border border-nude-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl text-daisy-800">{editId ? 'Edit Item' : 'Add Menu Item'}</h2>
          {editId && (
            <button onClick={() => { setEditId(null); setForm(EMPTY); }}
              className="flex items-center gap-1 font-body text-xs text-daisy-400 hover:text-daisy-900">
              <X size={14}/> Cancel
            </button>
          )}
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Label *</label>
              <input type="text" value={form.label} onChange={set('label')} placeholder="e.g. Collections"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">URL *</label>
              <input type="text" value={form.href} onChange={set('href')} placeholder="e.g. /collections"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
            </div>
            <div>
              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Sort Order</label>
              <input type="number" value={form.sort_order} min={0}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="accent-daisy-700 w-4 h-4"/>
              <span className="font-body text-sm text-daisy-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.open_in_new_tab} onChange={set('open_in_new_tab')} className="accent-daisy-700 w-4 h-4"/>
              <span className="font-body text-sm text-daisy-700 flex items-center gap-1"><ExternalLink size={12}/> Open in new tab</span>
            </label>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-60">
              {saving ? <Loader2 size={16} className="animate-spin"/> : editId ? <Save size={16}/> : <Plus size={16}/>}
              {editId ? 'Update' : 'Add Item'}
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200">
          <h2 className="font-heading text-xl text-daisy-800">Menu Items ({items.length})</h2>
          <p className="font-body text-[11px] text-daisy-400 mt-0.5">Changes reflect on the navbar immediately</p>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin"/></div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-daisy-400">No menu items yet.</div>
        ) : (
          <div className="divide-y divide-nude-100">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-nude-50">
                <GripVertical size={16} className="text-daisy-200 flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-medium text-daisy-900">{item.label}</p>
                  <p className="font-body text-xs text-daisy-400">{item.href}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={item.sort_order} min={0}
                    onChange={e => updateOrder(item.id, parseInt(e.target.value) || 0)}
                    className="w-14 border border-nude-200 px-2 py-1 font-body text-xs text-center outline-none"/>
                  <span className={`font-body text-[10px] px-2 py-0.5 ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <button onClick={() => startEdit(item)} className="p-2 text-daisy-400 hover:text-daisy-900"><Edit size={14}/></button>
                  <button onClick={() => toggleActive(item.id, item.is_active)} className="p-2 text-daisy-400 hover:text-daisy-700">
                    {item.is_active ? <EyeOff size={14}/> : <Eye size={14}/>}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-daisy-400 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
