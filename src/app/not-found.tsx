// src/app/not-found.tsx
import Link from 'next/link';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function NotFound() {
  return (
    <>
      <AnnouncementBar/>
      <Navbar/>
      <main className="min-h-[70vh] flex items-center justify-center bg-cream pb-20 md:pb-0">
        <div className="text-center px-4">
          <p className="font-heading text-[120px] md:text-[180px] text-nude-200 leading-none font-light select-none">404</p>
          <h1 className="font-heading text-3xl md:text-4xl text-daisy-900 font-light -mt-6 mb-4">Page Not Found</h1>
          <p className="font-body text-daisy-500 mb-8 max-w-sm mx-auto">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="btn-primary px-8 py-3">Go Home</Link>
            <Link href="/collections" className="btn-outline px-8 py-3">Shop Collections</Link>
            <Link href="/track-order" className="font-body text-sm text-daisy-500 underline underline-offset-2">Track Order</Link>
          </div>
        </div>
      </main>
      <Footer/><MobileNav/>
    </>
  );
}
