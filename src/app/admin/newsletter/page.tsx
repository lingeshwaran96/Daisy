// src/app/admin/newsletter/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Download, Trash2, Search, Mail, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import type { NewsletterSubscriber } from '@/types/database';

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState({ title: '', description: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
      supabase.from('site_settings').select('*').in('key', ['newsletter_title', 'newsletter_description']),
    ]).then(([{ data: subs }, { data: sets }]) => {
      setSubscribers((subs as NewsletterSubscriber[]) || []);
      const s: Record<string, string> = {};
      (sets || []).forEach((r: any) => { s[r.key] = r.value || ''; });
      setSettings({ title: s.newsletter_title || '', description: s.newsletter_description || '' });
      setLoading(false);
    });
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('site_settings').upsert([{ key, value, updated_at: new Date().toISOString() }], { onConflict: 'key' });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await Promise.all([
      saveSetting('newsletter_title', settings.title),
      saveSetting('newsletter_description', settings.description),
    ]);
    toast.success('Newsletter settings saved!');
    setSavingSettings(false);
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm('Remove this subscriber?')) return;
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    setSubscribers(s => s.filter(x => x.id !== id));
    toast.success('Removed');
  };

  const exportCSV = () => {
    const rows = ['Email,Name,Date', ...filtered.map(s =>
      `${s.email},${s.name || ''},${new Date(s.subscribed_at).toLocaleDateString('en-IN')}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = subscribers.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Newsletter</h1>

      <section className="bg-white border border-nude-200 p-6 mb-8">
        <h2 className="font-heading text-xl text-daisy-800 mb-6">Homepage Newsletter Block</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Title</label>
            <input type="text" value={settings.title} onChange={e => setSettings(s => ({ ...s, title: e.target.value }))}
              placeholder="Join the DAISY Circle"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400" />
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Description</label>
            <textarea value={settings.description} onChange={e => setSettings(s => ({ ...s, description: e.target.value }))} rows={2}
              placeholder="Get early access to new collections and exclusive offers."
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 resize-none" />
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingSettings ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Settings
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: subscribers.length, icon: Users, color: 'text-daisy-800' },
          { label: 'Active', value: subscribers.filter(s => s.is_active).length, icon: Mail, color: 'text-green-700' },
          { label: 'This Month', value: subscribers.filter(s => new Date(s.subscribed_at) > new Date(Date.now() - 30*86400000)).length, icon: Users, color: 'text-daisy-800' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-nude-200 p-5">
            <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500 flex items-center gap-2"><Icon size={12}/>{label}</p>
            <p className={`font-heading text-3xl mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white border border-nude-200">
        <div className="px-6 py-4 border-b border-nude-200 flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-heading text-xl text-daisy-800">Subscribers ({filtered.length})</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-daisy-400"/>
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-nude-200 font-body text-sm outline-none focus:border-daisy-400 w-48"/>
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 btn-outline text-xs py-2 px-4">
              <Download size={14}/> Export CSV
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center font-body text-sm text-daisy-400">No subscribers yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-nude-50 border-b border-nude-200">
                <tr>{['Email','Name','Date','Status',''].map(h =>
                  <th key={h} className="text-left px-5 py-3 font-body text-[10px] tracking-widest uppercase text-daisy-500">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-nude-100">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-nude-50">
                    <td className="px-5 py-3 font-body text-sm text-daisy-900">{s.email}</td>
                    <td className="px-5 py-3 font-body text-sm text-daisy-600">{s.name || '—'}</td>
                    <td className="px-5 py-3 font-body text-xs text-daisy-400">{new Date(s.subscribed_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`font-body text-[10px] px-2 py-0.5 ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => deleteSubscriber(s.id)} className="text-daisy-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
