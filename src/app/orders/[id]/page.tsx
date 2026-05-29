// src/app/orders/[id]/page.tsx
// Server Component with dynamic Open Graph metadata for WhatsApp link previews

import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import OrderDetailsClient from './OrderDetailsClient';

export const dynamic = 'force-dynamic';

// Create a lightweight Supabase client for server-side metadata generation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getOrderData(orderId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Try confirmed orders table
  const { data: confirmedOrder } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderId)
    .maybeSingle();

  if (confirmedOrder) {
    const items = (confirmedOrder.order_items || []).map((item: any) => ({
      name: item.product_name,
      image: item.product_image,
      quantity: item.quantity,
      price: Number(item.price),
    }));

    const address = confirmedOrder.shipping_address || {};

    return {
      orderNumber: confirmedOrder.order_number,
      customerName: address.full_name || address.fullName || 'Customer',
      total: Number(confirmedOrder.total),
      items,
      status: confirmedOrder.status,
      firstImage: items[0]?.image || null,
    };
  }

  // 2. Try temp_orders table
  const { data: tempOrder } = await supabase
    .from('temp_orders')
    .select('*')
    .eq('temp_order_number', orderId)
    .maybeSingle();

  if (tempOrder) {
    const rawItems = Array.isArray(tempOrder.items) ? tempOrder.items : [];
    const items = rawItems.map((item: any) => ({
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      price: Number(item.price),
    }));

    const address = tempOrder.shipping_address || {};

    return {
      orderNumber: tempOrder.temp_order_number,
      customerName: address.fullName || address.full_name || 'Customer',
      total: Number(tempOrder.total),
      items,
      status: tempOrder.status,
      firstImage: items[0]?.image || null,
    };
  }

  return null;
}

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const orderId = params.id;
  const order = await getOrderData(orderId);

  if (!order) {
    return {
      title: `Order ${orderId} | Daisy Shop`,
      description: 'Order details not found.',
    };
  }

  // Build a concise description for the OG preview card
  const itemsSummary = order.items
    .slice(0, 3)
    .map((item: any) => `${item.quantity}x ${item.name}`)
    .join(', ');
  const moreItems = order.items.length > 3 ? ` +${order.items.length - 3} more` : '';
  const description = `${order.customerName} — ${itemsSummary}${moreItems} | Total: ₹${order.total.toLocaleString('en-IN')}`;

  const domain = process.env.NEXT_PUBLIC_SITE_URL || 'https://daisyshop.in';

  // Use the first product image as the OG image, or fall back to a default
  const ogImage = order.firstImage || `${domain}/images/og-default.jpg`;

  return {
    title: `Daisy Order #${order.orderNumber}`,
    description,
    openGraph: {
      title: `🌸 Daisy Order #${order.orderNumber}`,
      description,
      url: `${domain}/orders/${orderId}`,
      siteName: 'Daisy Shop',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 800,
          alt: `Order ${order.orderNumber} - ${order.items[0]?.name || 'Product'}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `🌸 Daisy Order #${order.orderNumber}`,
      description,
      images: [ogImage],
    },
  };
}

export default function OrderPage() {
  return <OrderDetailsClient />;
}
