// src/components/home/HeroSlider.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ── Fallback slides (shown when no hero banners exist in DB) ─────────────────
const FALLBACK_SLIDES = [
  {
    id: 1,
    title: 'Elegance\nThat Blooms',
    subtitle: 'New Collection 2024',
    description: 'Discover handcrafted luxury jewellery for the modern woman',
    cta: 'Shop the Collection',
    ctaLink: '/collections',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&q=80',
  },
  {
    id: 2,
    title: 'Silver\nStories',
    subtitle: '925 Sterling Silver',
    description: 'Premium silver jewellery crafted with passion and precision',
    cta: 'Explore Jewellery',
    ctaLink: '/collections',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&q=80',
  },
  {
    id: 3,
    title: 'Gift the\nMoment',
    subtitle: 'Luxury Gift Sets',
    description: 'Curated gift boxes for every celebration and loved one',
    cta: 'Shop Gifts',
    ctaLink: '/collections',
    image: 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1600&q=80',
  },
];

type Slide = {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  ctaLink: string;
  image: string;
};

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [ready, setReady] = useState(false);

  // ── Fetch hero banners from Supabase ────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('position', 'hero')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: Slide[] = data.map((b: any) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle || '',
            description: b.subtitle || '',
            cta: 'Shop the Collection',
            ctaLink: b.link || '/collections',
            image: b.image_url,
          }));
          setSlides(mapped);
        } else {
          setSlides(FALLBACK_SLIDES);
        }
        setReady(true);
      });
  }, []);

  const total = slides.length;

  const go = useCallback(
    (idx: number, dir: number) => {
      if (total === 0) return;
      setDirection(dir);
      setCurrent((idx + total) % total);
    },
    [total]
  );

  const prev = () => go(current - 1, -1);
  const next = useCallback(() => go(current + 1, 1), [current, go]);

  // Auto-play
  useEffect(() => {
    if (!ready || total === 0) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next, ready, total]);

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  // Loading skeleton
  if (!ready) {
    return (
      <section className="relative h-[85vh] md:h-screen max-h-[800px] overflow-hidden bg-daisy-100 animate-pulse" />
    );
  }

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <section className="relative h-[85vh] md:h-screen max-h-[800px] overflow-hidden bg-daisy-50">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority={slide.id === slides[0]?.id}
            sizes="100vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-[1400px] mx-auto px-8 md:px-16 w-full">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="max-w-xl"
              >
                {slide.subtitle && (
                  <span className="font-body text-[10px] md:text-xs tracking-[0.4em] uppercase text-white/70 mb-4 block">
                    {slide.subtitle}
                  </span>
                )}
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[1.05] whitespace-pre-line mb-6">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="font-body text-sm md:text-base text-white/80 mb-10 leading-relaxed max-w-sm">
                    {slide.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  <Link
                    href={slide.ctaLink}
                    className="inline-flex items-center gap-3 bg-white text-daisy-900 px-8 py-4 font-body text-xs tracking-[0.25em] uppercase font-medium hover:bg-cream transition-colors duration-300"
                  >
                    {slide.cta}
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-3 border border-white/60 text-white px-8 py-4 font-body text-xs tracking-[0.25em] uppercase font-medium hover:bg-white/10 transition-colors duration-300"
                  >
                    Our Story
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows — only show when more than 1 slide */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? 1 : -1)}
                className={`rounded-full transition-all duration-400 ${
                  i === current ? 'w-8 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Slide counter */}
          <div className="absolute bottom-8 right-8 font-body text-xs text-white/60 z-10 hidden md:block">
            {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
        </>
      )}
    </section>
  );
}
