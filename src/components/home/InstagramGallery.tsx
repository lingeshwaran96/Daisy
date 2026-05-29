// src/components/home/InstagramGallery.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Instagram, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Fallback images when no posts exist in DB
const FALLBACK_POSTS = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&q=80',
  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80',
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=400&q=80',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&q=80',
];

type InstaPost = {
  id: string;
  image_url: string;
  caption: string | null;
  post_url: string | null;
};

export default function InstagramGallery() {
  const [posts, setPosts] = useState<InstaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  // Dynamic profile settings from admin panel
  const [handle, setHandle] = useState('@daisy.jewels');
  const [hashtag, setHashtag] = useState('#DaisyElegance');
  const [profileUrl, setProfileUrl] = useState('https://instagram.com');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch posts
        const { data: postData, error: postError } = await supabase
          .from('instagram_posts')
          .select('id, image_url, caption, post_url')
          .eq('is_active', true)
          .order('sort_order');

        if (postError) throw postError;

        if (postData && postData.length > 0) {
          setPosts(postData as InstaPost[]);
        } else {
          setUseFallback(true);
        }
      } catch {
        // Table might not exist yet – use fallback images
        setUseFallback(true);
      }

      // Fetch profile settings
      try {
        const { data: settingsData } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['instagram_handle', 'instagram_hashtag', 'instagram_profile_url']);

        if (settingsData) {
          settingsData.forEach((row: { key: string; value: string }) => {
            if (row.key === 'instagram_handle') setHandle(row.value);
            if (row.key === 'instagram_hashtag') setHashtag(row.value);
            if (row.key === 'instagram_profile_url') setProfileUrl(row.value);
          });
        }
      } catch {
        // site_settings table might not exist – use defaults
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  // Build the display list
  const displayPosts: { src: string; href: string; alt: string }[] = useFallback
    ? FALLBACK_POSTS.map((src, i) => ({
        src,
        href: profileUrl,
        alt: `Instagram post ${i + 1}`,
      }))
    : posts.map((p, i) => ({
        src: p.image_url,
        href: p.post_url || profileUrl,
        alt: p.caption || `Instagram post ${i + 1}`,
      }));

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      {/* Header */}
      <div className="text-center px-4 mb-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Instagram size={18} className="text-daisy-600" />
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-daisy-400">Follow Us</p>
        </div>
        <h2 className="font-heading text-2xl md:text-4xl font-light text-daisy-900">
          {handle}
        </h2>
        <p className="font-body text-sm text-daisy-400 mt-2">
          Tag us with <strong>{hashtag}</strong> to be featured
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-daisy-300 animate-spin" />
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-3 md:grid-cols-6 gap-px">
          {displayPosts.map((post, i) => (
            <motion.a
              key={i}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-square group overflow-hidden block"
            >
              <Image
                src={post.src}
                alt={post.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 33vw, 16vw"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-daisy-900/0 group-hover:bg-daisy-900/50 transition-colors duration-400 flex items-center justify-center">
                <Instagram size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </section>
  );
}
