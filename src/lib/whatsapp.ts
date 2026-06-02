// src/lib/whatsapp.ts
// WhatsApp message generation utilities for DAISY
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

// Fallback number (from env or default)
const FALLBACK_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';

// In-memory cache for the active WhatsApp number
let cachedNumber: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

export type ShippingSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  shippingFeeEnabled: boolean;
};

let cachedShippingSettings: ShippingSettings | null = null;
let shippingCacheTimestamp = 0;

/**
 * Fetches current shipping fee and threshold settings from site_settings.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  const now = Date.now();
  if (cachedShippingSettings && now - shippingCacheTimestamp < CACHE_TTL) {
    return cachedShippingSettings;
  }

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['shipping_fee', 'free_shipping_threshold', 'shipping_fee_enabled']);

    let shippingFee = 99;
    let freeShippingThreshold = 1000;
    let shippingFeeEnabled = true;

    if (data) {
      const feeRow = data.find(r => r.key === 'shipping_fee');
      const thresholdRow = data.find(r => r.key === 'free_shipping_threshold');
      const enabledRow = data.find(r => r.key === 'shipping_fee_enabled');
      if (feeRow && feeRow.value) shippingFee = Number(feeRow.value);
      if (thresholdRow && thresholdRow.value) freeShippingThreshold = Number(thresholdRow.value);
      if (enabledRow) shippingFeeEnabled = enabledRow.value !== 'false';
    }

    const activeFee = shippingFeeEnabled ? shippingFee : 0;

    cachedShippingSettings = { shippingFee: activeFee, freeShippingThreshold, shippingFeeEnabled };
    shippingCacheTimestamp = now;
    return cachedShippingSettings;
  } catch {
    return { shippingFee: 99, freeShippingThreshold: 1000, shippingFeeEnabled: true };
  }
}

/**
 * Fetches the active (primary) WhatsApp number from the database.
 * Checks both 'whatsapp_primary' (Admin Settings tab) and 'whatsapp_number' (Footer Settings tab).
 * Uses an in-memory cache to avoid hammering the DB on every call.
 */
export async function getActiveWhatsAppNumber(): Promise<string> {
  const now = Date.now();
  if (cachedNumber && now - cacheTimestamp < CACHE_TTL) {
    console.log('[WhatsApp] Returning cached number:', cachedNumber);
    return cachedNumber;
  }

  try {
    // Query both possible keys — Admin Settings saves as 'whatsapp_primary',
    // Footer Settings saves as 'whatsapp_number'
    const { data } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['whatsapp_primary', 'whatsapp_number']);

    if (data && data.length > 0) {
      // Prefer 'whatsapp_primary' (set by Admin Settings → WhatsApp Contacts tab)
      const primaryRow = data.find(r => r.key === 'whatsapp_primary');
      const footerRow = data.find(r => r.key === 'whatsapp_number');
      const resolvedNumber = primaryRow?.value || footerRow?.value;

      if (resolvedNumber) {
        console.log('[WhatsApp] Number loaded from DB:', resolvedNumber, '| Source key:', primaryRow?.value ? 'whatsapp_primary' : 'whatsapp_number');
        cachedNumber = resolvedNumber;
        cacheTimestamp = now;
        return resolvedNumber;
      }
    }
  } catch (err) {
    console.warn('[WhatsApp] DB fetch failed, using fallback:', err);
  }

  console.log('[WhatsApp] Using fallback number:', FALLBACK_NUMBER);
  return FALLBACK_NUMBER;
}

/**
 * Synchronous getter — returns cached number or fallback.
 * Use this in non-async contexts (like inside JSX).
 */
export function getWhatsAppNumberSync(): string {
  return cachedNumber || FALLBACK_NUMBER;
}

export type WhatsAppCartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant?: string | null;
  image?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  productUrl?: string | null;
};

export type CustomerAddress = {
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

/**
 * Detects mobile browsers specifically listed in requirements:
 * - Android Chrome
 * - Samsung Internet
 * - iPhone Safari
 * - Mobile Firefox
 */
export function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();

  // Specific browser & OS checks
  const isAndroid = ua.includes('android');
  const isIPhone = ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod');
  const isChrome = ua.includes('chrome') || ua.includes('crios');
  const isSamsung = ua.includes('samsungbrowser');
  const isSafari = isIPhone && ua.includes('safari') && !isChrome;
  const isFirefox = ua.includes('firefox') || ua.includes('fxios');

  const isAndroidChrome = isAndroid && isChrome && !isSamsung;
  const isSamsungInternet = isSamsung;
  const isIPhoneSafari = isSafari;
  const isMobileFirefox = (isAndroid || isIPhone) && isFirefox;

  // Generic mobile fallback
  const isGenericMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  return isAndroidChrome || isSamsungInternet || isIPhoneSafari || isMobileFirefox || isGenericMobile;
}

/**
 * Generates a WhatsApp URL for cart/multiple items order
 */
export function generateCartWhatsAppURL(
  items: WhatsAppCartItem[],
  totals: {
    subtotal: number;
    shippingCharge: number;
    discount: number;
    grandTotal: number;
    paymentMethod: string;
    paymentStatus: string;
  },
  customer: CustomerAddress,
  orderId: string,
  phoneNumber?: string
): string {
  const waNumber = phoneNumber || getWhatsAppNumberSync();
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://daisyshop.in';

  // Build the full detailed message
  const itemsText = items.map((item, idx) => {
    // Extract size & color from variant string if possible
    let sizeText = item.size || 'N/A';
    let colorText = item.color || 'N/A';

    if (item.variant && (sizeText === 'N/A' || colorText === 'N/A')) {
      const parts = item.variant.split(',');
      parts.forEach(part => {
        const kv = part.split(':');
        if (kv.length === 2) {
          const k = kv[0].trim().toLowerCase();
          const v = kv[1].trim();
          if (k.includes('size') && sizeText === 'N/A') sizeText = v;
          if (k.includes('color') && colorText === 'N/A') colorText = v;
        }
      });
    }

    return `${idx + 1}. *${item.name}*
   Variant: ${item.variant || 'Default'}
   Qty: ${item.quantity}
   Price: ₹${item.price.toLocaleString('en-IN')}`
  }).join('\n');

  const message = `🌸 *NEW DAISY ORDER*

*Order:* ${orderId}
*Customer:* ${customer.fullName}
*Phone:* ${customer.phone}

*Items:*
${itemsText}

*Grand Total:* ₹${totals.grandTotal.toLocaleString('en-IN')}

📦 *Full Details, Images & Address:*
${domain}/orders/${orderId}`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encoded}`;
}

export type WhatsAppOrderDetails = {
  productName: string;
  productPrice: number;
  quantity: number;
  variant?: string | null;
  productUrl?: string;
  productImage?: string | null;
  productId?: string;
  sku?: string | null;
};

/**
 * Generates a WhatsApp URL with pre-filled order message
 * Legacy helper now mapped directly to generateCartWhatsAppURL for single item to ensure consistent premium details
 */
export function generateWhatsAppOrderURL(details: WhatsAppOrderDetails, address?: CustomerAddress, phoneNumber?: string): string {
  const domain = typeof window !== 'undefined' ? window.location.origin : 'https://daisyshop.in';

  const item: WhatsAppCartItem = {
    productId: details.productId || 'unknown',
    name: details.productName,
    price: details.productPrice,
    quantity: details.quantity,
    variant: details.variant || null,
    image: details.productImage || null,
    sku: details.sku || null,
    productUrl: details.productUrl || null
  };

  const customer: CustomerAddress = address || {
    fullName: 'Guest User',
    phone: 'Not Specified',
    email: 'N/A',
    addressLine1: 'Not Specified',
    city: 'Not Specified',
    state: 'Not Specified',
    pincode: '000000',
    country: 'India'
  };

  return generateCartWhatsAppURL(
    [item],
    {
      subtotal: details.productPrice * details.quantity,
      shippingCharge: 0,
      discount: 0,
      grandTotal: details.productPrice * details.quantity,
      paymentMethod: 'whatsapp',
      paymentStatus: 'pending'
    },
    customer,
    `DSY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    phoneNumber
  );
}

/**
 * Highly robust redirect that:
 * 1. Checks desktop vs mobile
 * 2. Uses window.location.href on mobile and window.open on desktop
 * 3. Incorporates automatic fallback (api.whatsapp.com/send) if wa.me fails or is blocked
 * 4. Tracks browser focus-loss (blur event) to check if the app launched successfully
 * 5. Returns a promise resolving to boolean (indicating redirect success/failure)
 */
export function openWhatsApp(url: string, showToastError: boolean = true): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const isMobile = detectMobile();

    let waUrl = url;
    let fallbackUrl = url;

    // Parse wa.me parameters to convert to api.whatsapp.com fallback if needed
    if (url.includes('wa.me/')) {
      const match = url.match(/wa\.me\/([^?]+)\?text=(.+)/);
      if (match) {
        const phone = match[1];
        const text = match[2];
        waUrl = `https://wa.me/${phone}?text=${text}`;
        fallbackUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${text}`;
      }
    }

    let success = false;

    if (isMobile) {
      const start = Date.now();

      const blurHandler = () => {
        success = true;
        window.removeEventListener('blur', blurHandler);
      };

      window.addEventListener('blur', blurHandler);
      window.location.href = waUrl;

      // Check after 1.5 seconds if the browser lost focus (meaning WhatsApp opened)
      setTimeout(() => {
        window.removeEventListener('blur', blurHandler);
        if (!success) {
          // If wa.me failed to open, try fallback URL
          window.location.href = fallbackUrl;

          setTimeout(() => {
            // If we are still focused after 3.5s total, WhatsApp did not open at all
            if (Date.now() - start < 3500) {
              if (showToastError) {
                toast.error("Unable to open WhatsApp. Please install WhatsApp or contact support.");
              }
              resolve(false);
            } else {
              resolve(true);
            }
          }, 1500);
        } else {
          resolve(true);
        }
      }, 1500);
    } else {
      // Desktop behavior
      try {
        const win = window.open(waUrl, "_blank", "noopener,noreferrer");
        if (win) {
          resolve(true);
        } else {
          // Popup blocker blocked window.open. Try fallback
          const winFallback = window.open(fallbackUrl, "_blank", "noopener,noreferrer");
          if (winFallback) {
            resolve(true);
          } else {
            if (showToastError) {
              toast.error("Unable to open WhatsApp. Please install WhatsApp or contact support.");
            }
            resolve(false);
          }
        }
      } catch (err) {
        if (showToastError) {
          toast.error("Unable to open WhatsApp. Please install WhatsApp or contact support.");
        }
        resolve(false);
      }
    }
  });
}
