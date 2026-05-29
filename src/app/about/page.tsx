'use client';

import Image from 'next/image';
import Link from 'next/link';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import CartSidebar from '@/components/cart/CartSidebar';
import { ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <main className="pb-20 md:pb-0 min-h-screen bg-white">
        {/* Hero Section */}
        <div className="relative h-96 md:h-[500px] overflow-hidden bg-cream">
          <Image
            src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&q=80"
            alt="DAISY"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-daisy-950/40" />
          <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
            <h1 className="font-heading text-5xl md:text-7xl font-light text-white mb-4">
              Our Story
            </h1>
            <p className="font-body text-white/80 text-lg max-w-2xl">
              From our workshops in Chennai to your doorstep, every piece tells a story of elegance and craftsmanship
            </p>
          </div>
        </div>

        {/* About Section */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-20 md:py-32">
          {/* Mission */}
          <div className="mb-20">
            <h2 className="font-heading text-4xl md:text-5xl font-light text-daisy-900 mb-6">
              About DAISY
            </h2>
            <p className="font-body text-lg text-daisy-700 leading-relaxed mb-6">
              DAISY is a luxury jewellery and lifestyle brand dedicated to creating timeless pieces that celebrate the elegance of modern women. We believe in the power of beautiful, handcrafted accessories to transform moments into memories.
            </p>
            <p className="font-body text-lg text-daisy-700 leading-relaxed">
              Every piece in our collection is crafted with passion and precision by master artisans who understand that true luxury is not just about the product—it's about the experience and the story behind it.
            </p>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div>
              <h3 className="font-heading text-2xl text-daisy-900 mb-4">Authenticity</h3>
              <p className="font-body text-daisy-700 leading-relaxed">
                All our jewellery is crafted from premium 925 sterling silver and authenticated for purity and quality.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-daisy-900 mb-4">Craftsmanship</h3>
              <p className="font-body text-daisy-700 leading-relaxed">
                Master artisans with decades of experience create each piece with meticulous attention to detail.
              </p>
            </div>
            <div>
              <h3 className="font-heading text-2xl text-daisy-900 mb-4">Sustainability</h3>
              <p className="font-body text-daisy-700 leading-relaxed">
                We are committed to sustainable practices and ethical sourcing of all materials and precious metals.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-12 bg-cream px-8 rounded">
            <h3 className="font-heading text-2xl text-daisy-900 mb-6">
              Discover the DAISY Collection
            </h3>
            <Link href="/collections" className="btn-primary inline-flex items-center gap-2">
              Shop Now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
