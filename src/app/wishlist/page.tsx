'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useStore } from '@/lib/store';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import CartSidebar from '@/components/cart/CartSidebar';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, setCartOpen } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        <AnnouncementBar />
        <Navbar />
        <SearchOverlay />
        <CartSidebar />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="spinner text-daisy-400" />
        </main>
      </>
    );
  }

  const handleRemove = (id: string) => {
    removeFromWishlist(id);
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (item: any) => {
    const { addItem } = useStore.getState();
    addItem({
      id: item.productId,
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      variant: null,
      quantity: 1,
    });
    toast.success('Added to bag!');
    setCartOpen(true);
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <main className="pb-20 md:pb-0 min-h-screen bg-white">
        {/* Page Header */}
        <div className="bg-cream border-b border-nude-200 py-12 px-4 text-center">
          <p className="section-subtitle">Saved Items</p>
          <h1 className="section-title">My Wishlist</h1>
          <p className="font-body text-sm text-daisy-500 mt-3">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12">
          {wishlist.length === 0 ? (
            <div className="text-center py-24">
              <div className="mb-6">
                <ShoppingBag size={64} className="mx-auto text-daisy-200" />
              </div>
              <h2 className="font-heading text-3xl text-daisy-300 mb-3">Your wishlist is empty</h2>
              <p className="font-body text-sm text-daisy-400 mb-8">
                Save your favorite items to your wishlist to view them later
              </p>
              <Link href="/collections" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} />
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((item: any) => (
                <div
                  key={item.productId}
                  className="bg-white border border-nude-200 overflow-hidden hover:shadow-card transition-shadow"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] bg-nude-100">
                    <Image
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-body text-sm font-medium text-daisy-900 line-clamp-2 mb-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-heading text-lg text-daisy-800">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={14} />
                        Add to Bag
                      </button>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="w-12 flex items-center justify-center border border-nude-200 text-daisy-600 hover:bg-nude-100 hover:border-daisy-400 transition-colors"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
