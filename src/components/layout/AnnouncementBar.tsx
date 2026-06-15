// src/components/layout/AnnouncementBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useStore } from '@/lib/store';

const FALLBACK = [
  '🌸 USE CODE: WELCOME10 — 10% off your first order',
  '✨ FREE SHIPPING on orders above ₹1000',
  '💫 USE CODE: DAISY15 — 15% off above ₹3000',
  '🎁 10% OFF all prepaid orders — USE CODE: PREPAID10',
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const { siteSettings, settingsFetched } = useStore();

  // Derive announcements from cached settings — no DB call needed
  const announcements: string[] = (() => {
    if (!settingsFetched) return FALLBACK;
    const raw = siteSettings['announcement_text'];
    if (!raw) return FALLBACK;
    const items = raw.split('|').map((s) => s.trim()).filter(Boolean);
    return items.length > 0 ? items : FALLBACK;
  })();

  if (!visible) return null;

  return (
    <div className="relative bg-daisy-900 text-cream py-2.5 overflow-hidden">
      {/* Scrolling marquee */}
      <div className="marquee-container flex">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...announcements, ...announcements].map((text, i) => (
            <span key={i} className="font-body text-xs tracking-[0.2em] mx-12">
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/70 hover:text-cream transition-colors"
        aria-label="Close announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
