// src/app/checkout/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageCircle, CreditCard, QrCode, ChevronRight, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import CartSidebar from '@/components/cart/CartSidebar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { generateCartWhatsAppURL, openWhatsApp, getShippingSettings } from '@/lib/whatsapp';

type Address = {
  full_name: string; phone: string; address_line1: string;
  address_line2: string; city: string; state: string; pincode: string; country: string;
};
type SavedAddress = Address & { id: string; is_default: boolean };

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Pay Online', desc: 'UPI, Cards, Net Banking', Icon: CreditCard },
  { id: 'upi_manual', label: 'Manual UPI / QR', desc: 'Pay via QR code or UPI ID', Icon: QrCode },
  { id: 'whatsapp', label: 'WhatsApp Order', desc: 'Order via WhatsApp & pay manually', Icon: MessageCircle },
];

const STATES = ['Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const EMPTY: Address = { full_name:'', phone:'', address_line1:'', address_line2:'', city:'', state:'Tamil Nadu', pincode:'', country:'India' };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useStore();
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState<Address>(EMPTY);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [shippingFeeSetting, setShippingFeeSetting] = useState(99);
  const [freeThresholdSetting, setFreeThresholdSetting] = useState(1000);
  const [shippingEnabled, setShippingEnabled] = useState(true);

  const subtotal = totalPrice();
  const shipping = !shippingEnabled ? 0 : (shippingFeeSetting === 0 || subtotal >= freeThresholdSetting ? 0 : shippingFeeSetting);
  const total = subtotal - discount + shipping;
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress(a => ({ ...a, [k]: e.target.value }));

  useEffect(() => {
    getShippingSettings().then(settings => {
      setShippingFeeSetting(settings.shippingFee);
      setFreeThresholdSetting(settings.freeShippingThreshold);
      setShippingEnabled(settings.shippingFeeEnabled);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).then(({ data }) => {
        if (data?.length) {
          setSaved(data as SavedAddress[]);
          const def = data.find((a: any) => a.is_default) || data[0];
          setSelectedId(def.id);
          setAddress({ full_name: def.full_name, phone: def.phone, address_line1: def.address_line1, address_line2: def.address_line2 || '', city: def.city, state: def.state, pincode: def.pincode, country: def.country });
          setShowNew(false);
        }
      });
    });
  }, []);

  const pickSaved = (a: SavedAddress) => {
    setSelectedId(a.id); setShowNew(false);
    setAddress({ full_name: a.full_name, phone: a.phone, address_line1: a.address_line1, address_line2: a.address_line2 || '', city: a.city, state: a.state, pincode: a.pincode, country: a.country });
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    const { data } = await supabase.from('coupons').select('*').eq('code', coupon.toUpperCase()).eq('is_active', true).single();
    if (!data) { toast.error('Invalid or expired coupon'); return; }
    if (data.min_order_amount && subtotal < data.min_order_amount) { toast.error(`Min order ₹${data.min_order_amount}`); return; }
    const disc = data.type === 'percentage' ? (subtotal * data.value) / 100 : data.value;
    setDiscount(disc);
    toast.success(`Saved ₹${disc.toLocaleString('en-IN')}!`);
  };

  const validate = () => {
    for (const k of ['full_name','phone','address_line1','city','state','pincode'] as (keyof Address)[]) {
      if (!address[k]) { toast.error(`Please fill in ${k.replace(/_/g,' ')}`); return false; }
    }
    if (address.phone.length !== 10) { toast.error('Enter valid 10-digit phone'); return false; }
    if (address.pincode.length !== 6) { toast.error('Enter valid 6-digit pincode'); return false; }
    return true;
  };

  const placeOrder = async () => {
    if (!items.length) { toast.error('Cart is empty'); return; }
    if (!validate()) return;
    setPlacing(true);

    if (paymentMethod === 'whatsapp') {
      const { data: { user } } = await supabase.auth.getUser();
      const year = new Date().getFullYear();
      const seq = String(Date.now()).slice(-4);
      const orderId = `DSY-${year}-${seq}`;

      // 1. Insert into confirmed orders table
      const { data: order, error } = await supabase.from('orders').insert([{
        user_id: user?.id || null, 
        order_number: orderId, 
        status: 'pending',
        payment_method: 'whatsapp', 
        payment_status: 'pending',
        subtotal, 
        shipping_fee: shipping, 
        total,
        coupon_code: coupon || null, 
        shipping_address: address,
        notes: 'Checkout Page WhatsApp order'
      }]).select().single();

      if (error || !order) {
        console.error('Error placing WhatsApp order:', error);
        toast.error(error?.message || 'Failed to place order. Please try again.');
        setPlacing(false);
        return;
      }

      // 2. Insert order items
      await supabase.from('order_items').insert(
        items.map(i => ({ 
          order_id: order.id, 
          product_id: i.productId, 
          product_name: i.name, 
          product_image: i.image, 
          variant: i.variant, 
          quantity: i.quantity, 
          price: i.price, 
          total: i.price * i.quantity 
        }))
      );

      // 3. Save to temp_orders as well for Admin Payment Verification panel
      const itemsPayload = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image || null,
        variant: item.variant || null,
        quantity: item.quantity,
        price: item.price,
      }));

      await supabase.from('temp_orders').insert({
        user_id: user?.id || null,
        temp_order_number: orderId,
        status: 'pending_verification',
        subtotal,
        shipping_fee: shipping,
        total,
        shipping_address: {
          fullName: address.full_name,
          phone: address.phone,
          addressLine1: address.address_line1,
          addressLine2: address.address_line2 || null,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        },
        items: itemsPayload,
        confirmed_order_number: orderId
      });

      // 4. Save new address to profile
      if (userId && showNew) {
        await supabase.from('addresses').insert([{ 
          user_id: userId, 
          ...address, 
          address_line2: address.address_line2 || null, 
          is_default: saved.length === 0 
        }]);
      }

      // 5. Generate WhatsApp URL
      const customerDetails = {
        fullName: address.full_name,
        phone: address.phone,
        email: user?.email || 'N/A',
        addressLine1: address.address_line1,
        addressLine2: address.address_line2 || null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || 'India'
      };

      const enrichedItems = items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant || null,
        image: item.image || null
      }));

      const waUrl = generateCartWhatsAppURL(
        enrichedItems,
        {
          subtotal,
          shippingCharge: shipping,
          discount: discount,
          grandTotal: total,
          paymentMethod: 'whatsapp',
          paymentStatus: 'pending'
        },
        customerDetails,
        orderId
      );

      const redirectSuccess = await openWhatsApp(waUrl, false);
      if (redirectSuccess) {
        clearCart();
        toast.success(`Order ${orderId} initiated on WhatsApp! 🌸`);
        router.push(`/orders/${orderId}`);
      } else {
        toast.error("Unable to open WhatsApp. Please install WhatsApp or contact support.");
      }
      setPlacing(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const orderNum = `DAISY${Date.now().toString().slice(-8)}`;
    const { data: order, error } = await supabase.from('orders').insert([{
      user_id: user?.id || null, order_number: orderNum, status: 'pending',
      payment_method: paymentMethod, payment_status: 'pending',
      subtotal, shipping_fee: shipping, total,
      coupon_code: coupon || null, shipping_address: address,
    }]).select().single();

    if (error || !order) {
      console.error('Error placing order:', error);
      toast.error(error?.message || 'Failed to place order. Please try again.');
      setPlacing(false);
      return;
    }

    await supabase.from('order_items').insert(
      items.map(i => ({ order_id: order.id, product_id: i.productId, product_name: i.name, product_image: i.image, variant: i.variant, quantity: i.quantity, price: i.price, total: i.price * i.quantity }))
    );

    // Save new address to profile
    if (userId && showNew) {
      await supabase.from('addresses').insert([{ user_id: userId, ...address, address_line2: address.address_line2 || null, is_default: saved.length === 0 }]);
    }

    if (paymentMethod === 'razorpay') {
      try {
        const rzpRes = await fetch('/api/razorpay/create-order', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, receipt: orderNum }),
        });
        const rzpData = await rzpRes.json();
        if (!rzpRes.ok) throw new Error(rzpData.error || 'Payment init failed');

        const RazorpayClass = (window as any).Razorpay;
        if (!RazorpayClass) throw new Error('Payment library not loaded. Please refresh.');

        new RazorpayClass({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpData.amount, currency: rzpData.currency, order_id: rzpData.orderId,
          name: 'DAISY', description: `Order #${orderNum}`,
          prefill: { name: address.full_name, contact: address.phone },
          theme: { color: '#c4855a' },
          handler: async (response: any) => {
            const vRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, order_id: order.id, user_id: user?.id || null, amount: total }),
            });
            const vData = await vRes.json();
            if (!vRes.ok || !vData.success) { toast.error('Payment verification failed'); return; }
            clearCart();
            toast.success('🌸 Order placed!');
            router.push(`/order-success?order=${orderNum}`);
          },
          modal: { ondismiss: async () => { await supabase.from('orders').delete().eq('id', order.id); setPlacing(false); } },
        }).open();
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
        await supabase.from('orders').delete().eq('id', order.id);
        setPlacing(false);
      }
    } else {
      clearCart();
      toast.success('🌸 Order placed!');
      router.push(`/order-success?order=${orderNum}&method=manual`);
      setPlacing(false);
    }
  };

  if (!items.length) return (
    <><AnnouncementBar /><Navbar /><SearchOverlay /><CartSidebar />
      <main className="min-h-screen flex items-center justify-center bg-cream pb-20 md:pb-0">
        <div className="text-center">
          <p className="font-heading text-3xl text-daisy-300 mb-4">Your cart is empty</p>
          <a href="/collections" className="btn-primary">Shop Now</a>
        </div>
      </main>
      <Footer /><MobileNav /></>
  );

  return (
    <><AnnouncementBar /><Navbar /><SearchOverlay /><CartSidebar />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      <main className="pb-20 md:pb-0 min-h-screen bg-cream">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-16">
          <h1 className="font-heading text-4xl font-light text-daisy-900 mb-10">Checkout</h1>
          <div className="grid md:grid-cols-5 gap-10">
            <div className="md:col-span-3 space-y-6">
              {/* Saved addresses */}
              {saved.length > 0 && (
                <section className="bg-white border border-nude-200 p-6">
                  <h2 className="font-heading text-xl text-daisy-800 mb-4">Saved Addresses</h2>
                  <div className="space-y-3">
                    {saved.map(a => (
                      <label key={a.id} className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${selectedId === a.id && !showNew ? 'border-daisy-700 bg-daisy-50' : 'border-nude-200'}`}>
                        <input type="radio" name="addr" checked={selectedId === a.id && !showNew} onChange={() => pickSaved(a)} className="accent-daisy-700 mt-0.5" />
                        <div>
                          <p className="font-body text-sm font-medium text-daisy-900">{a.full_name} · {a.phone}</p>
                          <p className="font-body text-xs text-daisy-500">{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city}, {a.state} – {a.pincode}</p>
                          {a.is_default && <span className="font-body text-[9px] bg-daisy-100 text-daisy-600 px-2 py-0.5 mt-1 inline-block tracking-widest uppercase">Default</span>}
                        </div>
                      </label>
                    ))}
                    <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-all ${showNew ? 'border-daisy-700 bg-daisy-50' : 'border-nude-200'}`}>
                      <input type="radio" name="addr" checked={showNew} onChange={() => { setShowNew(true); setSelectedId(null); setAddress(EMPTY); }} className="accent-daisy-700" />
                      <span className="flex items-center gap-2 font-body text-sm text-daisy-700"><Plus size={14}/> Add a new address</span>
                    </label>
                  </div>
                </section>
              )}
              {/* Address form */}
              {(showNew || !saved.length) && (
                <section className="bg-white border border-nude-200 p-6">
                  <h2 className="font-heading text-xl text-daisy-800 mb-6">Delivery Address</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[{k:'full_name',l:'Full Name',c:2,t:'text',p:'Your full name'},{k:'phone',l:'Phone',c:1,t:'tel',p:'10-digit number'},{k:'pincode',l:'Pincode',c:1,t:'text',p:'6-digit pincode'},{k:'address_line1',l:'Address Line 1',c:2,t:'text',p:'House no, street'},{k:'address_line2',l:'Address Line 2 (Optional)',c:2,t:'text',p:'Landmark, area'},{k:'city',l:'City',c:1,t:'text',p:'City'}].map(({k,l,c,t,p})=>(
                      <div key={k} className={c===2?'col-span-2':''}>
                        <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">{l}</label>
                        <input type={t} placeholder={p} value={(address as any)[k]} onChange={set(k as keyof Address)} className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 transition-colors"/>
                      </div>
                    ))}
                    <div>
                      <label className="block font-body text-[10px] tracking-widest uppercase text-daisy-500 mb-2">State</label>
                      <select value={address.state} onChange={set('state')} className="w-full border border-nude-200 px-4 py-3 font-body text-sm outline-none focus:border-daisy-400 bg-white">
                        {STATES.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </section>
              )}
              {/* Payment */}
              <section className="bg-white border border-nude-200 p-6">
                <h2 className="font-heading text-xl text-daisy-800 mb-6">Payment Method</h2>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(({id,label,desc,Icon})=>(
                    <label key={id} className={`flex items-center gap-4 p-4 border cursor-pointer transition-all ${paymentMethod===id?'border-daisy-700 bg-daisy-50':'border-nude-200 hover:border-nude-300'}`}>
                      <input type="radio" name="payment" value={id} checked={paymentMethod===id} onChange={()=>setPaymentMethod(id)} className="accent-daisy-700 w-4 h-4"/>
                      <Icon size={20} className={paymentMethod===id?'text-daisy-700':'text-daisy-400'}/>
                      <div><p className="font-body text-sm font-medium text-daisy-900">{label}</p><p className="font-body text-xs text-daisy-400">{desc}</p></div>
                    </label>
                  ))}
                </div>
                {paymentMethod==='upi_manual'&&(
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="mt-4 p-4 bg-amber-50 border border-amber-200">
                    <p className="font-body text-sm text-amber-800 font-medium mb-1">How it works:</p>
                    <ol className="font-body text-xs text-amber-700 space-y-1 list-decimal list-inside">
                      <li>Place your order below</li><li>Admin shares UPI ID / QR via WhatsApp</li>
                      <li>Pay and share screenshot</li><li>Order confirmed after verification</li>
                    </ol>
                  </motion.div>
                )}
              </section>
            </div>
            {/* Order summary */}
            <div className="md:col-span-2">
              <div className="bg-white border border-nude-200 p-6 sticky top-24">
                <h2 className="font-heading text-xl text-daisy-800 mb-6">Order Summary</h2>
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {items.map(item=>(
                    <div key={item.id} className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-body text-sm text-daisy-900 truncate">{item.name}</p>
                        {item.variant&&<p className="font-body text-xs text-daisy-400">{item.variant}</p>}
                        <p className="font-body text-xs text-daisy-400">×{item.quantity}</p>
                      </div>
                      <span className="font-body text-sm text-daisy-900 shrink-0">₹{(item.price*item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-6">
                  <input type="text" placeholder="Coupon code" value={coupon} onChange={e=>setCoupon(e.target.value.toUpperCase())} className="flex-1 border border-nude-200 px-3 py-2.5 font-body text-sm outline-none focus:border-daisy-400 uppercase"/>
                  <button onClick={applyCoupon} className="btn-outline text-xs py-2.5 px-4">Apply</button>
                </div>
                <div className="space-y-3 border-t border-nude-200 pt-4 mb-6">
                  <div className="flex justify-between font-body text-sm text-daisy-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
                  {discount>0&&<div className="flex justify-between font-body text-sm text-green-600"><span>Discount</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
                  {shippingEnabled&&<div className="flex justify-between font-body text-sm text-daisy-600"><span>Shipping</span><span>{shipping===0?<span className="text-green-600">FREE</span>:`₹${shipping}`}</span></div>}
                  <div className="flex justify-between font-heading text-xl text-daisy-900 pt-3 border-t border-nude-200"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
                </div>
                <button onClick={placeOrder} disabled={placing} className={`w-full flex items-center justify-center gap-2 py-4 font-body text-sm tracking-widest uppercase font-medium transition-all disabled:opacity-60 ${paymentMethod==='whatsapp'?'btn-whatsapp':'btn-primary'}`}>
                  {placing?<Loader2 size={16} className="animate-spin"/>:paymentMethod==='whatsapp'?<><MessageCircle size={16}/>Order via WhatsApp</>:<><ChevronRight size={16}/>Place Order</>}
                </button>
                <p className="font-body text-xs text-daisy-400 text-center mt-4">🔒 Your data is secure & encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer /><MobileNav /></>
  );
}
