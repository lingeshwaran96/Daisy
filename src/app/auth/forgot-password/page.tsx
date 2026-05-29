// src/app/auth/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="block text-center mb-10">
          <span className="font-heading text-3xl tracking-[0.4em] uppercase text-daisy-900">Daisy</span>
        </Link>
        <div className="bg-white border border-nude-200 p-8">
          {!sent ? (
            <>
              <h1 className="font-heading text-3xl font-light text-daisy-900 mb-2">Reset Password</h1>
              <p className="font-body text-sm text-daisy-400 mb-8">Enter your email and we'll send a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
                  <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com"
                    className="w-full bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                  {loading ? <span className="spinner" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">📧</span>
              </div>
              <h2 className="font-heading text-2xl text-daisy-900 mb-2">Check Your Email</h2>
              <p className="font-body text-sm text-daisy-500 leading-relaxed">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
          )}
          <Link href="/auth/login" className="block text-center mt-6 font-body text-sm text-daisy-500 hover:text-daisy-800 transition-colors">
            ← Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
