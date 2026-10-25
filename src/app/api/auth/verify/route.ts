import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Temporary store for verification codes (15 minute expiration)
interface VerificationRecord {
  code: string;
  name: string;
  expiresAt: number;
}

const verificationStore = new Map<string, VerificationRecord>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, code, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // -------------------------------------------------------------
    // ACTION 1: SEND VERIFICATION CODE
    // -------------------------------------------------------------
    if (action === 'send-code') {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
      const userName = name || 'Valued Member';

      verificationStore.set(cleanEmail, {
        code: generatedCode,
        name: userName,
        expiresAt,
      });

      const resendApiKey = process.env.RESEND_API_KEY;
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '465');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const fromEmail = process.env.EMAIL_FROM || (smtpUser ? `FinVelayudham <${smtpUser}>` : 'FinVelayudham <onboarding@resend.dev>');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://finvelayudham.vercel.app';

      const emailSubject = `${generatedCode} is your FinVelayudham confirmation code`;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f8; margin: 0; padding: 24px; color: #1c1c1c; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .brand { font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #15803d; text-decoration: none; }
    .badge { display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-top: 8px; text-transform: uppercase; }
    h1 { font-size: 20px; font-weight: 700; margin-top: 20px; color: #0f172a; }
    p { font-size: 14px; line-height: 1.6; color: #475569; }
    .code-box { background: #f0fdf4; border: 2px dashed #166534; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: monospace; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align: center;">
      <a href="${appUrl}" class="brand">FinVelayudham.</a><br/>
      <span class="badge">Email Verification</span>
    </div>

    <h1>Hello ${userName},</h1>
    <p>Please confirm your email address to unlock your private FinVelayudham wealth vault.</p>

    <div class="code-box">
      <div style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: #166534; margin-bottom: 6px;">Your 6-Digit Confirmation Code</div>
      <div class="otp-code">${generatedCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Expires in 15 minutes</div>
    </div>

    <p style="font-size: 12px; color: #64748b;">
      If you did not request this email, no further action is required. Your account will not be created without this code.
    </p>

    <div class="footer">
      FinVelayudham Platform · Zero Broker Credentials Required<br/>
      <a href="${appUrl}/privacy" style="color: #64748b;">Privacy Policy</a> · 
      <a href="${appUrl}/terms" style="color: #64748b;">Terms of Service</a>
    </div>
  </div>
</body>
</html>
      `;

      let delivered = false;
      let deliveredTo = cleanEmail;

      // Try Resend
      if (resendApiKey) {
        try {
          const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [cleanEmail],
              subject: emailSubject,
              html: emailHtml,
            }),
          });

          if (resendRes.ok) {
            delivered = true;
          } else {
            const errJson = await resendRes.json().catch(() => null);
            // Catch Resend testing sandbox restriction
            if (errJson && errJson.message && errJson.message.includes('You can only send testing emails to your own email address')) {
              const match = errJson.message.match(/\(([^)]+)\)/);
              const allowedEmail = match ? match[1] : 'balajibuddy1794@gmail.com';
              deliveredTo = allowedEmail;

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: [allowedEmail],
                  subject: `[Sandbox Relay for ${cleanEmail}] ${emailSubject}`,
                  html: `
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; font-size: 12px; color: #92400e;">
                      <strong>Resend Testing Mode Relay:</strong> Verification code generated for <strong>${cleanEmail}</strong> (${userName}). Delivered to verified owner (<strong>${allowedEmail}</strong>).
                    </div>
                    ${emailHtml}
                  `,
                }),
              });
              delivered = true;
            }
          }
        } catch (err) {
          console.error('Resend verify dispatch error:', err);
        }
      }

      // Try SMTP if credentials exist
      if (!delivered && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          await transporter.sendMail({
            from: fromEmail,
            to: cleanEmail,
            subject: emailSubject,
            html: emailHtml,
          });
          delivered = true;
          deliveredTo = cleanEmail;
        } catch (err) {
          console.error('SMTP verify dispatch error:', err);
        }
      }

      console.log(`[FinVelayudham Auth] Verification Code for ${cleanEmail}: ${generatedCode}`);

      return NextResponse.json({
        success: true,
        delivered,
        deliveredTo,
        sandboxCode: generatedCode, // Provided for instant sandbox testing
        message: `Verification code dispatched to ${deliveredTo}`,
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: CONFIRM VERIFICATION CODE
    // -------------------------------------------------------------
    if (action === 'confirm-code') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const record = verificationStore.get(cleanEmail);

      // Check if code matches (also accept master bypass code for testing if needed)
      if (!record) {
        return NextResponse.json({ error: 'Verification code expired or not found. Please request a new one.' }, { status: 400 });
      }

      if (Date.now() > record.expiresAt) {
        verificationStore.delete(cleanEmail);
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
      }

      if (record.code !== code.trim()) {
        return NextResponse.json({ error: 'Incorrect confirmation code. Please check your email and try again.' }, { status: 400 });
      }

      // Validated successfully! Remove record
      verificationStore.delete(cleanEmail);

      return NextResponse.json({
        success: true,
        verified: true,
        email: cleanEmail,
        message: 'Email confirmed successfully! Account unlocked.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('verify route error:', err);
    return NextResponse.json({ error: err.message || 'Verification service error' }, { status: 500 });
  }
}
