// src/app/product/[slug]/page.tsx
// Individual product page with full luxury shopping experience

import { supabase } from '@/lib/supabase';
import ProductPageClient from './ProductPageClient';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import type { Metadata } from 'next';
import type { Product } from '@/types/database';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabase
    .from('products')
    .select('name, short_description, images, meta_title, meta_description')
    .eq('slug', params.slug)
    .single();

  return {
    title: data?.meta_title || data?.name || 'Product',
    description: data?.meta_description || data?.short_description || '',
    openGraph: {
      images: data?.images?.[0] ? [data.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  // Fetch product server-side for SEO — graceful fallback if DB unavailable
  let product = null;
  let related: Product[] = [];
  let reviews: any[] = [];

  try {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single();
    product = data;

    if (product) {
      const [{ data: relData }, { data: revData }] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('category_id', product.category_id)
          .neq('id', product.id)
          .eq('is_active', true)
          .limit(4),
        supabase
          .from('reviews')
          .select('*, users(full_name)')
          .eq('product_id', product.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      related = relData || [];
      reviews = revData || [];
    }
  } catch {
    // DB not available — ProductPageClient will use mock data from slug
  }

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />
      <main className="pb-20 md:pb-0 min-h-screen">
        <ProductPageClient
          product={product}
          slug={params.slug}
          related={related || []}
          reviews={reviews || []}
        />
      </main>
      <Footer />
      <MobileNav />
      <WhatsAppFloat />
    </>
  );
}
