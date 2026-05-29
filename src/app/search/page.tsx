// src/app/search/page.tsx
import { Suspense } from 'react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchContent from './SearchContent';

export default function SearchPage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <Suspense fallback={
        <main className="pb-20 md:pb-0 min-h-screen bg-white">
          <div className="bg-cream border-b border-nude-200 py-12 px-4 text-center">
            <p className="section-subtitle">Search Results</p>
            <h1 className="section-title">Search</h1>
            <p className="font-body text-sm text-daisy-500 mt-3">Loading...</p>
          </div>
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[3/4]" />
              ))}
            </div>
          </div>
        </main>
      }>
        <SearchContent />
      </Suspense>
    </>
  );
}
