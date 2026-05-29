// src/app/pages/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase.from('cms_pages').select('meta_title,meta_description,og_image,title').eq('slug', params.slug).single();
  return {
    title: data?.meta_title || `${data?.title} | DAISY`,
    description: data?.meta_description || '',
    openGraph: data?.og_image ? { images: [data.og_image] } : {},
  };
}

export default async function CmsPage({ params }: { params: { slug: string } }) {
  const { data: page } = await supabase
    .from('cms_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!page) notFound();

  return (
    <>
      <AnnouncementBar/>
      <Navbar/>
      <SearchOverlay/>
      <CartSidebar/>
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
          <h1 className="font-heading text-4xl md:text-5xl text-daisy-900 font-light mb-8">{page.title}</h1>
          <article
            className="font-body text-daisy-700 leading-relaxed prose prose-headings:font-heading prose-headings:font-light prose-headings:text-daisy-900 prose-a:text-daisy-700 prose-a:underline max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
          <p className="font-body text-xs text-daisy-300 mt-12 pt-6 border-t border-nude-200">
            Last updated: {new Date(page.updated_at).toLocaleDateString('en-IN')}
          </p>
        </div>
      </main>
      <Footer/><MobileNav/>
    </>
  );
}
