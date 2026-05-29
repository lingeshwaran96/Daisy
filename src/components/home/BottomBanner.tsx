// src/components/home/BottomBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; link: string | null };

export default function BottomBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('position', 'bottom')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setBanners((data as Banner[]) || []);
        setReady(true);
      });
  }, []);

  if (!ready || banners.length === 0) return null;

  return (
    <section className="py-6 px-4 md:px-8 bg-cream">
      <div className="max-w-[1400px] mx-auto grid gap-4 md:gap-6"
        style={{ gridTemplateColumns: `repeat(${Math.min(banners.length, 3)}, 1fr)` }}>
        {banners.map((b) => (
          <div key={b.id} className="relative h-48 md:h-64 overflow-hidden group">
            <Image
              src={b.image_url}
              alt={b.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-daisy-900/40 group-hover:bg-daisy-900/50 transition-colors" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              {b.subtitle && (
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-white/70 mb-2">
                  {b.subtitle}
                </p>
              )}
              <h3 className="font-heading text-xl md:text-2xl font-light text-white mb-4">{b.title}</h3>
              {b.link && (
                <Link href={b.link}
                  className="font-body text-[10px] tracking-[0.25em] uppercase text-white border-b border-white/60 pb-0.5 hover:border-white transition-colors">
                  Shop Now
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
