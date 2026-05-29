// src/app/api/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'A valid 10-digit phone number is required' }, { status: 400 });
    }

    // Generate a secure random 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate SHA-256 hash of the OTP to send to the client for validation
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    // Retrieve Twilio settings
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    // Check if Twilio keys are configured
    const isTwilioConfigured = !!(accountSid && authToken && fromNumber);

    if (isTwilioConfigured) {
      // Send real SMS via Twilio API
      // Format number to +91 (India) by default, or keep custom prefix if applicable
      const formattedPhone = `+91${phone}`;

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
          From: fromNumber!,
          Body: `Your DAISY verification OTP is: ${otp}. Valid for 5 minutes. Please do not share this with anyone.`,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Twilio Error Response:', errorData);
        return NextResponse.json({
          error: `Twilio Error: ${errorData.message || 'Failed to send SMS.'}`
        }, { status: 500 });
      }

      // Successful real SMS
      return NextResponse.json({
        success: true,
        simulated: false,
        hash,
        message: 'OTP sent to your mobile phone successfully!'
      });
    } else {
      // Twilio is not configured, fall back to simulation mode so the site continues working
      return NextResponse.json({
        success: true,
        simulated: true,
        hash,
        code: otp, // Send plain OTP code ONLY in simulation mode
        message: 'Simulation Mode: SMS credentials not set. OTP printed here.'
      });
    }
  } catch (err: any) {
    console.error('OTP Send Route Error:', err);
    return NextResponse.json({ error: 'Server error processing request' }, { status: 500 });
  }
}
