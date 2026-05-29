// src/components/home/FeaturedProducts.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductCard from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

const TABS = ['All', 'New Arrivals', 'Best Sellers', 'Featured'];

const MOCK_PRODUCTS: any[] = Array.from({ length: 8 }, (_, i) => ({
  id: `mock-${i}`,
  name: ['925 Silver Lotus Necklace', 'Rose Gold Jhumka Earrings', 'Kundan Bangle Set', 'Oxidised Silver Ring', 'Pearl Drop Earrings', 'Silver Choker Chain', 'Floral Silver Anklet', 'Diamond-Cut Bracelet'][i],
  slug: `product-${i + 1}`,
  description: 'A beautifully crafted luxury piece.',
  short_description: null,
  price: [1299, 2499, 3299, 899, 1899, 2199, 1099, 2799][i],
  offer_price: [999, null, 2499, null, 1499, 1799, null, 2299][i],
  images: [
    ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80'],
    ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80'],
    ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600&q=80'],
    ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80'],
    ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&q=80'],
    ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&q=80'],
    ['https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600&q=80', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80'],
  ][i],
  video_url: null,
  category_id: 'cat-1',
  subcategory_id: null,
  tags: [],
  variants: [],
  stock: [10, 5, 0, 20, 8, 3, 15, 7][i],
  is_active: true,
  is_featured: i % 2 === 0,
  is_bestseller: i % 3 === 0,
  is_new_arrival: i % 4 === 0,
  weight: '5g',
  material: ['925 Sterling Silver', 'Rose Gold Plated', 'Kundan', 'Oxidised Silver', '925 Silver', '925 Silver', '925 Silver', '925 Silver'][i],
  occasion: null,
  specifications: null,
  meta_title: null,
  meta_description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState('All');
  const [products, setProducts] = useState<any[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(8);

      let finalQuery = query;
      if (activeTab === 'New Arrivals') finalQuery = finalQuery.eq('is_new_arrival', true) as typeof query;
      if (activeTab === 'Best Sellers') finalQuery = finalQuery.eq('is_bestseller', true) as typeof query;
      if (activeTab === 'Featured') finalQuery = finalQuery.eq('is_featured', true) as typeof query;

      const { data } = await finalQuery;
      if (data && data.length > 0) {
        // Only use DB products that have images, fill rest with mocks
        const dbProducts = (data as any[]).filter(p => p.images && p.images.length > 0 && p.images[0]);
        if (dbProducts.length >= 4) {
          setProducts(dbProducts.slice(0, 8));
        } else {
          // Merge: DB products with images first, then fill with mocks
          const mockFill = MOCK_PRODUCTS.filter(m => !dbProducts.find(d => d.id === m.id));
          setProducts([...dbProducts, ...mockFill].slice(0, 8));
        }
      } else {
        setProducts(MOCK_PRODUCTS);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [activeTab]);

  return (
    <section className="py-20 md:py-28 px-4 md:px-8 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <p className="section-subtitle">Curated for You</p>
            <h2 className="section-title">Our Collections</h2>
          </div>
          <div className="flex items-center gap-1 border border-nude-200 p-1 self-start md:self-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-body text-xs tracking-widest uppercase transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-daisy-900 text-cream'
                    : 'text-daisy-500 hover:text-daisy-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-14">
          <Link href="/collections" className="btn-outline">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
