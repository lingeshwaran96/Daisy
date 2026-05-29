// src/app/collections/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import ProductCard from '@/components/product/ProductCard';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

// Mock products for display when no DB
const MOCK: any[] = Array.from({ length: 12 }, (_, i) => ({
  id: `m${i}`,
  name: ['925 Silver Lotus Necklace', 'Rose Gold Jhumka Earrings', 'Kundan Bangle Set', 'Oxidised Silver Ring', 'Pearl Drop Earrings', 'Silver Choker Chain', 'Floral Silver Anklet', 'Diamond-Cut Bracelet', 'Crystal Pendant Set', 'Temple Coin Necklace', 'Silver Toe Rings Set', 'Boho Stack Ring Set'][i],
  slug: `product-${i + 1}`,
  description: null,
  short_description: null,
  price: [1299, 2499, 3299, 899, 1899, 2199, 1099, 2799, 1599, 3499, 699, 1799][i],
  offer_price: [999, null, 2499, null, 1499, null, null, 2299, null, 2799, null, null][i],
  images: [
    ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600'],
    ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'],
    ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600'],
    ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600'],
    ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600'],
    ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600'],
    ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600'],
    ['https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=600', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'],
    ['https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=600', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600'],
    ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600'],
    ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'],
    ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=600', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600'],
  ][i],
  video_url: null,
  category_id: 'cat-1',
  subcategory_id: null,
  tags: [],
  variants: [],
  stock: [10, 5, 0, 20, 8, 3, 15, 7, 12, 0, 25, 6][i],
  is_active: true,
  is_featured: i % 3 === 0,
  is_bestseller: i % 4 === 0,
  is_new_arrival: i % 5 === 0,
  weight: '5g',
  material: ['925 Sterling Silver', 'Rose Gold Plated', 'Kundan', 'Oxidised', '925 Silver', '925 Silver', '925 Silver', '925 Silver', 'Crystal', 'Temple Gold', '925 Silver', '925 Silver'][i],
  occasion: null,
  specifications: null,
  meta_title: null,
  meta_description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Best Sellers', value: 'bestseller' },
];

const PRICE_RANGES = [
  { label: 'Under ₹1000', min: 0, max: 1000 },
  { label: '₹1000 – ₹2000', min: 1000, max: 2000 },
  { label: '₹2000 – ₹5000', min: 2000, max: 5000 },
  { label: 'Above ₹5000', min: 5000, max: Infinity },
];

export default function CollectionsPage() {
  const [products, setProducts] = useState<any[]>(MOCK);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('created_at-desc');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase.from('products').select('*').eq('is_active', true);
      if (showInStock) query = query.gt('stock', 0);
      if (priceRange) {
        query = query.gte('price', priceRange.min);
        if (priceRange.max !== Infinity) query = query.lte('price', priceRange.max);
      }
      if (sort === 'bestseller') query = query.eq('is_bestseller', true);
      else {
        const [col, dir] = sort.split('-');
        query = query.order(col, { ascending: dir === 'asc' });
      }
      const { data } = await query.limit(24);
      if (data && data.length > 0) setProducts(data as Product[]);
      else setProducts(MOCK);
      setLoading(false);
    }
    fetchProducts();
  }, [sort, priceRange, showInStock]);

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <main className="pb-20 md:pb-0 min-h-screen bg-white">
        {/* Page Header */}
        <div className="bg-cream border-b border-nude-200 py-12 px-4 text-center">
          <p className="section-subtitle">All Products</p>
          <h1 className="section-title">Our Collections</h1>
          <p className="font-body text-sm text-daisy-500 mt-3">{products.length} products</p>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
          {/* Filter / Sort Bar */}
          <div className="flex items-center justify-between mb-8 gap-4">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 font-body text-sm text-daisy-700 border border-nude-200 px-4 py-2.5 hover:border-daisy-400 transition-colors"
            >
              <SlidersHorizontal size={15} />
              Filters
              {(priceRange || showInStock) && (
                <span className="w-4 h-4 bg-daisy-700 text-cream text-[9px] rounded-full flex items-center justify-center">!</span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 font-body text-sm text-daisy-700 border border-nude-200 px-4 py-2.5 hover:border-daisy-400 transition-colors"
              >
                Sort: {SORT_OPTIONS.find(s => s.value === sort)?.label}
                <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-nude-200 shadow-card z-20 w-48">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setSortOpen(false); }}
                      className={`block w-full text-left px-4 py-3 font-body text-sm hover:bg-nude-100 transition-colors ${sort === opt.value ? 'text-daisy-700 font-medium' : 'text-daisy-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-cream border border-nude-200 p-6 mb-8 grid md:grid-cols-3 gap-8"
            >
              {/* Price */}
              <div>
                <h3 className="font-body text-xs tracking-widest uppercase text-daisy-500 mb-4 font-medium">Price Range</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map((range) => (
                    <label key={range.label} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange?.min === range.min && priceRange?.max === range.max}
                        onChange={() => setPriceRange({ min: range.min, max: range.max })}
                        className="accent-daisy-700"
                      />
                      <span className="font-body text-sm text-daisy-700">{range.label}</span>
                    </label>
                  ))}
                  <button onClick={() => setPriceRange(null)} className="font-body text-xs text-daisy-400 hover:text-daisy-700 underline mt-1">
                    Clear
                  </button>
                </div>
              </div>

              {/* In Stock */}
              <div>
                <h3 className="font-body text-xs tracking-widest uppercase text-daisy-500 mb-4 font-medium">Availability</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInStock}
                    onChange={(e) => setShowInStock(e.target.checked)}
                    className="accent-daisy-700"
                  />
                  <span className="font-body text-sm text-daisy-700">In Stock Only</span>
                </label>
              </div>

              {/* Clear all */}
              <div className="flex items-end">
                <button
                  onClick={() => { setPriceRange(null); setShowInStock(false); }}
                  className="flex items-center gap-1 font-body text-sm text-daisy-500 hover:text-daisy-800 transition-colors"
                >
                  <X size={14} />
                  Clear All Filters
                </button>
              </div>
            </motion.div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-heading text-2xl text-daisy-300 mb-2">No products found</p>
              <p className="font-body text-sm text-daisy-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
      <WhatsAppFloat />
    </>
  );
}
