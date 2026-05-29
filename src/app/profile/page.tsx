// src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, Package, Heart, MapPin, LogOut, Edit2, Save, Plus, Trash2, Star, X, Loader2, Clock, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';

type UserProfile = { id: string; email: string; full_name: string | null; phone: string | null; role?: string | null };
type Order = { id: string; order_number: string; status: string; total: number; created_at: string };
type TempOrder = { id: string; temp_order_number: string; status: string; total: number; items: any[]; created_at: string };
type WishlistItem = { id: string; product_id: string; products: { name: string; price: number; sale_price: number | null; images: string[]; slug: string } };
type Address = { id: string; full_name: string; phone: string; address_line1: string; address_line2: string | null; city: string; state: string; pincode: string; country: string; is_default: boolean };

const TABS = [
  { id: 'profile', label: 'My Profile', Icon: User },
  { id: 'orders', label: 'My Orders', Icon: Package },
  { id: 'notifications', label: 'Notifications', Icon: Bell },
  { id: 'wishlist', label: 'Wishlist', Icon: Heart },
  { id: 'addresses', label: 'Addresses', Icon: MapPin },
];

const STATUS_COLORS: Record<string, string> = {
  pending:'bg-yellow-100 text-yellow-700', confirmed:'bg-blue-100 text-blue-700',
  processing:'bg-purple-100 text-purple-700', packed:'bg-pink-100 text-pink-700',
  shipped:'bg-indigo-100 text-indigo-700', out_for_delivery:'bg-orange-100 text-orange-700',
  delivered:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700',
  refunded:'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string,string> = {
  pending:'Pending', confirmed:'Confirmed', processing:'Processing',
  packed:'Packed', shipped:'Shipped', out_for_delivery:'Out for Delivery',
  delivered:'Delivered', cancelled:'Cancelled', refunded:'Refunded',
};

type Notification = {
  id: string; title: string; message: string; type: string;
  channel: string; is_read: boolean; metadata: any; created_at: string;
};

const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

type AddrForm = { full_name:string; phone:string; address_line1:string; address_line2:string; city:string; state:string; pincode:string; country:string };
const EMPTY_ADDR: AddrForm = { full_name:'', phone:'', address_line1:'', address_line2:'', city:'', state:'Tamil Nadu', pincode:'', country:'India' };

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tempOrders, setTempOrders] = useState<TempOrder[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState<AddrForm>(EMPTY_ADDR);
  const [addrSaving, setAddrSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const [{ data: prof }, { data: orderData }, { data: tempOrderData }, { data: wishData }, { data: addrData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('orders').select('id,order_number,status,total,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('temp_orders').select('id,temp_order_number,status,total,items,created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wishlists').select('id, product_id, products(name, price, sale_price, images, slug)').eq('user_id', user.id),
        supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }),
      ]);

      if (prof) { 
        setProfile(prof as UserProfile); 
        setEditForm({ full_name: prof.full_name || '', phone: prof.phone || '' }); 
      } else {
        const fallback: UserProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
        };
        setProfile(fallback);
        setEditForm({ full_name: fallback.full_name || '', phone: fallback.phone || '' });
      }
      setOrders((orderData as Order[]) || []);
      setTempOrders((tempOrderData as TempOrder[]) || []);
      setWishlist((wishData as any) || []);
      setAddresses((addrData as Address[]) || []);
      setLoading(false);

      // Fetch notifications
      fetchNotifications();
    }
    load();
  }, [router]);

  const fetchNotifications = async () => {
    setNotifLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch('/api/notifications/list', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
    setNotifLoading(false);
  };

  const markAllRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(n => n.map(item => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('users').update({ full_name: editForm.full_name, phone: editForm.phone, updated_at: new Date().toISOString() }).eq('id', profile.id);
    setProfile(p => p ? { ...p, ...editForm } : null);
    setEditing(false); setSaving(false);
    toast.success('Profile updated!');
  };

  const removeWishlist = async (id: string) => {
    await supabase.from('wishlists').delete().eq('id', id);
    setWishlist(w => w.filter(i => i.id !== id));
    toast.success('Removed from wishlist');
  };

  const saveAddress = async () => {
    if (!profile) {
      toast.error('Session not found. Please log in again.');
      return;
    }
    const required = ['full_name','phone','address_line1','city','state','pincode'] as (keyof AddrForm)[];
    for (const k of required) { if (!addrForm[k]) { toast.error(`Please fill in ${k.replace(/_/g,' ')}`); return; } }
    if (addrForm.phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return; }
    if (addrForm.pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return; }
    setAddrSaving(true);
    const isFirst = addresses.length === 0;
    const { data, error } = await supabase.from('addresses').insert([{
      user_id: profile.id, ...addrForm,
      address_line2: addrForm.address_line2 || null,
      is_default: isFirst,
    }]).select().single();
    
    if (error) {
      console.error('Error saving address:', error);
      toast.error(error.message || 'Failed to save address');
    } else if (data) {
      setAddresses(a => [...a, data as Address]);
      setAddrForm(EMPTY_ADDR); setShowAddrForm(false);
      toast.success('Address saved!');
    }
    setAddrSaving(false);
  };

  const setDefault = async (id: string) => {
    if (!profile) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', profile.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    setAddresses(a => a.map(addr => ({ ...addr, is_default: addr.id === id })));
    toast.success('Default address updated');
  };

  const deleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(a => a.filter(addr => addr.id !== id));
    toast.success('Address removed');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    toast.success('Signed out successfully');
  };

  return (
    <>
      <AnnouncementBar /><Navbar /><SearchOverlay /><CartSidebar />
      <main className="pb-20 md:pb-0 min-h-screen bg-cream">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="md:col-span-1">
              <div className="bg-white border border-nude-200 p-6 mb-4">
                <div className="w-16 h-16 bg-daisy-100 rounded-full flex items-center justify-center mb-4">
                  <span className="font-heading text-2xl text-daisy-700">
                    {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h2 className="font-heading text-xl text-daisy-900 font-light">{profile?.full_name || 'Welcome!'}</h2>
                <p className="font-body text-xs text-daisy-400 mt-1 truncate">{profile?.email}</p>
                {(profile?.role === 'admin' || profile?.role === 'seller') && (
                  <Link href="/admin" className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 border border-amber-600/30 bg-amber-50/50 text-[10px] tracking-[0.18em] font-heading font-semibold uppercase text-amber-800 hover:bg-amber-100/80 transition-all rounded w-full">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse" />
                    Admin Panel
                  </Link>
                )}
              </div>
              <nav className="bg-white border border-nude-200 overflow-hidden">
                {TABS.map(({ id, label, Icon }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 font-body text-sm border-b border-nude-100 last:border-0 transition-colors ${activeTab === id ? 'bg-daisy-900 text-cream' : 'text-daisy-700 hover:bg-nude-50'}`}>
                    <Icon size={16} />{label}
                    {id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                ))}
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-4 font-body text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={16} /> Sign Out
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div className="md:col-span-3">
              {loading ? (
                <div className="bg-white border border-nude-200 p-8 flex justify-center">
                  <Loader2 size={24} className="text-daisy-400 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-nude-200 p-8">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="font-heading text-2xl text-daisy-900">My Profile</h2>
                        {!editing ? (
                          <button onClick={() => setEditing(true)} className="flex items-center gap-2 font-body text-sm text-daisy-600 hover:text-daisy-900 transition-colors">
                            <Edit2 size={14} /> Edit
                          </button>
                        ) : (
                          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 btn-primary text-xs py-2 px-4">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                          </button>
                        )}
                      </div>
                      <div className="space-y-6">
                        {[{ label:'Full Name', key:'full_name', type:'text', editable:true }, { label:'Email', key:'email', type:'email', editable:false }, { label:'Phone', key:'phone', type:'tel', editable:true }].map(({ label, key, type, editable }) => (
                          <div key={key} className="border-b border-nude-100 pb-5">
                            <label className="font-body text-[10px] tracking-widest uppercase text-daisy-400 block mb-2">{label}</label>
                            {editing && editable ? (
                              <input type={type} value={(editForm as any)[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                className="font-body text-sm text-daisy-900 bg-transparent border-b border-daisy-300 outline-none w-full py-1 focus:border-daisy-600 transition-colors" />
                            ) : (
                              <p className="font-body text-sm text-daisy-900">{(profile as any)?.[key] || (editForm as any)[key] || <span className="text-daisy-300 italic">Not set</span>}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      {/* Pending Verification Orders */}
                      {tempOrders.filter(t => t.status === 'pending_verification').length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200">
                          <div className="p-5 border-b border-yellow-200 flex items-center gap-2">
                            <Clock size={16} className="text-yellow-600" />
                            <h3 className="font-heading text-lg text-yellow-800">Waiting for Payment Verification</h3>
                          </div>
                          <div className="divide-y divide-yellow-100">
                            {tempOrders.filter(t => t.status === 'pending_verification').map(temp => (
                              <div key={temp.id} className="p-5 flex items-center justify-between gap-4">
                                <div>
                                  <p className="font-body text-sm font-medium text-daisy-900">#{temp.temp_order_number}</p>
                                  <p className="font-body text-xs text-daisy-400 mt-0.5">
                                    {new Date(temp.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                                  </p>
                                </div>
                                <span className="font-body text-xs px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                  <Clock size={10} /> Pending Verification
                                </span>
                                <p className="font-heading text-lg text-daisy-900">₹{temp.total?.toLocaleString('en-IN')}</p>
                              </div>
                            ))}
                          </div>
                          <div className="px-5 py-3 bg-yellow-100/50 border-t border-yellow-200">
                            <p className="font-body text-[11px] text-yellow-700">💡 Please complete your UPI/QR payment and send the screenshot to our WhatsApp. Your order will be confirmed once the admin verifies the payment.</p>
                          </div>
                        </div>
                      )}

                      {/* Confirmed Orders */}
                      <div className="bg-white border border-nude-200">
                        <div className="p-6 border-b border-nude-200 flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-600" />
                          <h2 className="font-heading text-2xl text-daisy-900">My Orders</h2>
                        </div>
                        {orders.length === 0 ? (
                          <div className="p-12 text-center">
                            <Package size={40} className="text-daisy-200 mx-auto mb-3" />
                            <p className="font-heading text-xl text-daisy-300 mb-1">No confirmed orders yet</p>
                            <p className="font-body text-sm text-daisy-400 mb-6">Orders will appear here after payment verification</p>
                            <Link href="/collections" className="btn-primary">Shop Now</Link>
                          </div>
                        ) : (
                          <div className="divide-y divide-nude-100">
                            {orders.map(order => (
                              <Link key={order.id} href={`/track-order?order=${order.order_number}`}
                                className="p-5 flex items-center justify-between gap-4 hover:bg-nude-50 transition-colors block">
                                <div>
                                  <p className="font-body text-sm font-medium text-daisy-900">#{order.order_number}</p>
                                  <p className="font-body text-xs text-daisy-400 mt-0.5">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                                  </p>
                                </div>
                                <span className={`font-body text-xs px-3 py-1 ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{STATUS_LABELS[order.status] || order.status}</span>
                                <p className="font-heading text-lg text-daisy-900">₹{order.total?.toLocaleString('en-IN')}</p>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="bg-white border border-nude-200 p-6 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h2 className="font-heading text-2xl text-daisy-900">Notifications</h2>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} new</span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="font-body text-xs text-daisy-600 hover:text-daisy-900 underline transition-colors">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      {notifLoading ? (
                        <div className="bg-white border border-nude-200 p-8 flex justify-center">
                          <Loader2 size={24} className="text-daisy-400 animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="bg-white border border-nude-200 p-12 text-center">
                          <Bell size={40} className="text-daisy-200 mx-auto mb-3" />
                          <p className="font-heading text-xl text-daisy-300 mb-1">No notifications yet</p>
                          <p className="font-body text-sm text-daisy-400">You'll see order updates, shipping alerts, and account notifications here</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notifications.map(notif => {
                            const isOrder = notif.type === 'order';
                            const isAccount = notif.type === 'account';
                            const timeAgo = (() => {
                              const diff = Date.now() - new Date(notif.created_at).getTime();
                              const mins = Math.floor(diff / 60000);
                              if (mins < 1) return 'Just now';
                              if (mins < 60) return `${mins}m ago`;
                              const hrs = Math.floor(mins / 60);
                              if (hrs < 24) return `${hrs}h ago`;
                              const days = Math.floor(hrs / 24);
                              return `${days}d ago`;
                            })();
                            return (
                              <div key={notif.id}
                                className={`bg-white border p-5 transition-colors ${
                                  notif.is_read ? 'border-nude-200' : 'border-daisy-300 bg-daisy-50/30'
                                }`}>
                                <div className="flex items-start gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                    isOrder ? 'bg-blue-100 text-blue-600' : isAccount ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isOrder ? <Package size={16} /> : isAccount ? <User size={16} /> : <Bell size={16} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={`font-body text-sm ${notif.is_read ? 'text-daisy-700' : 'font-medium text-daisy-900'}`}>{notif.title}</p>
                                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                                    </div>
                                    <p className="font-body text-xs text-daisy-500 mt-1 line-clamp-2">{notif.message}</p>
                                    {notif.metadata?.tracking_number && (
                                      <p className="font-body text-xs text-indigo-600 mt-1">📋 Tracking: {notif.metadata.tracking_number}</p>
                                    )}
                                    {notif.metadata?.tracking_url && (
                                      <a href={notif.metadata.tracking_url} target="_blank" rel="noopener noreferrer"
                                        className="font-body text-xs text-blue-600 underline mt-0.5 inline-block">Track your order →</a>
                                    )}
                                    <p className="font-body text-[10px] text-daisy-300 mt-2">{timeAgo}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Wishlist Tab */}
                  {activeTab === 'wishlist' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="bg-white border border-nude-200 p-6 mb-4 flex items-center justify-between">
                        <h2 className="font-heading text-2xl text-daisy-900">Wishlist</h2>
                        <span className="font-body text-sm text-daisy-400">{wishlist.length} items</span>
                      </div>
                      {wishlist.length === 0 ? (
                        <div className="bg-white border border-nude-200 p-12 text-center">
                          <Heart size={40} className="text-daisy-200 mx-auto mb-3" />
                          <p className="font-heading text-xl text-daisy-300 mb-1">Your wishlist is empty</p>
                          <p className="font-body text-sm text-daisy-400 mb-6">Save items you love while browsing</p>
                          <Link href="/collections" className="btn-primary">Discover Collections</Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {wishlist.map(item => {
                            const p = item.products;
                            const img = p?.images?.[0];
                            const price = p?.sale_price || p?.price;
                            return (
                              <div key={item.id} className="bg-white border border-nude-200 group relative overflow-hidden">
                                <button onClick={() => removeWishlist(item.id)}
                                  className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-daisy-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                  <X size={13} />
                                </button>
                                <Link href={`/product/${p?.slug}`}>
                                  <div className="aspect-square relative overflow-hidden bg-nude-50">
                                    {img ? (
                                      <Image src={img} alt={p?.name || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Heart size={24} className="text-nude-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <p className="font-body text-sm text-daisy-900 truncate">{p?.name}</p>
                                    <p className="font-heading text-base text-daisy-700 mt-1">₹{price?.toLocaleString('en-IN')}</p>
                                  </div>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Addresses Tab */}
                  {activeTab === 'addresses' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="bg-white border border-nude-200 p-6 mb-4 flex items-center justify-between">
                        <h2 className="font-heading text-2xl text-daisy-900">Saved Addresses</h2>
                        <button onClick={() => { setShowAddrForm(true); setAddrForm(EMPTY_ADDR); }}
                          className="flex items-center gap-2 btn-outline text-xs py-2 px-4">
                          <Plus size={13} /> Add New
                        </button>
                      </div>

                      {/* Add Address Form */}
                      {showAddrForm && (
                        <div className="bg-white border border-nude-200 p-6 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-heading text-lg text-daisy-800">New Address</h3>
                            <button onClick={() => setShowAddrForm(false)} className="text-daisy-400 hover:text-daisy-900"><X size={16}/></button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {[{k:'full_name',l:'Full Name',c:2,t:'text',p:'Full name'},{k:'phone',l:'Phone',c:1,t:'tel',p:'10-digit number'},{k:'pincode',l:'Pincode',c:1,t:'text',p:'6-digit'},{k:'address_line1',l:'Address Line 1',c:2,t:'text',p:'House no, street'},{k:'address_line2',l:'Address Line 2 (Optional)',c:2,t:'text',p:'Landmark, area'},{k:'city',l:'City',c:1,t:'text',p:'City'}].map(({k,l,c,t,p})=>(
                              <div key={k} className={c===2?'col-span-2':''}>
                                <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">{l}</label>
                                <input type={t} placeholder={p} value={(addrForm as any)[k]} onChange={e=>setAddrForm(f=>({...f,[k]:e.target.value}))} className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"/>
                              </div>
                            ))}
                            <div>
                              <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">State</label>
                              <select value={addrForm.state} onChange={e=>setAddrForm(f=>({...f,state:e.target.value}))} className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white">
                                {STATES.map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-6">
                            <button onClick={saveAddress} disabled={addrSaving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                              {addrSaving?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>} Save Address
                            </button>
                            <button onClick={()=>setShowAddrForm(false)} className="btn-outline">Cancel</button>
                          </div>
                        </div>
                      )}

                      {addresses.length === 0 && !showAddrForm ? (
                        <div className="bg-white border border-nude-200 p-12 text-center">
                          <MapPin size={40} className="text-daisy-200 mx-auto mb-3" />
                          <p className="font-heading text-xl text-daisy-300 mb-1">No saved addresses</p>
                          <p className="font-body text-sm text-daisy-400 mb-6">Add an address for faster checkout</p>
                          <button onClick={() => setShowAddrForm(true)} className="btn-primary flex items-center gap-2 mx-auto">
                            <Plus size={14}/> Add Address
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {addresses.map(addr => (
                            <div key={addr.id} className={`bg-white border p-5 ${addr.is_default ? 'border-daisy-400' : 'border-nude-200'}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-body text-sm font-medium text-daisy-900">{addr.full_name}</p>
                                    {addr.is_default && <span className="font-body text-[9px] bg-daisy-100 text-daisy-600 px-2 py-0.5 tracking-widest uppercase">Default</span>}
                                  </div>
                                  <p className="font-body text-xs text-daisy-500">{addr.phone}</p>
                                  <p className="font-body text-xs text-daisy-500 mt-1">
                                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                                  </p>
                                  <p className="font-body text-xs text-daisy-400">{addr.country}</p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  {!addr.is_default && (
                                    <button onClick={() => setDefault(addr.id)} className="font-body text-xs text-daisy-600 hover:text-daisy-900 underline transition-colors">
                                      Set default
                                    </button>
                                  )}
                                  <button onClick={() => deleteAddress(addr.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer /><MobileNav />
    </>
  );
}
