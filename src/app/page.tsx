// src/app/page.tsx
// DAISY Homepage - Main entry point

import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';

import HeroSlider from '@/components/home/HeroSlider';
import TrustBadges from '@/components/home/TrustBadges';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import MiddleBanner from '@/components/home/MiddleBanner';
import BottomBanner from '@/components/home/BottomBanner';
import PopupBanner from '@/components/home/PopupBanner';
import BrandStory from '@/components/home/BrandStory';
import ReviewsCarousel from '@/components/home/ReviewsCarousel';
import InstagramGallery from '@/components/home/InstagramGallery';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DAISY – Elegance That Blooms | Luxury Jewellery & Fashion',
  description:
    'Shop premium 925 silver jewellery, designer sarees, and luxury gifts at DAISY. Free shipping above ₹1000. Authentic. Elegant. Uniquely yours.',
};

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      {/* Popup Banner — fetched from DB (position: popup), shows after 3s once per session */}
      <PopupBanner />

      <main className="pb-20 md:pb-0">
        {/* Hero Banners (position: hero) */}
        <HeroSlider />

        {/* Trust Badges */}
        <TrustBadges />

        {/* Categories */}
        <CategoryGrid />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Middle Banner (position: middle) */}
        <MiddleBanner />

        {/* Brand Story */}
        <BrandStory />

        {/* Reviews */}
        <ReviewsCarousel />

        {/* Instagram */}
        <InstagramGallery />

        {/* Bottom Banners (position: bottom) */}
        <BottomBanner />
      </main>

      <Footer />
      <MobileNav />
      <WhatsAppFloat />
    </>
  );
}
