// src/components/cart/WhatsAppCheckoutModal.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, MessageCircle, Mail, Phone, ShieldCheck, MapPin, Plus, Loader2, BookOpen } from 'lucide-react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { generateCartWhatsAppURL, openWhatsApp, getActiveWhatsAppNumber, getShippingSettings } from '@/lib/whatsapp';
import toast from 'react-hot-toast';

// Supported country codes for the premium selector
const COUNTRY_CODES = [
  { code: '+91', name: '🇮🇳 India (+91)' },
  { code: '+1', name: '🇺🇸 US / Canada (+1)' },
  { code: '+44', name: '🇬🇧 United Kingdom (+44)' },
  { code: '+971', name: '🇦🇪 UAE (+971)' },
  { code: '+966', name: '🇸🇦 Saudi Arabia (+966)' },
  { code: '+65', name: '🇸🇬 Singapore (+65)' },
  { code: '+61', name: '🇦🇺 Australia (+61)' },
  { code: '+49', name: '🇩🇪 Germany (+49)' },
  { code: '+33', name: '🇫🇷 France (+33)' },
];

// Helper SHA-256 function for standalone custom OTP verification
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function WhatsAppCheckoutModal() {
  const router = useRouter();
  const {
    whatsAppModalOpen,
    whatsAppOrderItems,
    whatsAppTotal,
    setWhatsAppModalOpen,
    clearCart
  } = useStore();

  const [step, setStep] = useState<'auth' | 'address' | 'summary'>('auth');
  const [user, setUser] = useState<any>(null);
  const [activeWaNumber, setActiveWaNumber] = useState<string>('');
  const [shippingFeeSetting, setShippingFeeSetting] = useState(99);
  const [freeThresholdSetting, setFreeThresholdSetting] = useState(1000);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Production Phone Auth States
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Standalone Custom SMS API Fallback States (in case Supabase Auth Phone Provider is disabled)
  const [otpHash, setOtpHash] = useState<string | null>(null);
  const [isCustomOtp, setIsCustomOtp] = useState(false);

  // References for beautiful 6-digit auto-focus movement
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Address States
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  // Form Fields
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    city: '',
    state: ''
  });

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // Countdown timer clock
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Fetch active WhatsApp number & shipping settings on modal open & reset auth variables
  useEffect(() => {
    if (whatsAppModalOpen) {
      getActiveWhatsAppNumber().then(setActiveWaNumber);
      getShippingSettings().then(settings => {
        setShippingFeeSetting(settings.shippingFee);
        setFreeThresholdSetting(settings.freeShippingThreshold);
        setShippingEnabled(settings.shippingFeeEnabled);
      });
      setOtpDigits(['', '', '', '', '', '']);
      setOtpSent(false);
      setCountdown(0);
      setIsCustomOtp(false);
      setOtpHash(null);
    }
  }, [whatsAppModalOpen]);

  // Monitor user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setStep('address');
        fetchAddresses(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setStep('address');
        fetchAddresses(session.user.id);
      } else {
        setStep('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [whatsAppModalOpen]);

  const fetchAddresses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
        setAddressForm({
          fullName: data[0].full_name,
          phone: data[0].phone,
          addressLine1: data[0].address_line1,
          addressLine2: data[0].address_line2 || '',
          pincode: data[0].pincode,
          city: data[0].city,
          state: data[0].state
        });
      } else {
        setSelectedAddressId('new');
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleGmailLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined
        }
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // Triggers Standalone API SMS dispatch (via Twilio credentials or Simulated Fallback in development)
  const triggerCustomOtpFallback = async () => {
    try {
      console.log('Sending OTP via fallback custom API route...');
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send OTP via custom gateway');
      }

      setOtpHash(data.hash);
      setIsCustomOtp(true);
      setOtpSent(true);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);

      if (data.simulated) {
        // High visibility developer toast to make local testing incredibly simple and free!
        toast.success(`[Test Mode] OTP code sent: ${data.code} (Simulated)`, {
          duration: 10000,
          position: 'top-center'
        });
      } else {
        toast.success('Real SMS verification OTP sent to your phone! 📱');
      }
    } catch (err: any) {
      console.error('Custom OTP Fallback Error:', err);
      toast.error(err.message || 'Failed to send OTP. Please check your configuration.');
    }
  };

  // Secure Native Supabase Phone OTP Request (with Automatic Custom API Gateway Fallback)
  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phoneInput)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    const fullPhone = `${countryCode}${phoneInput}`;
    try {
      // 1. Attempt Native Supabase Phone OTP sign-in
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) {
        // Catch "unsupported provider" errors to gracefully trigger fallback
        if (
          error.message.includes('Unsupported phone provider') ||
          error.message.includes('phone_provider_disabled') ||
          error.message.includes('Provider phone is not enabled')
        ) {
          console.warn('Native Supabase Phone Auth is disabled/not configured. Switching to custom Twilio gateway...');
          await triggerCustomOtpFallback();
          return;
        }
        throw error;
      }

      setIsCustomOtp(false);
      setOtpSent(true);
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('Real SMS verification OTP sent to your phone! 📱');
    } catch (err: any) {
      console.warn('Supabase Phone Sign-in Failed. Triggering Custom Twilio API Route...', err.message);
      await triggerCustomOtpFallback();
    } finally {
      setLoading(false);
    }
  };

  // Secure OTP Verification (supporting both Native Supabase Auth & Standalone Custom OTP)
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      if (isCustomOtp) {
        // A. Verify with local hashing against custom server API hash
        if (!otpHash) {
          toast.error('Verification code has expired or is invalid. Please request a new one.');
          return;
        }

        const hashedInput = await sha256(code);
        if (hashedInput !== otpHash) {
          toast.error('Incorrect OTP. Please enter the correct verification code.');
          return;
        }

        // OTP is correct! Now let's register/login the user securely in Supabase using phone credentials
        const email = `phone_${phoneInput}@daisy-customer.com`;
        const password = `DaisySecureAuth_${phoneInput}_2026`;

        // Try logging in
        let { data, error } = await supabase.auth.signInWithPassword({ email, password });

        // If user doesn't exist, sign them up
        if (error && error.message.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: `Customer ${phoneInput}`,
              }
            }
          });

          if (signUpError) throw signUpError;
          data = signUpData as any;

          // Update user profile with actual phone number
          if (signUpData.user) {
            await supabase
              .from('users')
              .update({ phone: phoneInput, full_name: `Customer ${phoneInput}` })
              .eq('id', signUpData.user.id);
          }
        } else if (error) {
          throw error;
        }

        toast.success('Mobile verified successfully! 👑');
        if (data?.user) {
          setUser(data.user);
          setStep('address');
          fetchAddresses(data.user.id);
        }
      } else {
        // B. Native Supabase Phone Auth verification
        const fullPhone = `${countryCode}${phoneInput}`;
        const { data, error } = await supabase.auth.verifyOtp({
          phone: fullPhone,
          token: code,
          type: 'sms',
        });

        if (error) throw error;

        toast.success('Mobile verified successfully! 👑');

        // Update custom profiles table so phone is saved nicely
        if (data?.user) {
          await supabase
            .from('users')
            .update({ phone: phoneInput, full_name: `Customer ${phoneInput}` })
            .eq('id', data.user.id);
        }
      }
    } catch (err: any) {
      console.error('OTP Verification Error:', err);
      toast.error(err.message || 'Incorrect or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus helper function for individual inputs
  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);

    // Auto-focus next box if a digit was entered
    if (cleanValue && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Clear previous box and focus it
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpInputsRef.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      otpInputsRef.current[5]?.focus();
    }
  };

  const handleAddressSelect = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setAddressForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        pincode: '',
        city: '',
        state: ''
      });
    } else {
      const addr = savedAddresses.find((a) => a.id === id);
      if (addr) {
        setAddressForm({
          fullName: addr.full_name,
          phone: addr.phone,
          addressLine1: addr.address_line1,
          addressLine2: addr.address_line2 || '',
          pincode: addr.pincode,
          city: addr.city,
          state: addr.state
        });
      }
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill in all mandatory fields');
      return;
    }
    if (!/^\d{6}$/.test(addressForm.pincode)) {
      toast.error('Please enter a valid 6-digit Pincode');
      return;
    }
    setStep('summary');
  };

  const handleWhatsAppCheckout = async () => {
    setLoading(true);
    try {
      const finalAddress = { ...addressForm };

      // Save new address if user is logged in and requested
      if (user && selectedAddressId === 'new' && saveNewAddress) {
        const { error: addrError } = await supabase.from('addresses').insert({
          user_id: user.id,
          full_name: addressForm.fullName,
          phone: addressForm.phone,
          address_line1: addressForm.addressLine1,
          address_line2: addressForm.addressLine2 || null,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.pincode,
          is_default: savedAddresses.length === 0
        });
        if (addrError) console.error('Error saving address:', addrError);
      }

      // Generate a unique order number in format DSY-YYYY-NNNN
      const now = new Date();
      const year = now.getFullYear();
      const seq = String(Date.now()).slice(-4);
      const orderId = `DSY-${year}-${seq}`;

      const shippingFee = !shippingEnabled ? 0 : (shippingFeeSetting === 0 || whatsAppTotal >= freeThresholdSetting ? 0 : shippingFeeSetting);
      const grandTotal = whatsAppTotal + shippingFee;

      // 1. Insert into confirmed orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderId,
          status: 'pending',
          payment_method: 'whatsapp',
          payment_status: 'pending',
          subtotal: whatsAppTotal,
          shipping_fee: shippingFee,
          total: grandTotal,
          shipping_address: {
            full_name: addressForm.fullName,
            phone: addressForm.phone,
            address_line1: addressForm.addressLine1,
            address_line2: addressForm.addressLine2 || null,
            city: addressForm.city,
            state: addressForm.state,
            pincode: addressForm.pincode,
            country: 'India'
          },
          notes: 'WhatsApp checkout modal order'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      if (orderData && whatsAppOrderItems.length > 0) {
        const orderItems = whatsAppOrderItems.map((item: any) => ({
          order_id: orderData.id,
          product_id: item.productId || null,
          product_name: item.name,
          product_image: item.image || null,
          variant: item.variant || null,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) console.error('Error inserting order items:', itemsError);
      }

      // 3. Save to temp_orders table as well so the admin panel continues working seamlessly
      const itemsPayload = whatsAppOrderItems.map((item) => ({
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
        subtotal: whatsAppTotal,
        shipping_fee: shippingFee,
        total: grandTotal,
        shipping_address: {
          fullName: addressForm.fullName,
          phone: addressForm.phone,
          addressLine1: addressForm.addressLine1,
          addressLine2: addressForm.addressLine2 || null,
          city: addressForm.city,
          state: addressForm.state,
          pincode: addressForm.pincode
        },
        items: itemsPayload,
        confirmed_order_number: orderId
      });

      // 4. Generate WhatsApp message & redirect
      const customerDetails = {
        fullName: addressForm.fullName,
        phone: addressForm.phone,
        email: user?.email || 'N/A',
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2 || null,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        country: 'India'
      };

      const enrichedItems = whatsAppOrderItems.map((item: any) => ({
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
          subtotal: whatsAppTotal,
          shippingCharge: shippingFee,
          discount: 0,
          grandTotal: grandTotal,
          paymentMethod: 'whatsapp',
          paymentStatus: 'pending'
        },
        customerDetails,
        orderId,
        activeWaNumber || undefined
      );

      const redirectSuccess = await openWhatsApp(waUrl, false);
      if (redirectSuccess) {
        // Clear cart & close modal
        clearCart();
        setWhatsAppModalOpen(false);
        toast.success(`Order ${orderId} initiated on WhatsApp! 🌸`);
        router.push(`/orders/${orderId}`);
      } else {
        toast.error("Unable to open WhatsApp. Please install WhatsApp or contact support.");
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!whatsAppModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-nude-200 overflow-hidden flex flex-col my-8"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-nude-200 bg-nude-50">
          <div>
            <h3 className="font-heading text-lg text-daisy-900 flex items-center gap-2">
              <MessageCircle className="text-green-500 fill-green-50" size={22} />
              WhatsApp Checkout
            </h3>
            <p className="font-body text-[11px] text-daisy-400 mt-0.5">Secure validation & manual payment setup</p>
          </div>
          <button
            onClick={() => setWhatsAppModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-nude-100 text-daisy-400 hover:text-daisy-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Indicator */}
        <div className="grid grid-cols-3 border-b border-nude-100 text-center text-xs font-body font-medium">
          <div className={`py-3 border-b-2 transition-all ${step === 'auth' ? 'border-daisy-600 text-daisy-800 bg-daisy-50/30' : 'border-transparent text-daisy-400'}`}>
            1. Verification
          </div>
          <div className={`py-3 border-b-2 transition-all ${step === 'address' ? 'border-daisy-600 text-daisy-800 bg-daisy-50/30' : 'border-transparent text-daisy-400'}`}>
            2. Delivery Info
          </div>
          <div className={`py-3 border-b-2 transition-all ${step === 'summary' ? 'border-daisy-600 text-daisy-800 bg-daisy-50/30' : 'border-transparent text-daisy-400'}`}>
            3. Confirmation
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
          {/* STEP 1: Authentication */}
          {step === 'auth' && (
            <div className="space-y-6">
              <div className="text-center">
                <ShieldCheck className="mx-auto text-daisy-600 mb-2" size={42} />
                <h4 className="font-heading text-base text-daisy-800">Verify Your Identity</h4>
                <p className="font-body text-xs text-daisy-500 max-w-sm mx-auto mt-1">
                  To continue, please sign in with your Gmail or verify your mobile number.
                </p>
              </div>

              {/* Gmail Option */}
              <button
                onClick={handleGmailLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-nude-300 py-3 rounded-xl hover:bg-nude-50 font-body text-sm font-medium text-daisy-700 transition-colors"
              >
                <Mail size={18} className="text-red-500" />
                Continue with Gmail
              </button>

              <div className="relative flex items-center">
                <div className="flex-1 h-px bg-nude-200" />
                <span className="font-body text-[10px] text-daisy-400 px-4">OR</span>
                <div className="flex-1 h-px bg-nude-200" />
              </div>

              {/* Phone OTP Verification */}
              <div className="space-y-6">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-body text-xs font-semibold text-daisy-800 tracking-wider uppercase mb-2">
                        Mobile Number
                      </label>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          {/* Country Code Dropdown */}
                          <div className="relative">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="bg-cream border border-daisy-200 rounded-xl px-3.5 py-3 font-body text-xs text-daisy-900 outline-none focus:border-daisy-500 transition-colors cursor-pointer appearance-none pr-8 font-medium"
                            >
                              {COUNTRY_CODES.map((item) => (
                                <option key={item.code} value={item.code}>
                                  {item.code}
                                </option>
                              ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-daisy-400 text-[10px]">
                              ▼
                            </div>
                          </div>

                          {/* Phone Input */}
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-xs text-daisy-400">
                              📱
                            </span>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="Enter 10-Digit Mobile"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                              className="w-full pl-9 pr-4 py-3 bg-cream/30 border border-daisy-200 rounded-xl font-body text-xs text-daisy-800 outline-none focus:border-daisy-500 transition-colors font-medium"
                            />
                          </div>
                        </div>

                        {/* Trigger Send OTP */}
                        <button
                          onClick={handleSendOtp}
                          disabled={loading || phoneInput.length !== 10}
                          className="w-full bg-daisy-950 hover:bg-daisy-900 text-cream py-3 rounded-xl font-body text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center border border-daisy-900 shadow-md"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Premium Separated 6-Digit OTP Box Grid */}
                    <div>
                      <label className="block text-center font-body text-xs font-semibold text-daisy-800 tracking-wider uppercase mb-3.5">
                        Enter 6-Digit OTP Sent to Your SIM Inbox
                      </label>
                      <div className="flex justify-center gap-2">
                        {otpDigits.map((digit, index) => (
                          <input
                            key={index}
                            type="text"
                            maxLength={1}
                            ref={(el) => { otpInputsRef.current[index] = el; }}
                            value={digit}
                            onChange={(e) => handleDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(index, e)}
                            onPaste={handleDigitPaste}
                            className="w-11 h-12 text-center bg-cream border-2 border-daisy-200 focus:border-daisy-600 rounded-xl font-heading text-lg font-semibold text-daisy-950 outline-none transition-all shadow-sm focus:scale-105"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resend Status and Footer Buttons */}
                    <div className="flex flex-col items-center gap-4">
                      {countdown > 0 ? (
                        <p className="font-body text-xs text-daisy-500 bg-daisy-50/50 px-3.5 py-1.5 rounded-full border border-daisy-100/50">
                          Resend code in <span className="font-semibold text-daisy-800">{countdown}s</span>
                        </p>
                      ) : (
                        <button
                          onClick={handleSendOtp}
                          disabled={loading}
                          className="font-body text-xs text-daisy-700 hover:text-daisy-950 underline underline-offset-4 font-semibold transition-colors"
                        >
                          Resend OTP Code
                        </button>
                      )}

                      <div className="flex gap-2.5 w-full mt-1.5">
                        <button
                          onClick={() => { setOtpSent(false); setOtpDigits(['', '', '', '', '', '']); }}
                          disabled={loading}
                          className="flex-1 border border-daisy-200 py-3 rounded-xl font-body text-xs font-semibold text-daisy-700 hover:bg-cream transition-all uppercase tracking-wider"
                        >
                          Change Number
                        </button>
                        <button
                          onClick={handleVerifyOtp}
                          disabled={loading || otpDigits.join('').length !== 6}
                          className="flex-1 bg-daisy-950 hover:bg-daisy-900 text-cream py-3 rounded-xl font-body text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-40 uppercase tracking-wider border border-daisy-900"
                        >
                          {loading ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <>
                              <ShieldCheck size={14} />
                              Verify & Continue
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Address Form */}
          {step === 'address' && (
            <form onSubmit={handleAddressSubmit} className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-heading text-sm text-daisy-800 flex items-center gap-1.5">
                  <MapPin size={16} className="text-daisy-600" />
                  Delivery Details
                </h4>
                {user && (
                  <span className="font-body text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Verified Logged In
                  </span>
                )}
              </div>

              {/* Address Book Selection if addresses exist */}
              {user && savedAddresses.length > 0 && (
                <div className="space-y-2 mb-4 bg-nude-50 p-4 border border-nude-200 rounded-xl">
                  <span className="block font-body text-[10px] font-semibold text-daisy-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen size={12} /> Choose Saved Address
                  </span>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-daisy-600 bg-white shadow-sm' : 'border-nude-200 hover:border-nude-300'}`}
                      >
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleAddressSelect(addr.id)}
                          className="mt-1 accent-daisy-600"
                        />
                        <div className="font-body text-xs text-daisy-700">
                          <strong>{addr.full_name}</strong> - {addr.phone} <br />
                          {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                        </div>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-daisy-600 bg-white shadow-sm' : 'border-nude-200 hover:border-nude-300'}`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        checked={selectedAddressId === 'new'}
                        onChange={() => handleAddressSelect('new')}
                        className="accent-daisy-600"
                      />
                      <div className="font-body text-xs text-daisy-700 flex items-center gap-1 font-semibold">
                        <Plus size={14} /> Use a Different Address
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div className="space-y-4">
                <div>
                  <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter recipient's full name"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    disabled={selectedAddressId !== 'new'}
                    className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                  />
                </div>

                <div>
                  <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">Delivery Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number for courier contact"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                    disabled={selectedAddressId !== 'new'}
                    className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                  />
                </div>

                <div>
                  <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">Address Line 1 (Flat, House No, Building, Street) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 302, Green Glen Layout"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    disabled={selectedAddressId !== 'new'}
                    className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                  />
                </div>

                <div>
                  <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">Address Line 2 (Landmark, Area, Colony) - Optional</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Rose Garden School"
                    value={addressForm.addressLine2}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                    disabled={selectedAddressId !== 'new'}
                    className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="600001"
                      value={addressForm.pincode}
                      onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '') })}
                      disabled={selectedAddressId !== 'new'}
                      className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      placeholder="Chennai"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      disabled={selectedAddressId !== 'new'}
                      className="w-full px-3.5 py-2.5 border border-nude-300 rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-[11px] font-semibold text-daisy-600 mb-1">State *</label>
                  <select
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    disabled={selectedAddressId !== 'new'}
                    className="w-full px-3.5 py-2.5 border border-nude-300 bg-white rounded-lg font-body text-xs outline-none focus:border-daisy-500 disabled:bg-nude-50 disabled:text-daisy-400"
                  >
                    <option value="">Select Delivery State</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {user && selectedAddressId === 'new' && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="rounded border-nude-300 text-daisy-600 focus:ring-daisy-500"
                    />
                    <span className="font-body text-[11px] text-daisy-500">Save address to my address book</span>
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-nude-100">
                {user && (
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                      setSavedAddresses([]);
                      setStep('auth');
                    }}
                    className="border border-red-200 text-red-500 py-3 px-4 rounded-xl font-body text-xs font-semibold hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 btn-primary py-3 rounded-xl font-body text-xs font-semibold text-center"
                >
                  Continue to Confirmation
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Summary & WhatsApp Link */}
          {step === 'summary' && (
            <div className="space-y-6">
              <h4 className="font-heading text-sm text-daisy-800 border-b border-nude-100 pb-2">Order Confirmation</h4>

              {/* Items List Summary */}
              <div className="space-y-3">
                <span className="block font-body text-[10px] font-semibold text-daisy-400 uppercase tracking-wider">Items in Bag ({whatsAppOrderItems.length})</span>
                <div className="divide-y divide-nude-100 max-h-[140px] overflow-y-auto pr-1">
                  {whatsAppOrderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2.5 font-body text-xs">
                      <div className="text-daisy-700 font-medium">
                        {item.name} {item.variant ? `(${item.variant})` : ''} <span className="text-daisy-400">× {item.quantity}</span>
                      </div>
                      <div className="text-daisy-800">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Details Box */}
              <div className="bg-nude-50 p-4 border border-nude-200 rounded-xl space-y-2">
                <span className="block font-body text-[10px] font-semibold text-daisy-400 uppercase tracking-wider">Shipping Address</span>
                <div className="font-body text-xs text-daisy-700 leading-relaxed">
                  <p className="font-semibold text-daisy-800">{addressForm.fullName}</p>
                  <p>{addressForm.phone}</p>
                  <p>{addressForm.addressLine1}{addressForm.addressLine2 ? `, ${addressForm.addressLine2}` : ''}</p>
                  <p>{addressForm.city}, {addressForm.state} - {addressForm.pincode}</p>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-b border-nude-100 py-3.5 space-y-2.5 font-body text-xs text-daisy-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{whatsAppTotal.toLocaleString('en-IN')}</span>
                </div>
                {shippingEnabled && (
                  <div className="flex justify-between">
                    <span>Shipping Fee</span>
                    <span className={shippingFeeSetting === 0 || whatsAppTotal >= freeThresholdSetting ? "text-green-600 font-medium" : ""}>
                      {shippingFeeSetting === 0 || whatsAppTotal >= freeThresholdSetting ? 'FREE' : `₹${shippingFeeSetting}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-heading text-base text-daisy-900 pt-1.5 border-t border-dashed border-nude-200">
                  <span>Grand Total</span>
                  <span>₹{(whatsAppTotal + (!shippingEnabled ? 0 : (shippingFeeSetting === 0 || whatsAppTotal >= freeThresholdSetting ? 0 : shippingFeeSetting))).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={loading}
                  className="w-full btn-whatsapp py-3.5 rounded-xl font-body text-xs font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      Place Order via WhatsApp
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  disabled={loading}
                  className="w-full border border-nude-300 py-2.5 rounded-xl font-body text-[11px] font-semibold text-daisy-500 hover:text-daisy-800 transition-colors"
                >
                  Edit Address Info
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
