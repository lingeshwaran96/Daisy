// src/components/ui/WhatsAppFloat.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { getActiveWhatsAppNumber } from '@/lib/whatsapp';

export default function WhatsAppFloat() {
  const [waNumber, setWaNumber] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210');

  useEffect(() => {
    getActiveWhatsAppNumber().then(setWaNumber);
  }, []);

  return (
    <motion.a
      href={`https://wa.me/${waNumber}?text=${encodeURIComponent('🌸 Hi DAISY! I need help with my order.')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="whatsapp-float flex items-center gap-2 bg-[#25D366] text-white shadow-xl hover:shadow-2xl transition-shadow"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg">
        <MessageCircle size={26} fill="white" className="text-white" />
      </div>
    </motion.a>
  );
}
