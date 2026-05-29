// src/app/order-success/page.tsx
import { Suspense } from 'react';
import OrderSuccessContent from './OrderSuccessContent';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function OrderSuccessPage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <Suspense fallback={
        <main className="pb-20 md:pb-0 min-h-screen bg-cream flex items-center justify-center">
          <p className="font-heading text-2xl text-daisy-300">Loading...</p>
        </main>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
      <MobileNav />
    </>
  );
}
