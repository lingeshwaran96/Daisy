// src/components/home/TrustBadges.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { supabase } from '@/lib/supabase';

type BadgeItem = {
  id?: string;
  icon: string;
  title: string;
  description: string;
  sort_order?: number;
};

const DEFAULT_BADGES = [
  { icon: 'Truck', title: 'Free Shipping', description: 'On orders above ₹1000' },
  { icon: 'Shield', title: '100% Authentic', description: 'Certified silver & gold' },
  { icon: 'Award', title: 'Premium Quality', description: 'Hallmark certified' },
  { icon: 'Headphones', title: '24/7 Support', description: 'WhatsApp & email' },
];

export default function TrustBadges() {
  const [badges, setBadges] = useState<BadgeItem[]>([]);

  useEffect(() => {
    async function loadBadges() {
      try {
        const { data } = await supabase
          .from('trust_badges')
          .select('*')
          .order('sort_order', { ascending: true });

        if (data && data.length > 0) {
          setBadges(data.map(b => ({
            id: b.id,
            icon: b.icon,
            title: b.title,
            description: b.description || ''
          })));
        } else {
          setBadges(DEFAULT_BADGES);
        }
      } catch (err) {
        console.error('Error loading trust badges:', err);
        setBadges(DEFAULT_BADGES);
      }
    }
    loadBadges();
  }, []);

  if (badges.length === 0) return null;

  return (
    <section className="py-12 border-y border-nude-200 bg-cream px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className={`grid gap-6 md:gap-4 ${
          badges.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
          badges.length === 2 ? 'grid-cols-2 max-w-xl mx-auto' :
          badges.length === 3 ? 'grid-cols-3 max-w-3xl mx-auto' :
          badges.length === 4 ? 'grid-cols-2 md:grid-cols-4' :
          'grid-cols-2 md:grid-cols-5'
        }`}>
          {badges.map(({ icon, title, description }, i) => {
            const IconComponent = (LucideIcons as any)[icon] || LucideIcons.HelpCircle;
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center text-center gap-3 py-2"
              >
                <div className="w-11 h-11 bg-nude-100 rounded-full flex items-center justify-center">
                  <IconComponent size={20} className="text-daisy-700" />
                </div>
                <div>
                  <p className="font-body text-xs font-semibold text-daisy-900 tracking-wide">{title}</p>
                  <p className="font-body text-xs text-daisy-400 mt-0.5">{description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
