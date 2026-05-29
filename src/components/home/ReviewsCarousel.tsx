// src/components/home/ReviewsCarousel.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type Testimonial = {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  rating: number;
  review_text: string;
  product_name: string | null;
  is_verified: boolean;
  location?: string;
};

const FALLBACK: Testimonial[] = [
  { id:'1', customer_name:'Priya Sharma', customer_photo:null, rating:5, review_text:'I ordered the silver lotus necklace for my anniversary and it exceeded all expectations. The craftsmanship is impeccable and it arrived beautifully packaged. Will definitely order again!', product_name:'925 Silver Lotus Necklace', is_verified:true },
  { id:'2', customer_name:'Ananya Krishnan', customer_photo:null, rating:5, review_text:'Daisy jewellery is genuinely luxurious. The silver quality is top-notch, the designs are unique and the customer service is amazing. The WhatsApp ordering was super convenient!', product_name:'Pearl Drop Earrings', is_verified:true },
  { id:'3', customer_name:'Meera Nair', customer_photo:null, rating:5, review_text:'Ordered a gift set for my mother\'s birthday. The packaging was luxurious and she absolutely loved every piece. Fast delivery and great communication throughout. 10/10!', product_name:'Luxury Gift Box Set', is_verified:true },
  { id:'4', customer_name:'Deepa Patel', customer_photo:null, rating:5, review_text:'The bangles are exquisite — lightweight yet sturdy. The finishing is flawless. I was surprised by how authentic the silver feels. Already placed my second order!', product_name:'Kundan Bangle Set', is_verified:true },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < count ? 'fill-daisy-gold text-daisy-gold' : 'text-nude-200 fill-nude-200'} />
      ))}
    </div>
  );
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-daisy-600 flex-shrink-0">
        <Image src={photo} alt={name} width={48} height={48} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-daisy-700 flex items-center justify-center font-body text-sm font-medium text-cream flex-shrink-0">
      {initials}
    </div>
  );
}

export default function ReviewsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) setTestimonials(data as Testimonial[]);
    }
    fetchTestimonials();
  }, []);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [autoPlay, testimonials.length]);

  const prev = () => { setAutoPlay(false); setCurrent(c => (c - 1 + testimonials.length) % testimonials.length); };
  const next = () => { setAutoPlay(false); setCurrent(c => (c + 1) % testimonials.length); };

  const review = testimonials[current];
  if (!review) return null;

  return (
    <section className="py-20 md:py-28 bg-daisy-950 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-daisy-400 mb-3">Testimonials</p>
          <h2 className="font-heading text-3xl md:text-5xl font-light text-cream">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <StarRow count={5} />
            <span className="font-body text-sm text-cream/60 ml-1">4.9 out of 5 (2,400+ reviews)</span>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-white/5 border border-white/10 backdrop-blur-sm p-8 md:p-12 text-center"
            >
              <Quote size={32} className="text-daisy-600 mx-auto mb-6" />
              <StarRow count={review.rating} />
              <p className="font-body text-cream/80 leading-relaxed text-sm md:text-base mt-6 mb-8 italic">
                &ldquo;{review.review_text}&rdquo;
              </p>
              <div className="flex items-center justify-center gap-3">
                <Avatar name={review.customer_name} photo={review.customer_photo} />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-medium text-cream">{review.customer_name}</span>
                    {review.is_verified && (
                      <span className="flex items-center gap-1 font-body text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 tracking-widest uppercase">
                        <BadgeCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
                  {review.product_name && (
                    <span className="font-body text-xs text-cream/50">{review.product_name}</span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          {testimonials.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center text-cream/60 hover:text-cream hover:border-white/40 transition-colors"
                aria-label="Previous review">
                <ChevronLeft size={18} />
              </button>
              <button onClick={next}
                className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 flex items-center justify-center text-cream/60 hover:text-cream hover:border-white/40 transition-colors"
                aria-label="Next review">
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => { setAutoPlay(false); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-1.5 bg-daisy-400' : 'w-1.5 h-1.5 bg-white/30'}`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
