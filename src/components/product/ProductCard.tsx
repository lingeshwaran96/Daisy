// src/components/product/ProductCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import type { Product } from '@/types/database';

type Props = {
  product: Product;
  index?: number;
};

export default function ProductCard({ product, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const { addItem, isWishlisted, setCartOpen } = useStore();

  const price = product.offer_price || product.price;
  const discount = product.offer_price
    ? Math.round(((product.price - product.offer_price) / product.price) * 100)
    : 0;
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price,
      image: product.images?.[0] || '',
      variant: null,
      quantity: 1,
    });
    toast.success('Added to bag!');
    setCartOpen(true);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    const { addToWishlist, removeFromWishlist } = useStore.getState();
    if (wishlisted) {
      removeFromWishlist(product.id);
      toast('Removed from wishlist');
    } else {
      addToWishlist({ productId: product.id, name: product.name, price, image: product.images?.[0] || '' });
      toast.success('❤️ Added to wishlist!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="product-card"
      onMouseEnter={() => { setHovered(true); if (product.images?.length > 1) setImgIndex(1); }}
      onMouseLeave={() => { setHovered(false); setImgIndex(0); }}
    >
      <Link href={`/product/${product.slug || product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] bg-nude-100 overflow-hidden">
          {(product.images?.length > 0 && product.images[0]) ? (
            <Image
              src={product.images?.[imgIndex] || product.images[0]}
              alt={product.name}
              fill
              className="object-cover product-image transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-daisy-300">
              <ShoppingBag size={32} className="mb-2 opacity-40" />
              <span className="font-body text-[10px] tracking-widest uppercase opacity-60">No Image</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_new_arrival && <span className="badge-new">New</span>}
            {discount > 0 && <span className="badge-sale">-{discount}%</span>}
            {product.is_bestseller && <span className="badge-bestseller">Best Seller</span>}
            {product.stock === 0 && (
              <span className="badge bg-gray-500 text-white">Sold Out</span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={wishlisted ? 'fill-rose-gold text-rose-gold' : 'text-daisy-600'}
            />
          </button>

          {/* Quick Actions – appear on hover */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-0 left-0 right-0 flex gap-px"
          >
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-daisy-900/90 backdrop-blur-sm text-cream py-3.5 font-body text-[11px] tracking-widest uppercase hover:bg-daisy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={14} />
              {product.stock === 0 ? 'Sold Out' : 'Add to Bag'}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/product/${product.slug || product.id}`;
              }}
              className="w-12 flex items-center justify-center bg-daisy-900/80 backdrop-blur-sm text-cream hover:bg-daisy-800 transition-colors"
              aria-label="Quick view"
            >
              <Eye size={16} />
            </button>
          </motion.div>
        </div>

        {/* Info */}
        <div className="pt-4 pb-2">
          <h3 className="font-body text-sm font-medium text-daisy-900 leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-heading text-lg text-daisy-800">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {product.offer_price && (
              <span className="font-body text-sm text-daisy-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.material && (
            <p className="font-body text-xs text-daisy-400 mt-1">{product.material}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
