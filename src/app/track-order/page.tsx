// src/app/track-order/page.tsx
'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, XCircle, AlertTriangle, MessageSquare, Bell, Calendar } from 'lucide-react';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';

const STATUS_STEPS = ['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out For Delivery',
  delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded'
};
const STATUS_ICONS: Record<string, any> = {
  pending: Clock, confirmed: CheckCircle, processing: Clock, packed: Package,
  shipped: Truck, out_for_delivery: Truck, delivered: CheckCircle, cancelled: XCircle,
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [isTemp, setIsTemp] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) { setError('Please enter both fields'); return; }
    setLoading(true); setError(''); setOrder(null); setIsTemp(false); setNotifications([]);
    
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber.trim().toUpperCase(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Order not found');
      } else {
        setOrder(data.order);
        setIsTemp(!!data.isTemp);
        setNotifications(data.notifications || []);
      }
    } catch (err: any) {
      setError('Connection error. Please try again.');
    }
    setLoading(false);
  };

  const stepIdx = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const addr = order?.shipping_address;

  return (
    <>
      <AnnouncementBar/><Navbar/><SearchOverlay/><CartSidebar/>
      <main className="min-h-screen bg-cream pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-10">
            <h1 className="font-heading text-4xl md:text-5xl text-daisy-900 font-light mb-3">Track Your Order</h1>
            <p className="font-body text-daisy-500">Enter your order ID and the mobile number or Gmail ID used at checkout</p>
          </div>

          <form onSubmit={track} className="bg-white border border-nude-200 p-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Order Number / ID</label>
                <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. DSY-2026-1038"
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors uppercase"/>
              </div>
              <div>
                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">Phone Number or Email Address (Gmail ID)</label>
                <input type="text" value={contact} onChange={e => setContact(e.target.value)}
                  placeholder="10-digit mobile number or Gmail ID used at checkout"
                  className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"/>
              </div>
              {error && <p className="font-body text-sm text-red-500 bg-red-50 p-3">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-4 disabled:opacity-60">
                {loading ? <span className="spinner"/> : <Search size={16}/>}
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </div>
          </form>

          {order && (
            <div className="space-y-6">
              
              {/* 💬 Official Notification & Message Box */}
              <div className="bg-white border border-nude-200 rounded-none overflow-hidden">
                <div className="bg-daisy-900 text-cream px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <h2 className="font-heading text-lg tracking-wide">Official Store Alerts & SMS Box</h2>
                  </div>
                  <MessageSquare size={16} className="opacity-80" />
                </div>
                
                <div className="p-5 max-h-[350px] overflow-y-auto bg-stone-50 space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell size={28} className="text-daisy-300 mx-auto mb-2" />
                      <p className="font-body text-xs text-daisy-400">Order successfully created. Wait for updates from our team!</p>
                    </div>
                  ) : (
                    notifications.map((n: any, idx: number) => {
                      const msgText = n.metadata?.whatsappMessage || n.message;
                      // Clean up formatting for visual browser inbox rendering
                      const cleanMsg = msgText
                        .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Make *text* bold
                        .replace(/\n/g, '<br/>'); // Preserve line breaks

                      return (
                        <div key={n.id || idx} className="flex gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-daisy-100 text-daisy-700 flex items-center justify-center shrink-0">
                            <span className="font-heading text-xs font-semibold">D</span>
                          </div>
                          <div className="bg-white border border-nude-200 p-4 shadow-sm relative">
                            <p className="font-heading text-[10px] tracking-widest uppercase text-daisy-400 mb-1.5 flex items-center gap-1">
                              <span className="bg-daisy-100 px-1.5 py-0.5 rounded text-[8px]">{n.type} Alert</span>
                              <span>·</span>
                              <span>{new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </p>
                            <p className="font-body text-xs text-daisy-800 leading-relaxed" 
                               dangerouslySetInnerHTML={{ __html: cleanMsg }} />
                            
                            {n.metadata?.tracking_number && (
                              <div className="mt-3 pt-3 border-t border-nude-100 flex items-center justify-between">
                                <span className="font-body text-[10px] text-indigo-700 bg-indigo-50 px-2 py-1 uppercase font-semibold">
                                  {n.metadata?.courier_name || 'Courier'}: {n.metadata.tracking_number}
                                </span>
                                {n.metadata?.tracking_url && (
                                  <a href={n.metadata.tracking_url} target="_blank" rel="noopener noreferrer"
                                     className="font-body text-[10px] text-blue-600 underline font-semibold">
                                    Track Live →
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-5 py-3 bg-cream/30 border-t border-nude-100 text-center font-body text-[10px] text-daisy-400">
                  🛡️ This message box contains official automated dispatch alerts sent to you.
                </div>
              </div>

              {/* Status Display */}
              {!isTemp ? (
                <>
                  {order.status !== 'cancelled' && (
                    <div className="bg-white border border-nude-200 p-6">
                      <h2 className="font-heading text-xl text-daisy-800 mb-6">Order Status</h2>
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-nude-200"/>
                        <div className="space-y-6">
                          {STATUS_STEPS.map((step, i) => {
                            const Icon = STATUS_ICONS[step] || Package;
                            const done = i <= stepIdx;
                            const current = i === stepIdx;
                            return (
                              <div key={step} className={`flex items-center gap-4 relative ${done ? '' : 'opacity-40'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${current ? 'bg-daisy-700 text-cream' : done ? 'bg-green-100 text-green-700' : 'bg-nude-100 text-daisy-300'}`}>
                                  <Icon size={15}/>
                                </div>
                                <div>
                                  <p className={`font-body text-sm font-medium ${current ? 'text-daisy-900' : 'text-daisy-600'}`}>
                                    {STATUS_LABELS[step] || step}
                                  </p>
                                  {current && <p className="font-body text-xs text-daisy-400">Current status</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="bg-red-50 border border-red-200 p-5 flex items-center gap-3">
                      <XCircle size={20} className="text-red-500 flex-shrink-0"/>
                      <p className="font-body text-sm text-red-700">This order has been cancelled.</p>
                    </div>
                  )}

                  {order.status === 'refunded' && (
                    <div className="bg-gray-50 border border-gray-200 p-5 flex items-center gap-3">
                      <AlertTriangle size={20} className="text-gray-500 flex-shrink-0"/>
                      <p className="font-body text-sm text-gray-700">This order has been fully refunded.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-nude-200 p-6">
                  <h2 className="font-heading text-xl text-daisy-800 mb-4">Payment Verification</h2>
                  
                  {order.status === 'pending_verification' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-5 text-center">
                      <Clock className="text-yellow-600 mx-auto mb-3 animate-pulse" size={32} />
                      <h3 className="font-heading text-lg text-yellow-800 mb-1">Waiting for Payment Verification</h3>
                      <p className="font-body text-xs text-yellow-750 leading-relaxed max-w-md mx-auto">
                        We have received your WhatsApp enquiry! Please make sure you have sent the UPI/QR payment screenshot to the Admin. Once verified, your order will be confirmed.
                      </p>
                    </div>
                  )}

                  {order.status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 p-5 text-center">
                      <XCircle className="text-red-500 mx-auto mb-3" size={32} />
                      <h3 className="font-heading text-lg text-red-800 mb-1">Verification Rejected</h3>
                      <p className="font-body text-xs text-red-700 leading-relaxed max-w-md mx-auto">
                        This payment verification request was rejected. Please contact the administrator or place a new enquiry on WhatsApp.
                      </p>
                    </div>
                  )}

                  {order.status === 'fraud' && (
                    <div className="bg-rose-50 border border-rose-200 p-5 text-center">
                      <AlertTriangle className="text-rose-600 mx-auto mb-3" size={32} />
                      <h3 className="font-heading text-lg text-rose-800 mb-1">Flagged as Fraudulent</h3>
                      <p className="font-body text-xs text-rose-700 leading-relaxed max-w-md mx-auto">
                        This transaction has been flagged as suspicious by our administrator.
                      </p>
                    </div>
                  )}

                  {order.status === 'approved' && (
                    <div className="bg-green-50 border border-green-200 p-5 text-center">
                      <CheckCircle className="text-green-600 mx-auto mb-3" size={32} />
                      <h3 className="font-heading text-lg text-green-800 mb-1">Payment Verified & Confirmed!</h3>
                      <p className="font-body text-xs text-green-700 leading-relaxed max-w-md mx-auto mb-3">
                        Your payment has been successfully verified.
                      </p>
                      {order.confirmed_order_number && (
                        <div className="inline-block bg-green-100 border border-green-200 px-4 py-2 text-xs font-semibold text-green-800 font-body">
                          Confirmed Order ID: #{order.confirmed_order_number}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Courier Tracking */}
              {!isTemp && order.tracking_number && (
                <div className="bg-white border border-nude-200 p-5">
                  <p className="font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-1">Tracking Information</p>
                  <p className="font-body text-sm font-medium text-daisy-900">{order.tracking_number}</p>
                  {order.tracking_url && (
                    <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
                       className="font-body text-xs text-blue-600 underline mt-1.5 inline-block">
                      Click here to track your delivery partner live →
                    </a>
                  )}
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-white border border-nude-200 p-5">
                <h2 className="font-heading text-lg text-daisy-800 mb-4">Order Summary</h2>
                <div className="space-y-3 mb-4">
                  {((order.order_items || order.items) || []).map((item: any, idx: number) => {
                    const price = item.price;
                    const quantity = item.quantity;
                    const total = item.total || (price * quantity);
                    return (
                      <div key={item.id || idx} className="flex justify-between font-body text-sm">
                        <span className="text-daisy-700">{item.product_name || item.name} × {quantity}</span>
                        <span className="text-daisy-900">₹{total?.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-nude-200 pt-3 flex justify-between font-heading text-lg text-daisy-900">
                  <span>Total</span><span>₹{order.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Address */}
              {addr && (
                <div className="bg-white border border-nude-200 p-5">
                  <h2 className="font-heading text-lg text-daisy-800 mb-3">Shipping Address</h2>
                  <div className="font-body text-sm text-daisy-700 space-y-0.5">
                    <p className="font-medium">{addr.full_name || addr.fullName}</p>
                    <p>{addr.phone}</p>
                    <p>{addr.address_line1 || addr.addressLine1}</p>
                    {(addr.address_line2 || addr.addressLine2) && <p>{addr.address_line2 || addr.addressLine2}</p>}
                    <p>{addr.city}, {addr.state} – {addr.pincode}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer/><MobileNav/>
    </>
  );
}
