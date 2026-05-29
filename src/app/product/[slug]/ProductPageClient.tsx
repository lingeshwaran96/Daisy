'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ShoppingBag, MessageCircle, Share2, ChevronDown,
  Star, Truck, Shield, RefreshCw, ZoomIn, Play,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import ProductCard from '@/components/product/ProductCard';
import { useStore } from '@/lib/store';
import { generateWhatsAppOrderURL, openWhatsApp } from '@/lib/whatsapp';
import type { Product, Review } from '@/types/database';

type Props = {
  product: (Product & { categories?: { name: string; slug: string } | null }) | null;
  slug: string;
  related: Product[];
  reviews: (Review & { users?: { full_name: string | null } | null })[];
};

// Mock products database mapped by slug
const MOCK_PRODUCTS_DB: Record<string, any> = {
  'product-1': {
    id: 'mock-1',
    name: '925 Silver Lotus Necklace',
    slug: 'product-1',
    description: `<p>This exquisite 925 sterling silver necklace features a hand-crafted lotus pendant symbolising purity and elegance. Each piece is meticulously finished with a mirror polish for a premium look.</p><ul><li>925 Sterling Silver – Hallmark certified</li><li>Rhodium plated for extra shine & tarnish resistance</li><li>Adjustable chain: 16" – 18"</li><li>Lotus pendant size: 2.5 cm</li></ul>`,
    short_description: 'Handcrafted 925 Sterling Silver lotus pendant necklace with rhodium finish.',
    price: 1299,
    offer_price: 999,
    images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=90', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=90', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=90'],
    video_url: null, category_id: 'cat-1', subcategory_id: null, tags: ['silver', 'necklace'], variants: [{ name: 'Chain Length', options: ['16 inch', '18 inch', '20 inch'] }],
    stock: 10, is_active: true, is_featured: true, is_bestseller: true, is_new_arrival: false, weight: '4.5g', material: '925 Sterling Silver', occasion: 'Everyday', specifications: { 'Metal': '925 Sterling Silver', 'Weight': '4.5g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-2': {
    id: 'mock-2',
    name: 'Rose Gold Jhumka Earrings',
    slug: 'product-2',
    description: `<p>Elegant rose gold plated jhumka earrings with traditional design. Perfect for festive occasions and daily wear.</p><ul><li>Rose Gold Plated</li><li>Lightweight & comfortable</li><li>Traditional jhumka design</li><li>Length: 3.5 cm</li></ul>`,
    short_description: 'Traditional rose gold jhumka earrings with elegant design.',
    price: 2499,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=90', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=90', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90'],
    video_url: null, category_id: 'cat-2', subcategory_id: null, tags: ['earrings', 'rose-gold'], variants: [{ name: 'Color', options: ['Rose Gold', 'Yellow Gold'] }],
    stock: 5, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '2.8g', material: 'Rose Gold Plated', occasion: 'Festive', specifications: { 'Material': 'Rose Gold Plated', 'Weight': '2.8g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-3': {
    id: 'mock-3',
    name: 'Kundan Bangle Set',
    slug: 'product-3',
    description: `<p>Exquisite kundan bangles with traditional craftsmanship and vibrant colors. Perfect wedding collection piece.</p><ul><li>Authentic kundan work</li><li>Set of 4 bangles</li><li>Available in various sizes</li><li>Perfect for weddings</li></ul>`,
    short_description: 'Traditional kundan bangle set with authentic handcrafted work.',
    price: 3299,
    offer_price: 2499,
    images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=90', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=90', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=90'],
    video_url: null, category_id: 'cat-3', subcategory_id: null, tags: ['bangles', 'kundan'], variants: [{ name: 'Size', options: ['2.2', '2.4', '2.6', '2.8'] }],
    stock: 0, is_active: true, is_featured: true, is_bestseller: true, is_new_arrival: false, weight: '18g', material: 'Kundan', occasion: 'Wedding', specifications: { 'Material': 'Kundan', 'Weight': '18g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-4': {
    id: 'mock-4',
    name: 'Oxidised Silver Ring',
    slug: 'product-4',
    description: `<p>Stunning oxidised silver ring with vintage appeal. Perfect for everyday elegance.</p><ul><li>Oxidised 925 Silver</li><li>Adjustable sizing</li><li>Unique vintage design</li><li>Unisex style</li></ul>`,
    short_description: 'Vintage oxidised silver ring with adjustable fit.',
    price: 899,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=90', 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=90', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=90', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=90'],
    video_url: null, category_id: 'cat-4', subcategory_id: null, tags: ['ring', 'oxidised', 'silver'], variants: [{ name: 'Size', options: ['6', '7', '8', '9', '10'] }],
    stock: 20, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '3.2g', material: 'Oxidised Silver', occasion: 'Daily', specifications: { 'Material': 'Oxidised 925 Silver', 'Weight': '3.2g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-5': {
    id: 'mock-5',
    name: 'Pearl Drop Earrings',
    slug: 'product-5',
    description: `<p>Elegant pearl drop earrings with sophisticated design. Perfect for any occasion.</p><ul><li>Natural pearls</li><li>Sterling silver hooks</li><li>Drop length: 4 cm</li><li>Classic elegance</li></ul>`,
    short_description: 'Classic pearl drop earrings with natural pearls and silver hooks.',
    price: 1899,
    offer_price: 1499,
    images: ['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=90', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=90', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=90', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=800&q=90'],
    video_url: null, category_id: 'cat-2', subcategory_id: null, tags: ['earrings', 'pearl'], variants: [{ name: 'Pearl Color', options: ['White', 'Black', 'Cream'] }],
    stock: 8, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '3.5g', material: 'Natural Pearls', occasion: 'Formal', specifications: { 'Material': 'Natural Pearls', 'Weight': '3.5g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-6': {
    id: 'mock-6',
    name: 'Silver Choker Chain',
    slug: 'product-6',
    description: `<p>Minimalist silver choker chain perfect for layering. Timeless classic piece.</p><ul><li>925 Sterling Silver</li><li>Adjustable length: 14-16 inches</li><li>Delicate chain design</li><li>Easy to layer</li></ul>`,
    short_description: 'Delicate silver choker chain perfect for everyday wear.',
    price: 2199,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=90', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=90', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=800&q=90', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=90'],
    video_url: null, category_id: 'cat-1', subcategory_id: null, tags: ['choker', 'chain', 'silver'], variants: [{ name: 'Length', options: ['14 inch', '16 inch'] }],
    stock: 3, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '2.2g', material: '925 Sterling Silver', occasion: 'Daily', specifications: { 'Material': '925 Sterling Silver', 'Weight': '2.2g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-7': {
    id: 'mock-7',
    name: 'Floral Silver Anklet',
    slug: 'product-7',
    description: `<p>Delicate silver anklet with floral motifs. Perfect for festive wear.</p><ul><li>925 Sterling Silver</li><li>Floral design</li><li>Adjustable closure</li><li>Weight: 5.5g</li></ul>`,
    short_description: 'Beautiful floral silver anklet with traditional design.',
    price: 1099,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=90', 'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=800&q=90', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=90', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=90'],
    video_url: null, category_id: 'cat-5', subcategory_id: null, tags: ['anklet', 'silver'], variants: [{ name: 'Size', options: ['One Size'] }],
    stock: 15, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: true, weight: '5.5g', material: '925 Sterling Silver', occasion: 'Festive', specifications: { 'Material': '925 Sterling Silver', 'Weight': '5.5g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-8': {
    id: 'mock-8',
    name: 'Diamond-Cut Bracelet',
    slug: 'product-8',
    description: `<p>Elegant bracelet with diamond-cut finish for maximum sparkle.</p><ul><li>925 Sterling Silver</li><li>Diamond-cut design</li><li>Length: 7-8 inches</li><li>Adjustable sizing</li></ul>`,
    short_description: 'Sparkling diamond-cut silver bracelet for special occasions.',
    price: 2799,
    offer_price: 2299,
    images: ['https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=800&q=90', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=90', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=90', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=90'],
    video_url: null, category_id: 'cat-6', subcategory_id: null, tags: ['bracelet', 'silver'], variants: [{ name: 'Size', options: ['7 inch', '7.5 inch', '8 inch'] }],
    stock: 7, is_active: true, is_featured: true, is_bestseller: true, is_new_arrival: false, weight: '8.5g', material: '925 Sterling Silver', occasion: 'Formal', specifications: { 'Material': '925 Sterling Silver', 'Weight': '8.5g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-9': {
    id: 'mock-9',
    name: 'Crystal Pendant Set',
    slug: 'product-9',
    description: `<p>Beautiful crystal pendant set with sterling silver chain and matching earrings.</p><ul><li>Natural crystals</li><li>925 Sterling silver</li><li>Set includes: necklace + earrings</li><li>Gift ready packaging</li></ul>`,
    short_description: 'Crystal pendant set with matching earrings and silver chain.',
    price: 1599,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=800&q=90', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=90', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=90', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=90'],
    video_url: null, category_id: 'cat-7', subcategory_id: null, tags: ['set', 'crystal', 'pendant'], variants: [{ name: 'Crystal Type', options: ['Rose Quartz', 'Amethyst', 'Clear'] }],
    stock: 12, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '6.2g', material: 'Natural Crystals', occasion: 'Gifting', specifications: { 'Material': 'Natural Crystals & 925 Silver', 'Weight': '6.2g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-10': {
    id: 'mock-10',
    name: 'Temple Coin Necklace',
    slug: 'product-10',
    description: `<p>Vintage temple coin necklace with traditional craftsmanship. Perfect heritage piece.</p><ul><li>Antique temple coins</li><li>Gold-plated finish</li><li>Adjustable length</li><li>Statement piece</li></ul>`,
    short_description: 'Traditional temple coin necklace with vintage appeal.',
    price: 3499,
    offer_price: 2799,
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=90', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=90', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=90', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90'],
    video_url: null, category_id: 'cat-1', subcategory_id: null, tags: ['necklace', 'temple', 'coin'], variants: [{ name: 'Length', options: ['16 inch', '18 inch', '20 inch'] }],
    stock: 0, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '12g', material: 'Gold Plated', occasion: 'Heritage', specifications: { 'Material': 'Antique Coins with Gold Plating', 'Weight': '12g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-11': {
    id: 'mock-11',
    name: 'Silver Toe Rings Set',
    slug: 'product-11',
    description: `<p>Traditional silver toe rings set. Perfect for traditional occasions.</p><ul><li>925 Sterling Silver</li><li>Set of 5 pairs</li><li>Adjustable sizing</li><li>Traditional design</li></ul>`,
    short_description: 'Traditional silver toe rings set with 5 pairs.',
    price: 699,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=90', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=90', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=90', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90'],
    video_url: null, category_id: 'cat-5', subcategory_id: null, tags: ['toe-rings', 'silver'], variants: [{ name: 'Size', options: ['Small', 'Medium', 'Large'] }],
    stock: 25, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '4.8g', material: '925 Sterling Silver', occasion: 'Traditional', specifications: { 'Material': '925 Sterling Silver', 'Weight': '4.8g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  'product-12': {
    id: 'mock-12',
    name: 'Boho Stack Ring Set',
    slug: 'product-12',
    description: `<p>Trendy bohemian stack ring set. Mix and match to create your style.</p><ul><li>925 Sterling Silver</li><li>Set of 6 rings</li><li>Mix of designs</li><li>Adjustable sizing</li></ul>`,
    short_description: 'Boho stack ring set with 6 assorted designs.',
    price: 1799,
    offer_price: null,
    images: ['https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&q=90', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=90', 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=90', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=90'],
    video_url: null, category_id: 'cat-4', subcategory_id: null, tags: ['rings', 'boho'], variants: [{ name: 'Size', options: ['6', '7', '8', '9'] }],
    stock: 6, is_active: true, is_featured: false, is_bestseller: false, is_new_arrival: false, weight: '7.5g', material: '925 Sterling Silver', occasion: 'Casual', specifications: { 'Material': '925 Sterling Silver', 'Weight': '7.5g' }, meta_title: null, meta_description: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
};

// Helper function to get mock product by slug
function getMockProduct(slug: string): Product {
  return MOCK_PRODUCTS_DB[slug] || MOCK_PRODUCTS_DB['product-1'];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < rating ? 'fill-daisy-gold text-daisy-gold' : 'text-nude-200 fill-nude-200'} />
      ))}
    </div>
  );
}

export default function ProductPageClient({ product: dbProduct, slug, related, reviews }: Props) {
  const product = dbProduct || getMockProduct(slug);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQty] = useState(1);
  const [openTab, setOpenTab] = useState<string | null>('description');
  const [zoomed, setZoomed] = useState(false);
  const { addItem, isWishlisted, setCartOpen, openWhatsAppModal } = useStore();
  const [trustBadges, setTrustBadges] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const { data } = await supabase
          .from('trust_badges')
          .select('*')
          .order('sort_order', { ascending: true })
          .limit(3);

        if (data && data.length > 0) {
          setTrustBadges(data);
        } else {
          setTrustBadges([
            { icon: 'Truck', title: 'Free Shipping', description: 'On orders above ₹1000' },
            { icon: 'Shield', title: '100% Authentic', description: 'Certified silver & gold' },
            { icon: 'RefreshCw', title: '7-Day Returns', description: 'Hassle-free returns' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching trust badges:', err);
      }
    }
    fetchBadges();
  }, []);

  const price = product.offer_price || product.price;
  const discount = product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = () => {
    if (product.stock === 0) return;
    const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
    addItem({ id: product.id, productId: product.id, name: product.name, price, image: product.images?.[0] || '', variant: variantStr || null, quantity });
    toast.success('Added to bag!');
    setCartOpen(true);
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const variantStr = Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(', ');
    openWhatsAppModal([
      {
        id: `${product.id}-${variantStr || 'default'}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: price,
        image: product.images?.[0] || '',
        variant: variantStr || null,
        quantity: quantity
      }
    ], price * quantity);
  };

  const handleWishlist = () => {
    const store = useStore.getState();
    if (wishlisted) { store.removeFromWishlist(product.id); toast('Removed from wishlist'); }
    else { store.addToWishlist({ productId: product.id, name: product.name, price, image: product.images?.[0] || '' }); toast.success('❤️ Saved to wishlist!'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const TABS = [
    { id: 'description', label: 'Description', content: product.description },
    { id: 'specifications', label: 'Specifications', content: null },
    { id: 'shipping', label: 'Shipping & Returns', content: '<p>Free shipping on orders above ₹1000. Standard delivery 3-7 business days. Express delivery available. 7-day hassle-free returns. Contact us via WhatsApp for return requests.</p>' },
    { id: 'care', label: 'Care Instructions', content: '<p>Store in the provided velvet pouch. Avoid contact with perfumes, water, and chemicals. Clean with a soft silver cloth. Do not use harsh cleaners.</p>' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-body text-xs text-daisy-400 mb-8">
        <Link href="/" className="hover:text-daisy-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/collections" className="hover:text-daisy-700 transition-colors">Collections</Link>
        <span>/</span>
        <span className="text-daisy-700">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">
        {/* ---- Left: Images ---- */}
        <div className="space-y-4">
          {/* Main Image */}
          <div
            className="relative aspect-square bg-nude-100 overflow-hidden cursor-zoom-in"
            onClick={() => setZoomed(!zoomed)}
          >
            <Image
              src={product.images?.[activeImage] || '/images/placeholder.jpg'}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-700 ${zoomed ? 'scale-150' : 'scale-100'}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
            {/* Zoom hint */}
            <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-2 opacity-70 hover:opacity-100 transition-opacity">
              <ZoomIn size={16} className="text-daisy-700" />
            </div>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.is_new_arrival && <span className="badge-new">New</span>}
              {discount > 0 && <span className="badge-sale">-{discount}%</span>}
              {product.is_bestseller && <span className="badge-bestseller">Best Seller</span>}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {product.images?.map((img, i) => (
              <button
                key={i}
                onClick={() => { setActiveImage(i); setZoomed(false); }}
                className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-all duration-200 ${activeImage === i ? 'border-daisy-700' : 'border-transparent hover:border-nude-300'
                  }`}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={img} alt={`${product.name} ${i + 1}`} width={80} height={80} className="object-cover w-full h-full" />
              </button>
            ))}
            {product.video_url && (
              <button className="relative w-20 h-20 flex-shrink-0 bg-daisy-900 border-2 border-transparent hover:border-daisy-400 transition-colors flex items-center justify-center">
                <Play size={20} className="text-cream" />
              </button>
            )}
          </div>
        </div>

        {/* ---- Right: Product Info ---- */}
        <div>
          {/* Title + Wishlist */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h1 className="font-heading text-2xl md:text-4xl font-light text-daisy-900 leading-tight">
              {product.name}
            </h1>
            <button
              onClick={handleWishlist}
              className="w-10 h-10 border border-nude-200 flex items-center justify-center flex-shrink-0 hover:border-rose-gold transition-colors"
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={wishlisted ? 'fill-rose-gold text-rose-gold' : 'text-daisy-600'} />
            </button>
          </div>

          {/* Material badge */}
          {product.material && (
            <p className="font-body text-xs tracking-widest uppercase text-daisy-400 mb-4">
              {product.material}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-3 mb-6">
            <StarRating rating={5} />
            <span className="font-body text-sm text-daisy-500">
              ({reviews.length || 24} reviews)
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="font-body text-xs text-red-500 ml-auto">
                Only {product.stock} left!
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-8">
            <span className="font-heading text-4xl text-daisy-900">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {product.offer_price && (
              <>
                <span className="font-heading text-xl text-daisy-400 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="badge-sale">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Variants */}
          {product.variants?.map((variant: any) => (
            <div key={variant.name} className="mb-6">
              <p className="font-body text-sm font-medium text-daisy-900 mb-3">
                {variant.name}:
                {selectedVariants[variant.name] && (
                  <span className="text-daisy-500 font-normal ml-2">{selectedVariants[variant.name]}</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: opt }))}
                    className={`px-4 py-2 border font-body text-sm transition-all duration-200 ${selectedVariants[variant.name] === opt
                      ? 'border-daisy-800 bg-daisy-800 text-cream'
                      : 'border-nude-200 text-daisy-700 hover:border-daisy-400'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-8">
            <span className="font-body text-sm text-daisy-700">Quantity</span>
            <div className="flex items-center border border-nude-200">
              <button
                onClick={() => setQty(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-nude-100 transition-colors font-body text-lg"
              >−</button>
              <span className="w-12 text-center font-body text-sm">{quantity}</span>
              <button
                onClick={() => setQty(Math.min(product.stock, quantity + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-nude-100 transition-colors font-body text-lg"
              >+</button>
            </div>
            <span className="font-body text-xs text-daisy-400">
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-outline py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} />
              Add to Bag
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={product.stock === 0}
              className="btn-whatsapp py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle size={18} />
              Buy on WhatsApp
            </button>
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 font-body text-xs text-daisy-400 hover:text-daisy-700 transition-colors mb-8"
          >
            <Share2 size={14} />
            Share this product
          </button>

          {/* Mini Trust Badges */}
          {trustBadges.length > 0 && (
            <div className={`grid gap-4 py-5 border-y border-nude-200/60 mb-8 bg-cream/10 ${
              trustBadges.length === 1 ? 'grid-cols-1 max-w-[150px] mx-auto' :
              trustBadges.length === 2 ? 'grid-cols-2 max-w-[300px] mx-auto' :
              'grid-cols-3'
            }`}>
              {trustBadges.map((badge) => {
                const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.HelpCircle;
                return (
                  <div key={badge.title} className="flex flex-col items-center text-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-nude-50/50 flex items-center justify-center transition-colors group-hover:bg-nude-100/50">
                      <IconComponent size={16} className="text-daisy-700 stroke-[1.5]" />
                    </div>
                    <span className="font-body text-[10px] text-daisy-800 font-medium tracking-wider uppercase leading-tight">
                      {badge.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Expandable Info Tabs */}
          <div className="space-y-0 border-t border-nude-200">
            {TABS.map((tab) => (
              <div key={tab.id} className="border-b border-nude-200">
                <button
                  onClick={() => setOpenTab(openTab === tab.id ? null : tab.id)}
                  className="w-full flex items-center justify-between py-4 font-body text-sm font-medium text-daisy-900 hover:text-daisy-600 transition-colors"
                >
                  {tab.label}
                  <ChevronDown
                    size={16}
                    className={`text-daisy-400 transition-transform duration-300 ${openTab === tab.id ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openTab === tab.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5">
                        {tab.id === 'specifications' && product.specifications ? (
                          <table className="w-full font-body text-sm">
                            <tbody>
                              {Object.entries(product.specifications).map(([key, val]) => (
                                <tr key={key} className="border-b border-nude-100">
                                  <td className="py-2 pr-4 text-daisy-500 font-medium w-1/3">{key}</td>
                                  <td className="py-2 text-daisy-800">{val as string}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div
                            className="font-body text-sm text-daisy-600 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: tab.content || '' }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="mt-20 pt-12 border-t border-nude-200">
          <h2 className="font-heading text-3xl text-daisy-900 mb-8">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 border border-nude-200 bg-cream">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-body text-sm font-medium text-daisy-900">
                      {review.users?.full_name || 'Verified Customer'}
                    </p>
                    {review.is_verified && (
                      <span className="font-body text-[10px] text-green-600 tracking-widest uppercase">✓ Verified Purchase</span>
                    )}
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.title && <h4 className="font-body text-sm font-medium text-daisy-800 mb-2">{review.title}</h4>}
                <p className="font-body text-sm text-daisy-600 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-nude-200">
          <h2 className="font-heading text-3xl text-daisy-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
