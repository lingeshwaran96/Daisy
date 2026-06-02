// src/app/layout.tsx
// Root layout - wraps all pages with providers and global components

import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import MetaPixel from '@/components/MetaPixel';

export const metadata: Metadata = {
  title: { default: 'DAISY – Elegance That Blooms', template: '%s | DAISY' },
  description: 'Shop premium luxury jewellery, sarees, and fashion at DAISY. Discover elegant collections crafted for the modern woman.',
  keywords: ['luxury jewellery', 'silver jewellery', 'sarees', 'fashion', 'daisy', 'premium'],
  authors: [{ name: 'DAISY' }],
  openGraph: {
    type: 'website',
    siteName: 'DAISY',
    title: 'DAISY – Elegance That Blooms',
    description: 'Premium luxury ecommerce for the modern woman',
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.json',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-body bg-white text-daisy-900 antialiased">
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Jost, sans-serif',
              fontSize: '14px',
              borderRadius: '0',
              border: '1px solid #f3dece',
            },
          }}
        />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
