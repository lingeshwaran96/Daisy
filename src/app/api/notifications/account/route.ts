// src/app/api/notifications/account/route.ts
// API Route: Triggered on account events (signup, email/phone/password changes)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { buildAccountMessage, sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { userId, event } = await req.json();

    if (!userId || !event) {
      return NextResponse.json({ error: 'userId and event are required' }, { status: 400 });
    }

    const validEvents = ['account_created', 'email_changed', 'phone_changed', 'password_changed'];
    if (!validEvents.includes(event)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { subject, whatsapp, html } = buildAccountMessage(event, user.full_name || 'Customer');

    // Build plain SMS (strip markdown asterisks, keep it clean for SIM)
    const smsText = whatsapp
      .replace(/\*(.*?)\*/g, '$1')   // remove *bold*
      .replace(/\n+/g, ' ')         // collapse newlines
      .trim()
      .substring(0, 160);           // SMS 160-char limit

    const results = await sendNotification({
      userId: user.id,
      title: subject,
      message: whatsapp.replace(/\*/g, '').replace(/\n/g, ' ').substring(0, 200),
      type: 'account',
      channel: 'all',
      phone: user.phone || undefined,
      email: user.email || undefined,
      customerName: user.full_name || 'Customer',
      metadata: {
        event,
        whatsappMessage: whatsapp,
        smsText,
        emailSubject: subject,
        emailHtml: html,
      },
    });

    return NextResponse.json({ success: true, notifications: results });
  } catch (err: any) {
    console.error('[API] Account notification error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
