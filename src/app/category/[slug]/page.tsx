// src/app/category/[slug]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CategorySlugRedirect({ params }: { params: { slug: string } }) {
  const { data: category } = await supabase
    .from('categories')
    .select('slug')
    .eq('slug', params.slug)
    .single();

  if (!category) {
    // Try to find closest match
    const { data: all } = await supabase.from('categories').select('slug').eq('is_active', true).limit(1);
    if (all && all.length > 0) redirect(`/collections/${all[0].slug}`);
    notFound();
  }

  redirect(`/collections/${category.slug}`);
}
