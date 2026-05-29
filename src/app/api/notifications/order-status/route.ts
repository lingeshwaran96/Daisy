// src/app/api/notifications/order-status/route.ts
// API Route: Triggered when admin updates order status
// Sends WhatsApp, Email, and saves in-app notification

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildOrderStatusMessage,
  buildSMSText,
  sendNotification,
  STATUS_LABELS,
} from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { orderId, newStatus, courierName, trackingNumber, trackingUrl } = await req.json();

    if (!orderId || !newStatus) {
      return NextResponse.json({ error: 'orderId and newStatus are required' }, { status: 400 });
    }

    // 1. Get order + user details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, users(id, full_name, email, phone)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Update order status and tracking info
    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Add timestamps for specific statuses
    if (newStatus === 'packed') updatePayload.packed_at = new Date().toISOString();
    if (newStatus === 'shipped') updatePayload.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString();

    // Add tracking details for shipped status
    if (trackingNumber) updatePayload.tracking_number = trackingNumber;
    if (trackingUrl) updatePayload.tracking_url = trackingUrl;
    if (courierName) updatePayload.notes = (order.notes ? order.notes + '\n' : '') + `Courier: ${courierName}`;

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update order: ${updateError.message}` }, { status: 500 });
    }

    // 3. Build notification message
    const user = order.users;
    const customerName = user?.full_name || order.shipping_address?.fullName || order.shipping_address?.full_name || 'Customer';
    const customerPhone = user?.phone || order.shipping_address?.phone || '';
    const customerEmail = user?.email || '';

    const { subject, whatsapp, html } = buildOrderStatusMessage(
      order.order_number,
      newStatus,
      customerName,
      { courierName, trackingNumber, trackingUrl, total: order.total }
    );

    // Build plain SMS text (SIM message — no markdown)
    const smsText = buildSMSText(
      order.order_number,
      newStatus,
      customerName,
      { courierName, trackingNumber, trackingUrl, total: order.total }
    );

    // 4. Send notification via all channels: WhatsApp + SMS + Email + In-App
    const results = await sendNotification({
      userId: user?.id || order.user_id,
      title: `Order #${order.order_number} — ${STATUS_LABELS[newStatus] || newStatus}`,
      message: `Your order status has been updated to ${STATUS_LABELS[newStatus] || newStatus}`,
      type: 'order',
      channel: 'all',
      phone: customerPhone,
      email: customerEmail,
      customerName,
      metadata: {
        order_id: orderId,
        order_number: order.order_number,
        old_status: order.status,
        new_status: newStatus,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        courier_name: courierName,
        whatsappMessage: whatsapp,
        smsText,                  // ← real SIM text message
        emailSubject: subject,
        emailHtml: html,
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      notifications: results,
    });
  } catch (err: any) {
    console.error('[API] Order status notification error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
