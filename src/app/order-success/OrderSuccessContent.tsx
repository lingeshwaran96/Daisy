'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, MessageCircle, Package, Home } from 'lucide-react';

import { useState, useEffect } from 'react';
import { getActiveWhatsAppNumber } from '@/lib/whatsapp';

export default function OrderSuccessContent() {
  const [waNumber, setWaNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210');
  const params = useSearchParams();
  const orderNum = params.get('order');
  const method = params.get('method');

  useEffect(() => {
    getActiveWhatsAppNumber().then(setWaNumber);
  }, []);

  return (
    <main className="pb-20 md:pb-0 min-h-screen bg-cream flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="bg-white border border-nude-200 p-10 md:p-16 text-center max-w-lg w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} className="text-green-500" />
        </motion.div>

        <h1 className="font-heading text-4xl font-light text-daisy-900 mb-3">
          Order Placed! 🌸
        </h1>
        {orderNum && (
          <p className="font-body text-sm text-daisy-500 mb-2">
            Order Number: <strong className="text-daisy-900">#{orderNum}</strong>
          </p>
        )}
        <p className="font-body text-sm text-daisy-500 mb-8 leading-relaxed">
          {method === 'manual'
            ? 'Your order is placed! Our team will send you payment details via WhatsApp/Email within 30 minutes.'
            : 'Thank you for shopping with DAISY! Your order has been confirmed and will be shipped soon.'}
        </p>

        {method === 'manual' && (
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi DAISY! I just placed order #${orderNum}. Please share payment details.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full flex items-center justify-center gap-2 mb-4"
          >
            <MessageCircle size={16} />
            Contact Us on WhatsApp
          </a>
        )}

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary w-full flex items-center justify-center gap-2">
            <Home size={16} />
            Go to Home
          </Link>
          <Link href="/profile" className="btn-outline w-full flex items-center justify-center gap-2">
            <Package size={16} />
            View My Orders
          </Link>
          <Link href="/collections" className="btn-outline w-full">
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-nude-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: '📦', text: 'Processing in 24hrs' },
              { icon: '🚚', text: 'Ships in 2-3 days' },
              { icon: '⭐', text: 'Track on WhatsApp' },
            ].map(({ icon, text }) => (
              <div key={text}>
                <p className="text-2xl mb-1">{icon}</p>
                <p className="font-body text-xs text-daisy-400">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
