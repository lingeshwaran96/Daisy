// src/app/orders/[id]/OrderDetailsClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Clock, MapPin, Phone, Mail, ShoppingBag, 
  ShieldCheck, ArrowLeft, Loader2, AlertCircle, FileText,
  BadgeAlert, Sparkles, Printer, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';

type OrderItem = {
  productId: string;
  name: string;
  image: string | null;
  variant: string | null;
  quantity: number;
  price: number;
  sku?: string | null;
};

type OrderData = {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    landmark?: string | null;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderItem[];
  isTemp: boolean;
};

export default function OrderDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    async function fetchOrderDetails() {
      setLoading(true);
      setError(null);

      try {
        // 1. Attempt to fetch from confirmed orders table
        const { data: confirmedOrder, error: confirmedError } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('order_number', orderId)
          .maybeSingle();

        if (confirmedOrder) {
          // Fetch additional product details (specifically SKU) for items
          const itemsWithSku = await Promise.all(
            confirmedOrder.order_items.map(async (item: any) => {
              let sku = null;
              if (item.product_id) {
                const { data: prod } = await supabase
                  .from('products')
                  .select('sku')
                  .eq('id', item.product_id)
                  .maybeSingle();
                if (prod) sku = prod.sku;
              }
              return {
                productId: item.product_id,
                name: item.product_name,
                image: item.product_image,
                variant: item.variant,
                quantity: item.quantity,
                price: Number(item.price),
                sku: sku || 'DSY-' + item.product_name.substring(0, 3).toUpperCase() + '-001'
              };
            })
          );

          setOrder({
            orderNumber: confirmedOrder.order_number,
            createdAt: confirmedOrder.created_at,
            status: confirmedOrder.status,
            paymentMethod: confirmedOrder.payment_method,
            paymentStatus: confirmedOrder.payment_status,
            subtotal: Number(confirmedOrder.subtotal),
            shippingFee: Number(confirmedOrder.shipping_fee),
            discount: Number(confirmedOrder.discount || 0),
            total: Number(confirmedOrder.total),
            shippingAddress: {
              fullName: confirmedOrder.shipping_address.full_name || confirmedOrder.shipping_address.fullName,
              phone: confirmedOrder.shipping_address.phone,
              email: confirmedOrder.shipping_address.email || 'N/A',
              addressLine1: confirmedOrder.shipping_address.address_line1 || confirmedOrder.shipping_address.addressLine1,
              addressLine2: confirmedOrder.shipping_address.address_line2 || confirmedOrder.shipping_address.addressLine2 || null,
              landmark: confirmedOrder.shipping_address.landmark || null,
              city: confirmedOrder.shipping_address.city,
              state: confirmedOrder.shipping_address.state,
              pincode: confirmedOrder.shipping_address.pincode,
              country: confirmedOrder.shipping_address.country || 'India'
            },
            items: itemsWithSku,
            isTemp: false
          });
          setLoading(false);
          return;
        }

        // 2. If not in confirmed orders, fetch from temp_orders table
        const { data: tempOrder, error: tempError } = await supabase
          .from('temp_orders')
          .select('*')
          .eq('temp_order_number', orderId)
          .maybeSingle();

        if (tempOrder) {
          const rawItems = Array.isArray(tempOrder.items) ? tempOrder.items : [];
          
          const itemsWithSku = await Promise.all(
            rawItems.map(async (item: any) => {
              let sku = null;
              if (item.productId) {
                const { data: prod } = await supabase
                  .from('products')
                  .select('sku')
                  .eq('id', item.productId)
                  .maybeSingle();
                if (prod) sku = prod.sku;
              }
              return {
                productId: item.productId,
                name: item.name,
                image: item.image,
                variant: item.variant,
                quantity: item.quantity,
                price: Number(item.price),
                sku: sku || 'DSY-' + item.name.substring(0, 3).toUpperCase() + '-001'
              };
            })
          );

          setOrder({
            orderNumber: tempOrder.temp_order_number,
            createdAt: tempOrder.created_at,
            status: tempOrder.status === 'pending_verification' ? 'pending' : tempOrder.status,
            paymentMethod: 'whatsapp',
            paymentStatus: tempOrder.status === 'approved' ? 'paid' : 'pending',
            subtotal: Number(tempOrder.subtotal),
            shippingFee: Number(tempOrder.shipping_fee),
            discount: 0,
            total: Number(tempOrder.total),
            shippingAddress: {
              fullName: tempOrder.shipping_address.fullName || tempOrder.shipping_address.full_name,
              phone: tempOrder.shipping_address.phone,
              email: tempOrder.shipping_address.email || 'N/A',
              addressLine1: tempOrder.shipping_address.addressLine1 || tempOrder.shipping_address.address_line1,
              addressLine2: tempOrder.shipping_address.addressLine2 || tempOrder.shipping_address.address_line2 || null,
              landmark: tempOrder.shipping_address.landmark || null,
              city: tempOrder.shipping_address.city,
              state: tempOrder.shipping_address.state,
              pincode: tempOrder.shipping_address.pincode,
              country: tempOrder.shipping_address.country || 'India'
            },
            items: itemsWithSku,
            isTemp: true
          });
          setLoading(false);
          return;
        }

        // 3. If not found in either table
        setError("Order details could not be found. Please check your order ID or contact support.");
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError("An error occurred while loading your order. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending_verification':
        return {
          label: 'Awaiting Payment Verification',
          color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
          Icon: Clock
        };
      case 'approved':
      case 'confirmed':
        return {
          label: 'Order Confirmed',
          color: 'text-green-700 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-900/50',
          Icon: CheckCircle
        };
      case 'processing':
        return {
          label: 'Processing Order',
          color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
          Icon: Loader2
        };
      case 'shipped':
        return {
          label: 'Order Shipped',
          color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
          Icon: Sparkles
        };
      case 'delivered':
        return {
          label: 'Delivered Successfully',
          color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
          Icon: ShieldCheck
        };
      default:
        return {
          label: status.toUpperCase(),
          color: 'text-gray-700 bg-gray-50 dark:bg-zinc-800/50 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
          Icon: AlertCircle
        };
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar />
      <SearchOverlay />
      <CartSidebar />

      <main className="min-h-screen bg-cream dark:bg-neutral-950 py-10 md:py-16 transition-colors duration-300">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 md:px-8">
          
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 font-body text-xs text-daisy-500 hover:text-daisy-800 dark:hover:text-daisy-300 transition-colors mb-8 group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 shadow-sm rounded-2xl">
              <Loader2 className="animate-spin text-daisy-700 mb-4" size={32} />
              <p className="font-body text-sm text-daisy-500 dark:text-daisy-400">Fetching order details...</p>
            </div>
          ) : error || !order ? (
            <div className="bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 shadow-sm rounded-2xl p-8 md:p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
              <h2 className="font-heading text-2xl text-daisy-900 dark:text-cream mb-2">Order Not Found</h2>
              <p className="font-body text-sm text-daisy-500 dark:text-daisy-400 max-w-md mx-auto mb-6">
                {error || "We couldn't retrieve the details for order number. It may be pending upload, or the URL may be incorrect."}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/collections" className="btn-primary py-3 rounded-xl font-body text-xs">
                  Continue Shopping
                </Link>
                <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="btn-outline py-3 rounded-xl font-body text-xs">
                  Contact Support
                </a>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <span className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block">Daisy Luxury Order</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-heading text-2xl md:text-3xl font-light text-daisy-900 dark:text-cream">
                      Order: <span className="font-semibold">{order.orderNumber}</span>
                    </h1>
                  </div>
                  <p className="font-body text-xs text-daisy-550 dark:text-daisy-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* Status badges */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3.5 w-full md:w-auto">
                  {(() => {
                    const status = getStatusDisplay(order.status);
                    const StatusIcon = status.Icon;
                    return (
                      <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 border rounded-full text-xs font-body font-semibold tracking-wide ${status.color}`}>
                        <StatusIcon size={14} className={order.status === 'processing' ? 'animate-spin' : ''} />
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Left side: Items & Totals (Col-span 2) */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Items List Card */}
                  <div className="bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="font-heading text-xl text-daisy-900 dark:text-cream border-b border-nude-100 dark:border-neutral-850 pb-4 mb-6 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-daisy-700" />
                      Items in Order
                    </h2>

                    <div className="divide-y divide-nude-100 dark:divide-neutral-850">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                          {/* Image */}
                          <div className="relative w-20 h-24 bg-nude-50 dark:bg-neutral-800 flex-shrink-0 border border-nude-100 dark:border-neutral-850 overflow-hidden">
                            <Image
                              src={item.image || '/images/placeholder.jpg'}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>

                          {/* Item details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="font-body text-sm font-semibold text-daisy-900 dark:text-cream leading-tight truncate">
                                {item.name}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-xs text-daisy-450 dark:text-daisy-400 mt-1.5">
                                <span><strong>SKU:</strong> {item.sku}</span>
                                {item.variant && <span><strong>Variant:</strong> {item.variant}</span>}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3">
                              <span className="font-body text-xs text-daisy-500 dark:text-daisy-400">
                                ₹{item.price.toLocaleString('en-IN')} × {item.quantity}
                              </span>
                              <span className="font-heading text-base text-daisy-900 dark:text-cream font-medium">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm">
                    <h2 className="font-heading text-xl text-daisy-900 dark:text-cream border-b border-nude-100 dark:border-neutral-850 pb-4 mb-5 flex items-center gap-2">
                      <FileText size={20} className="text-daisy-700" />
                      Order Details
                    </h2>

                    <div className="space-y-3.5 font-body text-xs text-daisy-600 dark:text-daisy-450">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-daisy-900 dark:text-cream">₹{order.subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Charge</span>
                        <span className="text-daisy-900 dark:text-cream">
                          {order.shippingFee === 0 ? <span className="text-green-600 dark:text-green-400 font-medium">FREE</span> : `₹${order.shippingFee.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount Applied</span>
                          <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Payment Method</span>
                        <span className="capitalize text-daisy-900 dark:text-cream font-medium">
                          {order.paymentMethod === 'whatsapp' ? 'WhatsApp checkout' : order.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status</span>
                        <span className={`capitalize font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {order.paymentStatus === 'paid' ? 'Verified' : 'Pending Manual Verification'}
                        </span>
                      </div>

                      <div className="flex justify-between font-heading text-xl text-daisy-900 dark:text-cream pt-4 border-t border-nude-200 dark:border-neutral-800">
                        <span>Grand Total</span>
                        <span className="font-semibold">₹{order.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right side: Customer & Address Details (Col-span 1) */}
                <div className="space-y-6">
                  
                  {/* Shipping Address Card */}
                  <div className="bg-white dark:bg-neutral-900 border border-nude-200/60 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <h2 className="font-heading text-xl text-daisy-900 dark:text-cream border-b border-nude-100 dark:border-neutral-850 pb-3 flex items-center gap-2">
                      <MapPin size={18} className="text-daisy-700" />
                      Delivery Address
                    </h2>

                    <div className="font-body text-xs text-daisy-700 dark:text-daisy-400 space-y-2.5 leading-relaxed">
                      <p className="font-semibold text-daisy-900 dark:text-cream text-sm">{order.shippingAddress.fullName}</p>
                      
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-daisy-400" />
                        <span>{order.shippingAddress.phone}</span>
                      </div>

                      {order.shippingAddress.email && order.shippingAddress.email !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-daisy-400" />
                          <span className="truncate">{order.shippingAddress.email}</span>
                        </div>
                      )}

                      <div className="border-t border-nude-100 dark:border-neutral-850 pt-3 space-y-1">
                        <p>{order.shippingAddress.addressLine1}</p>
                        {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                        {order.shippingAddress.landmark && <p className="text-daisy-500 italic">Landmark: {order.shippingAddress.landmark}</p>}
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                        <p className="font-semibold text-daisy-900 dark:text-cream">{order.shippingAddress.pincode}</p>
                        <p className="text-[10px] uppercase tracking-wider text-daisy-400 mt-1">{order.shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manual UPI QR Guide Card (Only show if payment status is pending) */}
                  {order.paymentStatus !== 'paid' && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl p-6 space-y-3 shadow-sm">
                      <h3 className="font-heading text-lg text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <BadgeAlert size={18} />
                        Next Steps
                      </h3>
                      <p className="font-body text-xs text-amber-700 dark:text-amber-450 leading-relaxed">
                        To complete your order, please complete your UPI/QR payment as discussed. Once you share the receipt on WhatsApp, our admin will verify it and update your status here in real-time.
                      </p>
                      <a 
                        href={`https://wa.me/919876543210?text=${encodeURIComponent(`🌸 Hi DAISY! I have placed order ${order.orderNumber} and would like to verify payment.`)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white py-2.5 rounded-xl font-body text-xs font-semibold shadow-sm transition-all"
                      >
                        Send Payment Receipt
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="space-y-3.5">
                    <button 
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2 border border-nude-300 dark:border-neutral-800 py-3 rounded-xl font-body text-xs font-semibold text-daisy-700 hover:text-daisy-900 dark:text-daisy-400 dark:hover:text-cream hover:bg-nude-50/50 dark:hover:bg-neutral-850 transition-all"
                    >
                      <Printer size={14} />
                      Print Receipt
                    </button>
                    <Link 
                      href="/collections"
                      className="w-full btn-outline py-3.5 rounded-xl font-body text-xs font-semibold text-center block"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </div>
      </main>

      <Footer />
      <MobileNav />
    </>
  );
}
