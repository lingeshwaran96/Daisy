// src/lib/notifications.ts
// Core notification service — WhatsApp, Email, In-App

import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/lib/supabase';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
export type NotificationType = 'order' | 'account' | 'system';
export type NotificationChannel = 'whatsapp' | 'email' | 'in_app' | 'all';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
  // For targeted delivery
  phone?: string;
  email?: string;
  customerName?: string;
}

// ──────────────────────────────────────────
// Status → Human-friendly label map
// ──────────────────────────────────────────
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

// ──────────────────────────────────────────
// Build order-status WhatsApp / Email message
// ──────────────────────────────────────────
export function buildOrderStatusMessage(
  orderNumber: string,
  status: string,
  customerName: string,
  extra?: { courierName?: string; trackingNumber?: string; trackingUrl?: string; total?: number }
): { subject: string; whatsapp: string; html: string } {
  const label = STATUS_LABELS[status] || status;
  const name = customerName || 'Customer';

  let subject = `DAISY — Your order #${orderNumber} is ${label}`;
  let whatsapp = '';
  let html = '';

  const header = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#3d2b1f;">
    <div style="text-align:center;padding:24px 0;border-bottom:1px solid #eee;">
      <h1 style="font-size:28px;letter-spacing:6px;color:#3d2b1f;margin:0;">DAISY</h1>
      <p style="font-size:11px;color:#999;letter-spacing:3px;margin:4px 0 0;">ELEGANCE THAT BLOOMS</p>
    </div>`;
  const footer = `
    <div style="text-align:center;padding:20px 0;border-top:1px solid #eee;margin-top:24px;">
      <p style="font-size:12px;color:#999;">Thank you for shopping with DAISY 🌸</p>
      <p style="font-size:11px;color:#bbb;">This is an automated notification. Do not reply to this email.</p>
    </div></div>`;

  switch (status) {
    case 'confirmed':
      whatsapp = `🌸 *DAISY — Order Confirmed!*\n\nHi ${name},\nYour order *#${orderNumber}* has been confirmed! ✅\n${extra?.total ? `\n💰 Total: ₹${extra.total.toLocaleString('en-IN')}` : ''}\n\nWe're preparing your order with love. You'll receive updates at each step.\n\nThank you for choosing DAISY! 🌷`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Confirmed! ✅</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> has been confirmed and is being prepared.</p>
          ${extra?.total ? `<p style="font-size:18px;font-weight:bold;color:#8B6914;">Total: ₹${extra.total.toLocaleString('en-IN')}</p>` : ''}
          <p>We'll send you updates at every step of the journey. 🌸</p>
        </div>${footer}`;
      break;

    case 'processing':
      whatsapp = `📦 *DAISY — Order Processing*\n\nHi ${name},\nYour order *#${orderNumber}* is now being processed! 🔄\n\nOur team is carefully picking and preparing your items.\n\nStay tuned for the next update! 🌸`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Processing 🔄</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Great news! Your order <strong>#${orderNumber}</strong> is now being processed.</p>
          <p>Our team is carefully picking and preparing your items with love.</p>
        </div>${footer}`;
      break;

    case 'packed':
      whatsapp = `🎁 *DAISY — Order Packed!*\n\nHi ${name},\nYour order *#${orderNumber}* has been packed and is ready to ship! 📦\n\nIt will be handed over to the courier soon.\n\n🌸 Thank you for your patience!`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Packed! 🎁</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> has been packed and sealed with care!</p>
          <p>It will be handed over to the courier shortly. Get ready! 📦</p>
        </div>${footer}`;
      break;

    case 'shipped':
      whatsapp = `🚚 *DAISY — Order Shipped!*\n\nHi ${name},\nYour order *#${orderNumber}* is on the way! 🎉\n${extra?.courierName ? `\n🏷️ Courier: ${extra.courierName}` : ''}${extra?.trackingNumber ? `\n📋 Tracking: ${extra.trackingNumber}` : ''}${extra?.trackingUrl ? `\n🔗 Track here: ${extra.trackingUrl}` : ''}\n\nYou'll receive a notification when your order is out for delivery.\n\n🌸 Thank you for shopping with DAISY!`;
      subject = `DAISY — Your order #${orderNumber} has been Shipped! 🚚`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Shipped! 🚚</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> is on its way to you!</p>
          ${extra?.courierName ? `<p>🏷️ <strong>Courier:</strong> ${extra.courierName}</p>` : ''}
          ${extra?.trackingNumber ? `<p>📋 <strong>Tracking Number:</strong> ${extra.trackingNumber}</p>` : ''}
          ${extra?.trackingUrl ? `<p><a href="${extra.trackingUrl}" style="display:inline-block;background:#3d2b1f;color:#fff;padding:10px 24px;text-decoration:none;font-weight:bold;margin:8px 0;">Track Your Order →</a></p>` : ''}
        </div>${footer}`;
      break;

    case 'out_for_delivery':
      whatsapp = `🏃 *DAISY — Out for Delivery!*\n\nHi ${name},\nExciting news! Your order *#${orderNumber}* is out for delivery today! 🎉\n\nPlease keep your phone accessible so our delivery partner can reach you.\n\n🌷 See you soon!`;
      subject = `DAISY — Your order #${orderNumber} is Out for Delivery! 🏃`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Out for Delivery! 🏃</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Exciting news! Your order <strong>#${orderNumber}</strong> is out for delivery today!</p>
          <p>Please keep your phone accessible so our delivery partner can reach you.</p>
          <p style="font-size:16px;">🌷 See you soon!</p>
        </div>${footer}`;
      break;

    case 'delivered':
      whatsapp = `✅ *DAISY — Order Delivered!*\n\nHi ${name},\nYour order *#${orderNumber}* has been delivered! 🎉🌸\n\nWe hope you love your purchase!\n\n⭐ We'd love to hear your feedback. Please leave a review on our website.\n\nThank you for choosing DAISY! 💛`;
      subject = `DAISY — Your order #${orderNumber} has been Delivered! 🎉`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Delivered! 🎉</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> has been delivered!</p>
          <p>We hope you love your purchase! 🌸</p>
          <div style="text-align:center;margin:20px 0;">
            <p style="font-size:16px;font-weight:bold;">⭐ Rate Your Experience</p>
            <p>We'd love to hear your feedback. Your review helps us serve you better!</p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://daisyshop.com'}/profile" 
               style="display:inline-block;background:#3d2b1f;color:#fff;padding:12px 32px;text-decoration:none;font-weight:bold;margin:8px 0;">
               Leave a Review →
            </a>
          </div>
        </div>${footer}`;
      break;

    case 'cancelled':
      whatsapp = `❌ *DAISY — Order Cancelled*\n\nHi ${name},\nYour order *#${orderNumber}* has been cancelled.\n\nIf you have any questions, please contact us on WhatsApp.\n\nWe hope to serve you again soon. 🌸`;
      subject = `DAISY — Your order #${orderNumber} has been Cancelled`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#c0392b;margin:0 0 8px;">Order Cancelled ❌</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> has been cancelled.</p>
          <p>If you have any questions or if this was unexpected, please reach out to us via WhatsApp and we'll be happy to help.</p>
        </div>${footer}`;
      break;

    case 'refunded':
      whatsapp = `💰 *DAISY — Order Refunded*\n\nHi ${name},\nYour order *#${orderNumber}* has been refunded.\n\nThe refund will be credited to your original payment method within 5-7 business days.\n\nWe hope to serve you again soon. 🌸`;
      subject = `DAISY — Refund Initiated for Order #${orderNumber}`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#8B6914;margin:0 0 8px;">Refund Initiated 💰</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>A refund has been initiated for your order <strong>#${orderNumber}</strong>.</p>
          <p>The amount will be credited to your original payment method within <strong>5-7 business days</strong>.</p>
          <p>If you have questions, please contact us on WhatsApp.</p>
        </div>${footer}`;
      break;

    default:
      whatsapp = `🌸 *DAISY — Order Update*\n\nHi ${name},\nYour order *#${orderNumber}* status is now: *${label}*.\n\nThank you for shopping with DAISY!`;
      html = `${header}
        <div style="padding:24px;">
          <h2 style="color:#3d2b1f;margin:0 0 8px;">Order Update</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your order <strong>#${orderNumber}</strong> status has been updated to: <strong>${label}</strong></p>
        </div>${footer}`;
  }

  return { subject, whatsapp, html };
}

// ──────────────────────────────────────────
// Build account notification message
// ──────────────────────────────────────────
export function buildAccountMessage(
  event: 'account_created' | 'email_changed' | 'phone_changed' | 'password_changed',
  customerName: string
): { subject: string; whatsapp: string; html: string } {
  const name = customerName || 'Customer';

  const header = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Arial,sans-serif;color:#3d2b1f;">
    <div style="text-align:center;padding:24px 0;border-bottom:1px solid #eee;">
      <h1 style="font-size:28px;letter-spacing:6px;color:#3d2b1f;margin:0;">DAISY</h1>
      <p style="font-size:11px;color:#999;letter-spacing:3px;margin:4px 0 0;">ELEGANCE THAT BLOOMS</p>
    </div>`;
  const footer = `
    <div style="text-align:center;padding:20px 0;border-top:1px solid #eee;margin-top:24px;">
      <p style="font-size:12px;color:#999;">Thank you for being a DAISY customer 🌸</p>
    </div></div>`;

  switch (event) {
    case 'account_created':
      return {
        subject: 'Welcome to DAISY! 🌸 Your account is ready',
        whatsapp: `🌸 *Welcome to DAISY!*\n\nHi ${name},\nYour account has been created successfully! 🎉\n\nExplore our latest collections and find something you'll love.\n\nHappy shopping! 💛`,
        html: `${header}
          <div style="padding:24px;">
            <h2 style="color:#3d2b1f;margin:0 0 8px;">Welcome to DAISY! 🌸</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your account has been created successfully!</p>
            <p>Start exploring our curated collections and discover pieces that bloom with elegance.</p>
            <div style="text-align:center;margin:20px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://daisyshop.com'}/collections" 
                 style="display:inline-block;background:#3d2b1f;color:#fff;padding:12px 32px;text-decoration:none;font-weight:bold;">
                 Shop Now →
              </a>
            </div>
          </div>${footer}`,
      };
    case 'email_changed':
      return {
        subject: 'DAISY — Your email has been updated',
        whatsapp: `🔒 *DAISY — Email Updated*\n\nHi ${name},\nYour email address has been changed.\n\nIf you didn't make this change, please contact us immediately.`,
        html: `${header}
          <div style="padding:24px;">
            <h2 style="color:#3d2b1f;margin:0 0 8px;">Email Updated 🔒</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your email address has been updated on your DAISY account.</p>
            <p style="color:#c0392b;"><strong>If you did not make this change, please contact us immediately.</strong></p>
          </div>${footer}`,
      };
    case 'phone_changed':
      return {
        subject: 'DAISY — Your phone number has been updated',
        whatsapp: `🔒 *DAISY — Phone Updated*\n\nHi ${name},\nYour phone number has been changed.\n\nIf you didn't make this change, please contact us immediately.`,
        html: `${header}
          <div style="padding:24px;">
            <h2 style="color:#3d2b1f;margin:0 0 8px;">Phone Number Updated 🔒</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your phone number has been updated on your DAISY account.</p>
            <p style="color:#c0392b;"><strong>If you did not make this change, please contact us immediately.</strong></p>
          </div>${footer}`,
      };
    case 'password_changed':
      return {
        subject: 'DAISY — Your password has been changed',
        whatsapp: `🔒 *DAISY — Password Changed*\n\nHi ${name},\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact us immediately.`,
        html: `${header}
          <div style="padding:24px;">
            <h2 style="color:#3d2b1f;margin:0 0 8px;">Password Changed 🔒</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your password has been changed successfully.</p>
            <p style="color:#c0392b;"><strong>If you did not make this change, please reset your password immediately or contact support.</strong></p>
          </div>${footer}`,
      };
  }
}

// ──────────────────────────────────────────
// Send WhatsApp via Twilio
// ──────────────────────────────────────────
export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[Notification] Twilio not configured — WhatsApp skipped');
    return false;
  }

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const fromWA = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    const toWA = `whatsapp:${formattedPhone}`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: toWA,
        From: fromWA,
        Body: message,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp] Twilio error:', errorData);
      return false;
    }
    console.log(`[WhatsApp] Message sent to ${formattedPhone}`);
    return true;
  } catch (err) {
    console.error('[WhatsApp] Send error:', err);
    return false;
  }
}

export async function sendSMS(phone: string, message: string): Promise<boolean> {
  // Try Twilio SMS first (proven working — same number that sends OTP)
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: fromNumber,
          Body: message,
        }).toString(),
      });

      if (response.ok) {
        console.log(`[SMS/Twilio] Text message sent to ${formattedPhone}`);
        return true;
      }
      const errorData = await response.json();
      console.error('[SMS/Twilio] Error:', errorData);
      // Fall through to MSG91
    } catch (err) {
      console.error('[SMS/Twilio] Send error:', err);
      // Fall through to MSG91
    }
  }

  // Fallback: try MSG91 if Twilio failed or not configured
  const msg91Key = process.env.MSG91_AUTH_KEY;
  if (msg91Key) {
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const formattedPhone = `91${cleanPhone}`;
      const senderId = process.env.MSG91_SENDER_ID || 'DAISY';
      const route = process.env.MSG91_ROUTE || '4';

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': msg91Key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: senderId,
          route,
          country: '91',
          sms: [{ message, to: [formattedPhone] }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[SMS/MSG91] Message sent to +91${cleanPhone}`, data);
        return true;
      }
      const text = await response.text();
      console.error('[SMS/MSG91] API Error:', text);
    } catch (err) {
      console.error('[SMS/MSG91] Send error:', err);
    }
  }

  console.warn('[Notification] All SMS providers failed — SMS skipped');
  return false;
}

// ──────────────────────────────────────────
// Build plain SMS text (short, clean, no markdown)
// WhatsApp supports *bold*, SMS does NOT — keep it plain
// ──────────────────────────────────────────
export function buildSMSText(
  orderNumber: string,
  status: string,
  customerName: string,
  extra?: { courierName?: string; trackingNumber?: string; trackingUrl?: string; total?: number }
): string {
  const label = STATUS_LABELS[status] || status;
  const name = customerName.split(' ')[0]; // First name only for SMS brevity

  switch (status) {
    case 'confirmed':
      return `Hi ${name}, your DAISY order #${orderNumber} is confirmed!${extra?.total ? ` Total: Rs.${extra.total}` : ''}. We're preparing it with love. -DAISY`;
    case 'processing':
      return `Hi ${name}, your DAISY order #${orderNumber} is being processed. Our team is picking & preparing your items. -DAISY`;
    case 'packed':
      return `Hi ${name}, your DAISY order #${orderNumber} is packed and ready to ship! Courier handover soon. -DAISY`;
    case 'shipped':
      return `Hi ${name}, your DAISY order #${orderNumber} is shipped!${extra?.courierName ? ` Courier: ${extra.courierName}.` : ''}${extra?.trackingNumber ? ` Track ID: ${extra.trackingNumber}.` : ''}${extra?.trackingUrl ? ` Track: ${extra.trackingUrl}` : ''} -DAISY`;
    case 'out_for_delivery':
      return `Hi ${name}, great news! Your DAISY order #${orderNumber} is OUT FOR DELIVERY today. Keep your phone accessible. -DAISY`;
    case 'delivered':
      return `Hi ${name}, your DAISY order #${orderNumber} has been DELIVERED! We hope you love it. Leave a review at daisyshop.com -DAISY`;
    case 'cancelled':
      return `Hi ${name}, your DAISY order #${orderNumber} has been cancelled. For queries, WhatsApp us. -DAISY`;
    case 'refunded':
      return `Hi ${name}, your DAISY order #${orderNumber} refund initiated. Credit in 5-7 business days. -DAISY`;
    default:
      return `Hi ${name}, your DAISY order #${orderNumber} status: ${label}. Thank you for shopping with DAISY!`;
  }
}

// ──────────────────────────────────────────
// Send Email via Nodemailer
// ──────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'DAISY <noreply@daisyshop.com>';

  if (!host || !user || !pass) {
    console.warn('[Notification] SMTP not configured — Email skipped');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({ from, to, subject, html });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error('[Email] Send error:', err);
    return false;
  }
}

// ──────────────────────────────────────────
// Save in-app notification to Supabase
// ──────────────────────────────────────────
export async function saveInAppNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.from('notifications').insert([{
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      channel: payload.channel || 'all',
      metadata: payload.metadata || {},
    }]);
    if (error) {
      console.error('[In-App] Save error:', error);
      return false;
    }
    console.log(`[In-App] Notification saved for user ${payload.userId}`);
    return true;
  } catch (err) {
    console.error('[In-App] Save error:', err);
    return false;
  }
}

// ──────────────────────────────────────────
// Master send function — all channels
// SMS (SIM) + Email + In-App (WhatsApp is disabled)
// ──────────────────────────────────────────
export async function sendNotification(payload: NotificationPayload): Promise<{
  whatsapp: boolean;
  sms: boolean;
  email: boolean;
  inApp: boolean;
}> {
  const results = { whatsapp: false, sms: false, email: false, inApp: false };

  // Always save in-app notification
  results.inApp = await saveInAppNotification(payload);

  // Send WhatsApp is disabled by user request (skipped)
  results.whatsapp = false;

  // Send real SIM SMS — MSG91 or Twilio Fallback
  if (payload.phone && payload.metadata?.smsText) {
    results.sms = await sendSMS(payload.phone, payload.metadata.smsText);
  }

  // Send Email if configured
  if (payload.email && payload.metadata?.emailSubject && payload.metadata?.emailHtml) {
    results.email = await sendEmail(payload.email, payload.metadata.emailSubject, payload.metadata.emailHtml);
  }

  console.log(`[Notification] Results:`, results);
  return results;
}

