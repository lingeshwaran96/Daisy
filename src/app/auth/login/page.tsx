// src/app/auth/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('Welcome back!');
    router.push('/profile');
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/profile` },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left – decorative */}
      <div className="hidden lg:flex flex-1 bg-daisy-950 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&q=80')" }}
        />
        <div className="relative text-center text-cream z-10 px-12">
          <Link href="/" className="inline-block mb-10">
            <span className="font-heading text-5xl tracking-[0.4em] uppercase">Daisy</span>
            <p className="font-body text-[11px] tracking-[0.35em] text-cream/50 mt-1">Elegance That Blooms</p>
          </Link>
          <p className="font-heading text-3xl font-light text-cream/80 leading-relaxed">
            &ldquo;True elegance is<br />refusal.&rdquo;
          </p>
          <p className="font-body text-sm text-cream/40 mt-4">— Coco Chanel</p>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="block text-center mb-10 lg:hidden">
            <span className="font-heading text-3xl tracking-[0.4em] uppercase text-daisy-900">Daisy</span>
          </Link>

          <h1 className="font-heading text-4xl font-light text-daisy-900 mb-2">Welcome back</h1>
          <p className="font-body text-sm text-daisy-400 mb-10">Sign in to your DAISY account</p>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-nude-200 py-3.5 font-body text-sm text-daisy-700 hover:border-daisy-400 hover:bg-nude-50 transition-all mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center mb-6 mt-6">
            <div className="flex-1 h-px bg-nude-200" />
            <span className="font-body text-xs text-daisy-400 px-4">or sign in with email</span>
            <div className="flex-1 h-px bg-nude-200" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
              <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1"
              />
            </div>

            <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
              <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Password</label>
              <div className="flex items-center gap-2">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="flex-1 bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-daisy-400 hover:text-daisy-700 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link href="/auth/forgot-password" className="font-body text-xs text-daisy-500 hover:text-daisy-800 transition-colors underline underline-offset-4">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <p className="font-body text-sm text-daisy-500 text-center mt-8">
            New to DAISY?{' '}
            <Link href="/auth/signup" className="text-daisy-800 font-medium hover:underline underline-offset-4 transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
