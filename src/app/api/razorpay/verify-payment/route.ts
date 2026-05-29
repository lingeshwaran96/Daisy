// src/app/api/razorpay/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { buildOrderStatusMessage, buildSMSText, sendNotification, STATUS_LABELS } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, user_id, amount } = await req.json();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Update order in DB
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    if (orderError) throw orderError;

    // Record payment
    await supabaseAdmin.from('payments').insert([{
      order_id,
      user_id: user_id || null,
      method: 'razorpay',
      amount,
      status: 'completed',
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      verified_at: new Date().toISOString(),
    }]);

    // Fetch full order and customer details for notification dispatch
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, users(id, full_name, email, phone)')
      .eq('id', order_id)
      .single();

    if (order) {
      const user = order.users;
      const customerName = user?.full_name || order.shipping_address?.fullName || order.shipping_address?.full_name || 'Customer';
      const customerPhone = user?.phone || order.shipping_address?.phone || '';
      const customerEmail = user?.email || '';

      const { subject, whatsapp, html } = buildOrderStatusMessage(
        order.order_number,
        'confirmed',
        customerName,
        { total: order.total }
      );

      // Build plain SMS for SIM delivery
      const smsText = buildSMSText(
        order.order_number,
        'confirmed',
        customerName,
        { total: order.total }
      );

      // Trigger multi-channel confirmation: WhatsApp + SMS + Email + In-App
      await sendNotification({
        userId: user?.id || order.user_id,
        title: `Order #${order.order_number} — ${STATUS_LABELS.confirmed}`,
        message: `Your order has been confirmed successfully!`,
        type: 'order',
        channel: 'all',
        phone: customerPhone,
        email: customerEmail,
        customerName,
        metadata: {
          order_id,
          order_number: order.order_number,
          new_status: 'confirmed',
          whatsappMessage: whatsapp,
          smsText,
          emailSubject: subject,
          emailHtml: html,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
