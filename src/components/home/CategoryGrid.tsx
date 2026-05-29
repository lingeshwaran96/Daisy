// src/components/home/CategoryGrid.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  description: string | null;
  sort_order: number;
};

// Fallback shown only when DB has zero active categories
const FALLBACK: Category[] = [
  { id: '1', name: 'Necklaces',  slug: 'necklaces', image_url: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80', description: '120+ styles', sort_order: 1 },
  { id: '2', name: 'Earrings',   slug: 'earrings',  image_url: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80', description: '200+ styles', sort_order: 2 },
  { id: '3', name: 'Rings',      slug: 'rings',     image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80', description: '80+ styles',  sort_order: 3 },
  { id: '4', name: 'Bangles',    slug: 'bangles',   image_url: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80', description: '60+ styles',  sort_order: 4 },
  { id: '5', name: 'Sarees',     slug: 'sarees',    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80', description: '150+ styles', sort_order: 5 },
  { id: '6', name: 'Gifts',      slug: 'gifts',     image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&q=80', description: '40+ sets',    sort_order: 6 },
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, slug, image_url, description, sort_order')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        setCategories(data && data.length > 0 ? (data as Category[]) : FALLBACK);
        setReady(true);
      });
  }, []);

  // Skeleton while loading
  if (!ready) {
    return (
      <section className="py-20 md:py-28 bg-cream px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-14">
            <p className="section-subtitle">Explore</p>
            <h2 className="section-title">Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-full aspect-square rounded-full bg-nude-200 animate-pulse max-w-[140px] mx-auto" />
                <div className="h-3 w-20 bg-nude-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-cream px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="section-subtitle">Explore</p>
          <h2 className="section-title">Shop by Category</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
            >
              <Link href={`/collections/${cat.slug}`} className="group block text-center">
                {/* Image circle */}
                <div className="relative w-full aspect-square rounded-full overflow-hidden bg-nude-100 mb-4 img-zoom mx-auto max-w-[140px]">
                  {cat.image_url ? (
                    <Image
                      src={cat.image_url}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="140px"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-daisy-100">
                      <span className="font-heading text-3xl text-daisy-400">{cat.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-daisy-900/0 group-hover:bg-daisy-900/20 transition-colors duration-500 rounded-full" />
                </div>
                <h3 className="font-body text-sm font-medium text-daisy-900 group-hover:text-daisy-600 transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="font-body text-xs text-daisy-400 mt-0.5">{cat.description}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
