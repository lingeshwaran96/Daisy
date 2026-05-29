// src/app/auth/reset-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);

  useEffect(() => {
    // Check if the user is authenticated (via the hash fragment callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Session expired or invalid reset link. Please request a new link.');
        router.push('/auth/forgot-password');
      } else {
        setVerifyingSession(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Sign out to force re-authentication with new password
    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
    toast.success('Password reset successful! Please login.');
  };

  if (verifyingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <span className="font-heading text-3xl text-daisy-300 tracking-widest uppercase">Daisy</span>
          <div className="spinner text-daisy-400 mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="block text-center mb-10">
          <span className="font-heading text-3xl tracking-[0.4em] uppercase text-daisy-900">Daisy</span>
        </Link>
        <div className="bg-white border border-nude-200 p-8 shadow-md">
          {!success ? (
            <>
              <h1 className="font-heading text-3xl font-light text-daisy-900 mb-2">Create New Password</h1>
              <p className="font-body text-sm text-daisy-400 mb-8">Enter your new secure password below</p>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
                  <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">New Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="flex-1 bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-daisy-400 hover:text-daisy-700 transition-colors">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="border-b border-nude-200 focus-within:border-daisy-500 transition-colors pb-1">
                  <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-1">Confirm Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full bg-transparent font-body text-sm text-daisy-900 outline-none placeholder-daisy-300 py-1"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                  {loading ? <span className="spinner" /> : 'Reset Password'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h2 className="font-heading text-2xl text-daisy-900 mb-2">Password Reset!</h2>
              <p className="font-body text-sm text-daisy-500 leading-relaxed mb-6">
                Your password has been successfully updated.
              </p>
              <Link href="/auth/login" className="btn-primary inline-block w-full py-3 text-center">
                Sign In Now
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
