// src/components/home/BrandStory.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Settings = Record<string, string>;

const DEFAULT_STORY: Settings = {
  story_subtitle: 'Our Story',
  story_title_main: 'Born from a Love of',
  story_title_accent: 'Timeless Elegance',
  story_paragraph1: 'DAISY was born from a simple belief — that every woman deserves to feel beautifully adorned, every single day. We curate luxury jewellery and fashion that blends traditional Indian craftsmanship with modern, minimalist aesthetics.',
  story_paragraph2: 'From our workshops in Chennai to your doorstep, every piece is crafted with love, care, and an unwavering commitment to quality. We use only hallmark-certified 925 sterling silver and ethically sourced materials.',
  story_image1: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80',
  story_image2: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80',
  story_badge_number: '10K+',
  story_badge_text: 'Happy Customers',
  story_metric1_number: '500+',
  story_metric1_text: 'Unique Designs',
  story_metric2_number: '10K+',
  story_metric2_text: 'Orders Delivered',
  story_metric3_number: '4.9★',
  story_metric3_text: 'Customer Rating',
  story_button_text: 'Read Our Story',
  story_button_link: '/about',
};

export default function BrandStory() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_STORY);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('key, value')
          .like('key', 'story_%');

        if (data && data.length > 0) {
          const map: Settings = { ...DEFAULT_STORY };
          data.forEach(({ key, value }) => {
            if (value !== undefined && value !== null) map[key] = value;
          });
          setSettings(map);
        }
      } catch (err) {
        console.error('Error loading Brand Story settings:', err);
      }
    }
    loadSettings();
  }, []);

  const s = settings;

  return (
    <section className="py-20 md:py-32 px-4 md:px-8 bg-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Images collage */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[450px] md:h-[600px]"
        >
          <div className="absolute top-0 left-0 w-3/4 h-3/4 overflow-hidden img-zoom">
            <Image
              src={s.story_image1}
              alt="DAISY brand story background image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 75vw, 40vw"
            />
          </div>
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 overflow-hidden img-zoom border-4 border-white">
            <Image
              src={s.story_image2}
              alt="DAISY brand story foreground image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 60vw, 35vw"
            />
          </div>
          {/* Accent blob */}
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-nude-100 rounded-full -z-10" />
          
          {/* Stat badge */}
          {s.story_badge_number && (
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute bottom-8 left-8 bg-daisy-900 text-cream p-5 shadow-luxury"
            >
              <p className="font-heading text-4xl font-light">{s.story_badge_number}</p>
              <p className="font-body text-xs tracking-widest uppercase text-cream/60 mt-1">{s.story_badge_text}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="section-subtitle">{s.story_subtitle}</p>
          <h2 className="section-title mb-6">
            {s.story_title_main}<br />
            <em className="font-accent italic font-normal text-daisy-600">{s.story_title_accent}</em>
          </h2>
          {s.story_paragraph1 && (
            <p className="font-body text-daisy-600 leading-relaxed mb-5">
              {s.story_paragraph1}
            </p>
          )}
          {s.story_paragraph2 && (
            <p className="font-body text-daisy-600 leading-relaxed mb-8">
              {s.story_paragraph2}
            </p>
          )}

          <div className="grid grid-cols-3 gap-6 mb-10 pb-10 border-b border-nude-200">
            {[
              { num: s.story_metric1_number, label: s.story_metric1_text },
              { num: s.story_metric2_number, label: s.story_metric2_text },
              { num: s.story_metric3_number, label: s.story_metric3_text },
            ].map(({ num, label }) => (
              <div key={label}>
                <p className="font-heading text-3xl text-daisy-800">{num}</p>
                <p className="font-body text-xs text-daisy-400 mt-1 tracking-wide">{label}</p>
              </div>
            ))}
          </div>

          <Link href={s.story_button_link} className="btn-outline">
            {s.story_button_text}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
