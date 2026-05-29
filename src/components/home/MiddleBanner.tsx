// src/components/home/MiddleBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; link: string | null };

const FALLBACK = {
  title: 'The Festive Collection',
  subtitle: 'Limited Edition',
  image_url: 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=1600&q=80',
  link: '/collections',
};

export default function MiddleBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('position', 'middle')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single()
      .then(({ data }) => {
        setBanner(data as Banner | null);
        setReady(true);
      });
  }, []);

  const b = banner ?? FALLBACK;

  if (!ready) return <section className="h-64 md:h-96 bg-daisy-100 animate-pulse" />;

  return (
    <section className="relative h-64 md:h-96 overflow-hidden">
      <Image
        src={b.image_url}
        alt={b.title}
        fill
        className="object-cover"
        sizes="100vw"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute inset-0 bg-daisy-950/65" />
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        {b.subtitle && (
          <p className="font-body text-[10px] tracking-[0.4em] uppercase text-white/60 mb-4">
            {b.subtitle}
          </p>
        )}
        <h2 className="font-heading text-3xl md:text-6xl font-light text-white mb-6">
          {b.title}
        </h2>
        {b.link && (
          <Link href={b.link} className="btn-primary bg-white text-daisy-900 hover:bg-cream">
            Shop Now
          </Link>
        )}
      </div>
    </section>
  );
}
