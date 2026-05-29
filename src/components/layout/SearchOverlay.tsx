// src/components/layout/SearchOverlay.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

type Result = { id: string; name: string; slug: string; price: number; offer_price: number | null; images: string[] };

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 100);
    else { setQuery(''); setResults([]); }
  }, [searchOpen]);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, offer_price, images')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .limit(6);
      setResults((data as Result[]) || []);
      setLoading(false);
    }, 350);
  }, [query]);

  const popularSearches = ['Silver Necklace', 'Earrings', 'Ring Set', 'Saree', 'Gift Box'];

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-white/98 backdrop-blur-sm flex flex-col"
        >
          {/* Search bar */}
          <div className="border-b border-nude-200 px-6 md:px-16 py-5 flex items-center gap-4">
            <Search size={22} className="text-daisy-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for jewellery, sarees, gifts..."
              className="flex-1 font-body text-lg text-daisy-900 placeholder-daisy-300 bg-transparent outline-none"
            />
            <button onClick={() => setSearchOpen(false)} className="p-2 text-daisy-600 hover:text-daisy-900 transition-colors">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full px-6 py-8">
            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-12">
                <div className="spinner text-daisy-400" />
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-daisy-400 mb-5">
                  Search Results
                </p>
                <div className="space-y-4">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-4 p-3 hover:bg-nude-100 transition-colors group"
                    >
                      <div className="relative w-14 h-16 bg-nude-100 flex-shrink-0">
                        <Image src={p.images?.[0] || '/images/placeholder.jpg'} alt={p.name} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body text-sm font-medium text-daisy-900 truncate">{p.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-heading text-base text-daisy-800">
                            ₹{(p.offer_price || p.price).toLocaleString('en-IN')}
                          </span>
                          {p.offer_price && (
                            <span className="font-body text-xs text-daisy-400 line-through">
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-daisy-300 group-hover:text-daisy-600 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setSearchOpen(false)}
                  className="block mt-6 text-center font-body text-sm text-daisy-600 hover:text-daisy-900 underline underline-offset-4 transition-colors"
                >
                  View all results for &quot;{query}&quot;
                </Link>
              </div>
            )}

            {/* No results */}
            {!loading && query && results.length === 0 && (
              <div className="text-center py-12">
                <p className="font-heading text-2xl text-daisy-300 mb-2">No results found</p>
                <p className="font-body text-sm text-daisy-400">Try a different search term</p>
              </div>
            )}

            {/* Popular searches */}
            {!query && (
              <div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-daisy-400 mb-5">
                  Popular Searches
                </p>
                <div className="flex flex-wrap gap-3">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-4 py-2 border border-nude-200 font-body text-sm text-daisy-700 hover:border-daisy-400 hover:text-daisy-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
