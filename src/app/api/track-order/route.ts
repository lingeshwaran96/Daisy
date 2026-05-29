// src/app/api/track-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { order_number, phone, contact } = await req.json();
    const searchContact = (contact || phone || '').trim();

    if (!order_number || !searchContact) {
      return NextResponse.json({ error: 'Order number and phone/email are required' }, { status: 400 });
    }

    const cleanOrderNumber = order_number.trim().toUpperCase();
    const isTemp = cleanOrderNumber.startsWith('DSY-TEMP-');
    let order: any = null;
    let error: any = null;

    if (isTemp) {
      const { data, error: tempError } = await supabaseAdmin
        .from('temp_orders')
        .select('*, users(email)')
        .eq('temp_order_number', cleanOrderNumber)
        .single();
      order = data;
      error = tempError;
    } else {
      const { data, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*), users(email)')
        .eq('order_number', cleanOrderNumber)
        .single();
      order = data;
      error = orderError;
    }

    console.log('Track Order query:', { cleanOrderNumber, order, error });

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isEmail = searchContact.includes('@');
    if (isEmail) {
      const orderEmail = order.users?.email || '';
      if (orderEmail.toLowerCase() !== searchContact.toLowerCase()) {
        return NextResponse.json({ error: 'Email address does not match order records' }, { status: 404 });
      }
    } else {
      // Verify phone matches shipping address
      const shippingPhone = (order.shipping_address?.phone || '').replace(/\D/g, '').slice(-10);
      const inputPhone = searchContact.replace(/\D/g, '').slice(-10);

      if (shippingPhone !== inputPhone) {
        return NextResponse.json({ error: 'Phone number does not match order records' }, { status: 404 });
      }
    }

    // Retrieve full notifications message history for this order (WhatsApp/SMS alerts)
    let notifications: any[] = [];
    const { data: notifs } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: true });

    if (notifs) {
      notifications = notifs.filter((n: any) => 
        n.metadata?.order_id === order.id || 
        n.metadata?.order_number === (order.order_number || cleanOrderNumber) ||
        n.metadata?.temp_order_number === (order.temp_order_number || cleanOrderNumber)
      );
    }

    return NextResponse.json({ order, isTemp, notifications });
  } catch (err: any) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
