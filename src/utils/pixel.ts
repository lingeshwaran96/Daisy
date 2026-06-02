// src/utils/pixel.ts
// Utility for tracking events on the client side with Meta Pixel (Facebook Pixel)

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const pageview = () => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'PageView');
  }
};

// Standard event tracking
// https://developers.facebook.com/docs/meta-pixel/reference
export const event = (name: string, options = {}) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', name, options);
  }
};
