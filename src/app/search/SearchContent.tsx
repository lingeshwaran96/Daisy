// src/app/search/SearchContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/product/ProductCard';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types/database';
import * as pixel from '@/utils/pixel';

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

export default function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('created_at-desc');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let searchQuery = supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .ilike('name', `%${query}%`);

        if (showInStock) searchQuery = searchQuery.gt('stock', 0);

        if (priceRange) {
          searchQuery = searchQuery.gte('price', priceRange.min);
          if (priceRange.max !== Infinity) {
            searchQuery = searchQuery.lte('price', priceRange.max);
          }
        }

        if (sort === 'bestseller') {
          searchQuery = searchQuery.eq('is_bestseller', true);
        } else {
          const [col, dir] = sort.split('-');
          searchQuery = searchQuery.order(col, { ascending: dir === 'asc' });
        }

        const { data } = await searchQuery.limit(24);

        if (data && data.length > 0) {
          setProducts(data as Product[]);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    if (query) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query, sort, priceRange, showInStock]);

  useEffect(() => {
    if (query) {
      pixel.event('Search', {
        search_string: query
      });
    }
  }, [query]);

  return (
    <main className="pb-20 md:pb-0 min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-cream border-b border-nude-200 py-12 px-4 text-center">
        <p className="section-subtitle">Search Results</p>
        <h1 className="section-title">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
        <p className="font-body text-sm text-daisy-500 mt-3">
          {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
        {query ? (
          <>
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
                <p className="font-body text-sm text-daisy-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id || i} product={product} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24">
            <p className="font-heading text-2xl text-daisy-300 mb-2">Enter a search term</p>
            <p className="font-body text-sm text-daisy-400">Use the search bar to find products</p>
          </div>
        )}
      </div>
    </main>
  );
}
