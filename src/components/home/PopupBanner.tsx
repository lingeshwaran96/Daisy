// src/components/home/PopupBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Banner = { id: string; title: string; subtitle: string | null; image_url: string; link: string | null };

export default function PopupBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show once per session
    const dismissed = sessionStorage.getItem('popup_dismissed');
    if (dismissed) return;

    supabase
      .from('banners')
      .select('*')
      .eq('position', 'popup')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setBanner(data as Banner);
          // Show after 3s delay
          setTimeout(() => setVisible(true), 3000);
        }
      });
  }, []);

  const close = () => {
    setVisible(false);
    sessionStorage.setItem('popup_dismissed', '1');
  };

  if (!banner || !visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={close}>
      <div
        className="relative max-w-md w-full bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={close}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-daisy-700 hover:bg-white transition-colors shadow">
          <X size={16} />
        </button>

        {/* Image */}
        <div className="relative h-56 bg-nude-100">
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            sizes="448px"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          {banner.subtitle && (
            <p className="font-body text-[10px] tracking-[0.4em] uppercase text-daisy-500 mb-3">
              {banner.subtitle}
            </p>
          )}
          <h2 className="font-heading text-3xl text-daisy-900 font-light mb-6">{banner.title}</h2>
          <div className="flex flex-col gap-3">
            {banner.link && (
              <Link href={banner.link} onClick={close} className="btn-primary text-center">
                Shop Now
              </Link>
            )}
            <button onClick={close}
              className="font-body text-xs text-daisy-400 hover:text-daisy-700 transition-colors underline underline-offset-4">
              No thanks, continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
