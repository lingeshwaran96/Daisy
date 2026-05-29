// src/lib/whatsapp.ts
// WhatsApp message generation utilities for DAISY

import { supabase } from '@/lib/supabase';

// Fallback number (from env or default)
const FALLBACK_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210';

// In-memory cache for the active WhatsApp number
let cachedNumber: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetches the active (primary) WhatsApp number from the database.
 * Uses an in-memory cache to avoid hammering the DB on every call.
 */
export async function getActiveWhatsAppNumber(): Promise<string> {
  const now = Date.now();
  if (cachedNumber && now - cacheTimestamp < CACHE_TTL) {
    return cachedNumber;
  }

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'whatsapp_primary')
      .single();

    if (data?.value) {
      cachedNumber = data.value;
      cacheTimestamp = now;
      return data.value;
    }
  } catch {
    // DB not available — use fallback
  }

  return FALLBACK_NUMBER;
}

/**
 * Synchronous getter — returns cached number or fallback.
 * Use this in non-async contexts (like inside JSX).
 */
export function getWhatsAppNumberSync(): string {
  return cachedNumber || FALLBACK_NUMBER;
}

export type AddressDetails = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type WhatsAppOrderDetails = {
  productName: string;
  productPrice: number;
  quantity: number;
  variant?: string | null;
  productUrl?: string;
  productImage?: string | null;
};

/**
 * Generates a WhatsApp URL with pre-filled order message
 * Opens WhatsApp with product details automatically inserted
 */
export function generateWhatsAppOrderURL(details: WhatsAppOrderDetails, address?: AddressDetails, phoneNumber?: string): string {
  const { productName, productPrice, quantity, variant, productUrl, productImage } = details;
  const waNumber = phoneNumber || getWhatsAppNumberSync();

  const addressSection = address
    ? `*Name:* ${address.fullName}
*Phone:* ${address.phone}
*Delivery Address:* 
  ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}
  City: ${address.city}
  State: ${address.state}
  Pincode: ${address.pincode}`
    : `*Name:* 
*Phone:* 
*Delivery Address:* 
  Street:
  City:
  State:
  Pincode:`;

  const message = `🌸 *DAISY - New Order Enquiry*

━━━━━━━━━━━━━━━━━━━━
📦 *Product Details*
━━━━━━━━━━━━━━━━━━━━
*Product:* ${productName}
${variant ? `*Variant:* ${variant}` : ''}
*Price:* ₹${productPrice.toLocaleString('en-IN')}
*Quantity:* ${quantity}
*Total:* ₹${(productPrice * quantity).toLocaleString('en-IN')}
${productUrl ? `*Link:* ${productUrl}` : ''}
${productImage ? `🖼️ *Product Image:* ${productImage}` : ''}

━━━━━━━━━━━━━━━━━━━━
📋 *Customer Details*
━━━━━━━━━━━━━━━━━━━━
${addressSection}

━━━━━━━━━━━━━━━━━━━━
💳 *Payment*
━━━━━━━━━━━━━━━━━━━━
(Admin will share payment details)

_Our team will confirm your order shortly!_ 🌸`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encoded}`;
}

/**
 * Generates a WhatsApp URL for cart/multiple items order
 */
export function generateCartWhatsAppURL(
  items: Array<{ name: string; price: number; quantity: number; variant?: string | null; image?: string | null }>,
  total: number,
  address?: AddressDetails,
  phoneNumber?: string,
  tempOrderNumber?: string
): string {
  const waNumber = phoneNumber || getWhatsAppNumberSync();

  const itemsList = items
    .map(
      (item, i) => {
        const lines = [
          `${i + 1}. *${item.name}*`,
          item.variant ? `   📐 Size/Variant: ${item.variant}` : null,
          `   🔢 Qty: ${item.quantity}  |  💰 ₹${item.price.toLocaleString('en-IN')} × ${item.quantity} = *₹${(item.price * item.quantity).toLocaleString('en-IN')}*`,
          item.image ? `   🖼️ View Product: ${item.image}` : null,
        ].filter(Boolean);
        return lines.join('\n');
      }
    )
    .join('\n\n');

  const addressSection = address
    ? `*Name:* ${address.fullName}
*Phone:* ${address.phone}
*Delivery Address:* 
  ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}
  City: ${address.city}
  State: ${address.state}
  Pincode: ${address.pincode}`
    : `*Name:* 
*Phone:* 
*Delivery Address:* 
  Street:
  City:
  State:
  Pincode:`;

  const shippingFee = total >= 1000 ? 0 : 99;
  const grandTotal = total + shippingFee;

  const message = `🌸 *DAISY - New Order Enquiry*

${tempOrderNumber ? `*Order ID (Temporary):* ${tempOrderNumber}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
🛍️ *Items Ordered (${items.length})*
━━━━━━━━━━━━━━━━━━━━
${itemsList}

━━━━━━━━━━━━━━━━━━━━
🧾 *Order Summary*
━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${total.toLocaleString('en-IN')}
Shipping: ${shippingFee === 0 ? 'FREE 🎉' : `₹${shippingFee}`}
*Grand Total: ₹${grandTotal.toLocaleString('en-IN')}*

━━━━━━━━━━━━━━━━━━━━
📋 *Customer Details*
━━━━━━━━━━━━━━━━━━━━
${addressSection}

━━━━━━━━━━━━━━━━━━━━
💳 *Payment*
━━━━━━━━━━━━━━━━━━━━
(Please complete your UPI/QR payment and send the screenshot here. Once verified by our admin, your order will be confirmed!)

_Please confirm order details!_ 🌸`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encoded}`;
}

/**
 * Open WhatsApp directly
 */
export function openWhatsApp(url: string): void {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
