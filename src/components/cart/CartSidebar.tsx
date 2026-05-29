'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingBag, MessageCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getShippingSettings } from '@/lib/whatsapp';
import WhatsAppCheckoutModal from './WhatsAppCheckoutModal';

export default function CartSidebar() {
  const { cartOpen, setCartOpen, items, removeItem, updateQty, totalPrice, openWhatsAppModal } = useStore();
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [shippingFee, setShippingFee] = useState(99);
  const [freeThreshold, setFreeThreshold] = useState(1000);
  const [shippingEnabled, setShippingEnabled] = useState(true);

  const total = totalPrice();
  const freeShippingLeft = Math.max(0, freeThreshold - total);
  const currentShippingFee = !shippingEnabled ? 0 : (shippingFee === 0 || total >= freeThreshold ? 0 : shippingFee);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'checkout_enabled')
      .single()
      .then(({ data }) => {
        if (data && data.value === 'false') {
          setCheckoutEnabled(false);
        } else {
          setCheckoutEnabled(true);
        }
      });

    getShippingSettings().then(settings => {
      setShippingFee(settings.shippingFee);
      setFreeThreshold(settings.freeShippingThreshold);
      setShippingEnabled(settings.shippingFeeEnabled);
    });
  }, [cartOpen]);

  const handleWhatsAppOrder = () => {
    setCartOpen(false);
    openWhatsAppModal(
      items.map((i) => ({ ...i })),
      total
    );
  };

  return (
    <>
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[80]"
            onClick={() => setCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[90] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-nude-200">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-daisy-800" />
                <h2 className="font-heading text-xl text-daisy-900">Your Bag ({items.length})</h2>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-1 text-daisy-600 hover:text-daisy-900 transition-colors">
                <X size={22} />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {shippingFee === 0 ? (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                <p className="font-body text-xs text-green-700 font-medium">🎉 Enjoy FREE shipping on all orders!</p>
              </div>
            ) : freeShippingLeft > 0 ? (
              <div className="px-6 py-3 bg-nude-100 border-b border-nude-200">
                <p className="font-body text-xs text-daisy-700 mb-2">
                  Add <strong>₹{freeShippingLeft.toLocaleString('en-IN')}</strong> more for FREE shipping
                </p>
                <div className="h-1 bg-nude-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-daisy-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (total / freeThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100">
                <p className="font-body text-xs text-green-700 font-medium">🎉 You've unlocked FREE shipping!</p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <ShoppingBag size={48} className="text-daisy-200" />
                  <div>
                    <p className="font-heading text-xl text-daisy-800 mb-1">Your bag is empty</p>
                    <p className="font-body text-sm text-daisy-400">Discover our luxurious collections</p>
                  </div>
                  <Link href="/collections" onClick={() => setCartOpen(false)} className="btn-primary mt-2">
                    Shop Now
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-5 border-b border-nude-100">
                    {/* Image */}
                    <div className="relative w-20 h-24 bg-nude-100 flex-shrink-0">
                      <Image
                        src={item.image || '/images/placeholder.jpg'}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body text-sm font-medium text-daisy-900 leading-tight truncate">
                        {item.name}
                      </h3>
                      {item.variant && (
                        <p className="font-body text-xs text-daisy-400 mt-0.5">{item.variant}</p>
                      )}
                      <p className="font-heading text-base text-daisy-800 mt-1">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1, item.variant)}
                          className="w-7 h-7 border border-nude-200 flex items-center justify-center hover:border-daisy-400 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-body text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1, item.variant)}
                          className="w-7 h-7 border border-nude-200 flex items-center justify-center hover:border-daisy-400 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>

                        <button
                          onClick={() => removeItem(item.productId, item.variant)}
                          className="ml-auto text-daisy-300 hover:text-red-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-nude-200 px-6 py-5 space-y-3 bg-white">
                <div className="flex justify-between font-body text-sm text-daisy-600">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
                {shippingEnabled && (
                  <div className="flex justify-between font-body text-sm text-daisy-600">
                    <span>Shipping Fee</span>
                    <span className={currentShippingFee === 0 ? "text-green-600 font-medium" : ""}>
                      {currentShippingFee === 0 ? 'FREE' : `₹${currentShippingFee}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-heading text-xl text-daisy-900">
                  <span>Total</span>
                  <span>₹{(total + currentShippingFee).toLocaleString('en-IN')}</span>
                </div>

                {checkoutEnabled && (
                  <Link
                    href="/checkout"
                    onClick={() => setCartOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Proceed to Checkout
                  </Link>
                )}

                <button
                  onClick={handleWhatsAppOrder}
                  className="btn-whatsapp w-full"
                >
                  <MessageCircle size={16} />
                  Order via WhatsApp
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
    <WhatsAppCheckoutModal />
    </>
  );
}
