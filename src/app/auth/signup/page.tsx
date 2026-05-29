// src/app/auth/signup/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('🌸 Account created! Please check your email to verify.');
    router.push('/auth/login');
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/profile` },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative */}
      <div className="hidden lg:flex flex-1 bg-daisy-950 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1000&q=80')" }} />
        <div className="relative text-center z-10 px-12">
          <Link href="/" className="inline-block mb-10">
            <span className="font-heading text-5xl text-cream tracking-[0.4em] uppercase">Daisy</span>
            <p className="font-body text-[11px] tracking-[0.35em] text-cream/50 mt-1">Elegance That Blooms</p>
          </Link>
          <p className="font-heading text-2xl text-cream/70 font-light leading-relaxed">
            Join thousands of women<br />who wear their elegance daily
          </p>
          <div className="flex items-center justify-center gap-8 mt-10">
            {[['10K+', 'Happy Customers'], ['500+', 'Unique Designs'], ['4.9★', 'Rating']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="font-heading text-2xl text-cream">{num}</p>
                <p className="font-body text-xs text-cream/40 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href="/" className="block text-center mb-10 lg:hidden">
            <span className="font-heading text-3xl tracking-[0.4em] uppercase text-daisy-900">Daisy</span>
          </Link>

          <h1 className="font-heading text-4xl font-light text-daisy-900 mb-2">Create Account</h1>
          <p className="font-body text-sm text-daisy-400 mb-10">Join the DAISY family today</p>

          {/* Google */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-nude-200 py-3.5 font-body text-sm text-daisy-700 hover:border-daisy-400 transition-all mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-1 h-px bg-nude-200" />
            <span className="font-body text-xs text-daisy-400 px-4">or create with email</span>
            <div className="flex-1 h-px bg-nude-200" />
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
                <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={set(key)} required placeholder={placeholder}
                  className="w-full bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1" />
              </div>
            ))}

            <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
              <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Password</label>
              <div className="flex items-center gap-2">
                <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={set('password')} required placeholder="Min. 8 characters"
                  className="flex-1 bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-daisy-400 hover:text-daisy-700">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
              <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} required placeholder="Re-enter password"
                className="w-full bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1" />
            </div>

            <p className="font-body text-xs text-daisy-400">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4">Terms</Link> &{' '}
              <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="font-body text-sm text-daisy-500 text-center mt-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-daisy-800 font-medium hover:underline underline-offset-4">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
