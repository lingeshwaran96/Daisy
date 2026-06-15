'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import CartSidebar from '@/components/cart/CartSidebar';
import ProductCard from '@/components/product/ProductCard';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types/database';

const SORT_OPTIONS = [
  { label: 'Newest', value: 'created_at-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Bestsellers', value: 'bestseller' },
];

const PRICE_RANGES = [
  { label: '₹0 - ₹5,000', min: 0, max: 5000 },
  { label: '₹5,000 - ₹15,000', min: 5000, max: 15000 },
  { label: '₹15,000 - ₹50,000', min: 15000, max: 50000 },
  { label: '₹50,000+', min: 50000, max: Infinity },
];

// Category metadata
const CATEGORY_METADATA: Record<string, { title: string; description: string }> = {
  necklaces: { title: 'Necklaces', description: 'Beautiful necklaces for every occasion' },
  earrings: { title: 'Earrings', description: 'Elegant earrings to complement your style' },
  rings: { title: 'Rings', description: 'Stunning rings for every moment' },
  bangles: { title: 'Bangles', description: 'Exquisite bangles and bracelets' },
  bracelets: { title: 'Bracelets', description: 'Gorgeous bracelets for every wrist' },
  chains: { title: 'Chains', description: 'Delicate chains to wear with pride' },
  pendants: { title: 'Pendants', description: 'Beautiful pendants for your jewelry collection' },
  anklets: { title: 'Anklets', description: 'Charming anklets to elevate your look' },
  wedding: { title: 'Wedding Wear', description: 'Luxurious jewelry for your special day' },
  festive: { title: 'Festive Wear', description: 'Perfect jewelry for festive celebrations' },
  party: { title: 'Party Wear', description: 'Glamorous pieces for party season' },
  office: { title: 'Office Wear', description: 'Elegant jewelry for professional settings' },
  casual: { title: 'Casual Wear', description: 'Stylish everyday jewelry' },
  'new-arrivals': { title: 'New Arrivals', description: 'Check out our latest collections' },
  bestsellers: { title: 'Bestsellers', description: 'Our most loved pieces' },
  sarees: { title: 'Sarees', description: 'Traditional and modern sarees' },
  skincare: { title: 'Skincare', description: 'Premium skincare collection' },
  gifts: { title: 'Gifts', description: 'Perfect gifts for your loved ones' },
};

const MOCK = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-${i}`,
  name: `Product ${i + 1}`,
  slug: `product-${i + 1}`,
  price: 5000 + i * 1000,
  offer_price: null,
  description: 'Beautiful product',
  images: ['/images/placeholder.jpg'],
  stock: 10,
  is_active: true,
  is_bestseller: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  category_id: 'cat-1',
}));

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;
  
  const [products, setProducts] = useState<any[]>(MOCK);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('created_at-desc');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [limit, setLimit] = useState(24);
  const [hasMore, setHasMore] = useState(false);

  const categoryInfo = CATEGORY_METADATA[category] || { title: category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Category', description: 'Browse products' };

  // Reset limit when category, filters, or sort change
  useEffect(() => {
    setLimit(24);
  }, [category, sort, priceRange, showInStock]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*').eq('is_active', true);

        // Special virtual categories
        if (category === 'bestsellers') {
          query = query.eq('is_bestseller', true);
        } else if (category === 'new-arrivals') {
          query = query.eq('is_new_arrival', true);
        } else if (category === 'featured') {
          query = query.eq('is_featured', true);
        } else if (category) {
          // ✅ Look up the category UUID by slug first, then filter products
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .single();

          if (catData?.id) {
            query = query.eq('category_id', catData.id);
          } else {
            // Category slug not found in DB — show empty
            setProducts([]);
            setHasMore(false);
            setLoading(false);
            return;
          }
        }

        if (showInStock) query = query.gt('stock', 0);

        if (priceRange) {
          query = query.gte('price', priceRange.min);
          if (priceRange.max !== Infinity) query = query.lte('price', priceRange.max);
        }

        if (sort === 'bestseller') {
          query = query.eq('is_bestseller', true);
        } else {
          const [col, dir] = sort.split('-');
          query = query.order(col, { ascending: dir === 'asc' });
        }

        // Fetch limit + 1 to check if hasMore
        const { data } = await query.limit(limit + 1);
        if (data && data.length > 0) {
          if (data.length > limit) {
            setProducts(data.slice(0, limit) as Product[]);
            setHasMore(true);
          } else {
            setProducts(data as Product[]);
            setHasMore(false);
          }
        } else {
          setProducts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category, sort, priceRange, showInStock, limit]);


  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <main className="pb-20 md:pb-0 min-h-screen bg-white">
        {/* Page Header */}
        <div className="bg-cream border-b border-nude-200 py-12 px-4 text-center">
          <p className="section-subtitle">{categoryInfo.title}</p>
          <h1 className="section-title">{categoryInfo.title}</h1>
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
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id || i} product={product} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setLimit(prev => prev + 24)}
                    className="btn-outline"
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
