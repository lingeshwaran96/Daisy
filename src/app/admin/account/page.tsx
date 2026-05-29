// src/app/admin/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function AdminAccountPage() {
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '' });
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from('users').select('full_name, phone').eq('id', user.id).single();
      setProfile({ full_name: data?.full_name || '', email: user.email || '', phone: data?.phone || '' });
      setLoading(false);
    });
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (profile.email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email: profile.email });
      if (error) { toast.error(error.message); setSavingProfile(false); return; }
    }
    const { error } = await supabase.from('users').update({
      full_name: profile.full_name, phone: profile.phone, updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
    setSavingProfile(false);
  };

  const changePassword = async () => {
    if (passwords.newPass.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    if (error) toast.error(error.message);
    else { toast.success('Password changed!'); setPasswords({ newPass: '', confirm: '' }); }
    setSavingPass(false);
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 size={24} className="text-daisy-400 animate-spin"/></div>;

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <h1 className="font-heading text-4xl text-daisy-900 font-light mb-10">Account Settings</h1>

      <section className="bg-white border border-nude-200 p-6 mb-6">
        <h2 className="font-heading text-xl text-daisy-800 mb-6 flex items-center gap-2"><User size={18}/> Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Full Name</label>
            <input type="text" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Admin Name" className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Email</label>
            <input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
            <p className="font-body text-[10px] text-daisy-400 mt-1">Changing email sends a confirmation to both addresses</p>
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Phone</label>
            <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210" className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
          </div>
          <button onClick={saveProfile} disabled={savingProfile} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingProfile ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Save Profile
          </button>
        </div>
      </section>

      <section className="bg-white border border-nude-200 p-6">
        <h2 className="font-heading text-xl text-daisy-800 mb-6 flex items-center gap-2"><Lock size={18}/> Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">New Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={passwords.newPass}
                onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="Min 8 characters"
                className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 pr-12"/>
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-daisy-400">
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Confirm Password</label>
            <input type={showPass ? 'text' : 'password'} value={passwords.confirm}
              onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password"
              className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400"/>
          </div>
          <button onClick={changePassword} disabled={savingPass} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {savingPass ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>} Change Password
          </button>
        </div>
      </section>
    </div>
  );
}
