import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

interface VerificationRecord {
  code: string;
  name: string;
  expiresAt: number;
}

const verificationStore = new Map<string, VerificationRecord>();

function signVerification(email: string, code: string, expiresAt: number): string {
  const secret = process.env.VERIFY_SECRET || 'finvelayudham_verify_hmac_secret_2026';
  return crypto.createHmac('sha256', secret).update(`${email.trim().toLowerCase()}:${code.trim()}:${expiresAt}`).digest('hex');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, code, name, verifyToken, type = 'register' } = body;

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
      const isLogin = type === 'login';

      // In-memory cache
      verificationStore.set(cleanEmail, {
        code: generatedCode,
        name: userName,
        expiresAt,
      });

      // Stateless cryptographic signature for Vercel multi-worker resilience
      const sig = signVerification(cleanEmail, generatedCode, expiresAt);
      const token = `${expiresAt}.${sig}`;

      const resendApiKey = process.env.RESEND_API_KEY;
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '465');
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const fromEmail = process.env.EMAIL_FROM || (smtpUser ? `FinVelayudham <${smtpUser}>` : 'FinVelayudham <onboarding@resend.dev>');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://finvelayudham.vercel.app';

      const emailSubject = isLogin
        ? `${generatedCode} is your FinVelayudham login security code`
        : `${generatedCode} is your FinVelayudham confirmation code`;

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
      <span class="badge">${isLogin ? 'Security Verification' : 'Email Verification'}</span>
    </div>

    <h1>Hello ${userName},</h1>
    <p>${isLogin
      ? 'A sign-in attempt was initiated for your FinVelayudham account from a new browser or device. Use the verification code below to complete your sign-in.'
      : 'Please confirm your email address to unlock your private FinVelayudham wealth vault.'}</p>

    <div class="code-box">
      <div style="font-size: 12px; text-transform: uppercase; font-weight: 600; color: #166534; margin-bottom: 6px;">Your 6-Digit ${isLogin ? 'Security' : 'Confirmation'} Code</div>
      <div class="otp-code">${generatedCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Expires in 15 minutes</div>
    </div>

    <p style="font-size: 12px; color: #64748b;">
      ${isLogin
        ? 'If you did not initiate this sign-in attempt, someone may have entered your email. Since your password was verified, consider changing your password in Settings.'
        : 'If you did not request this email, no further action is required. Your account will not be created without this code.'}
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
      let dispatchLog = '';

      // 1. Try Resend Direct
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

          const resendData = await resendRes.json().catch(() => ({}));

          if (resendRes.ok && resendData.id) {
            delivered = true;
            deliveredTo = cleanEmail;
            dispatchLog = `Direct Resend delivery to ${cleanEmail} (ID: ${resendData.id})`;
          } else {
            dispatchLog = `Direct Resend failed: ${resendRes.status} ${JSON.stringify(resendData)}`;
            console.warn('[FinVelayudham Auth]', dispatchLog);
          }
        } catch (err: any) {
          dispatchLog = `Resend exception: ${err.message}`;
          console.error('Resend verify dispatch error:', err);
        }
      }

      // 2. If not delivered and SMTP is configured, send via SMTP directly to the actual recipient
      if (!delivered && smtpUser && smtpPass) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass },
          });

          const info = await transporter.sendMail({
            from: smtpUser ? `FinVelayudham <${smtpUser}>` : fromEmail,
            to: cleanEmail,
            subject: emailSubject,
            html: emailHtml,
          });
          delivered = true;
          deliveredTo = cleanEmail;
          dispatchLog = `Delivered via SMTP to ${cleanEmail} (ID: ${info.messageId})`;
          console.log(`[FinVelayudham Auth] Verification code successfully delivered to ${cleanEmail} via SMTP`);
        } catch (err: any) {
          dispatchLog += ` | SMTP error: ${err.message}`;
          console.error('SMTP verify dispatch error:', err);
        }
      }

      // 3. Fallback: If still not delivered and Resend is available in sandbox mode, relay to the account owner
      if (!delivered && resendApiKey) {
        try {
          const allowedEmail = 'balajibuddy1794@gmail.com';

          const relayRes = await fetch('https://api.resend.com/emails', {
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

          const relayData = await relayRes.json().catch(() => ({}));
          if (relayRes.ok && relayData.id) {
            delivered = true;
            deliveredTo = allowedEmail;
            dispatchLog += ` | Relayed via Resend to ${allowedEmail} (ID: ${relayData.id})`;
          } else {
            dispatchLog += ` | Relay failed: ${relayRes.status} ${JSON.stringify(relayData)}`;
          }
        } catch (relayErr: any) {
          dispatchLog += ` | Relay error: ${relayErr.message}`;
          console.error('Resend sandbox relay error:', relayErr);
        }
      }

      console.log(`[FinVelayudham Auth] Verification Code for ${cleanEmail}: ${generatedCode} (${dispatchLog})`);

      const response = NextResponse.json({
        success: true,
        delivered,
        deliveredTo,
        dispatchLog,
        token,
        sandboxCode: generatedCode,
        message: delivered
          ? `Verification code dispatched to ${deliveredTo}`
          : `Code generated: ${generatedCode} (Email service offline/restricted)`,
      });

      // Also set secure verification cookie
      response.cookies.set('finvelayudham_verify_pending', `${cleanEmail}:${generatedCode}:${expiresAt}:${sig}`, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 900,
        path: '/',
      });

      return response;
    }

    // -------------------------------------------------------------
    // ACTION 2: CONFIRM VERIFICATION CODE
    // -------------------------------------------------------------
    if (action === 'confirm-code') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      const inputCode = code.trim();
      let isValid = false;

      // Check 1: In-memory store
      const record = verificationStore.get(cleanEmail);
      if (record && record.code === inputCode && Date.now() <= record.expiresAt) {
        isValid = true;
        verificationStore.delete(cleanEmail);
      }

      // Check 2: Token verification passed from client or cookie
      if (!isValid && verifyToken && verifyToken.includes('.')) {
        const [expStr, sig] = verifyToken.split('.');
        const expNum = parseInt(expStr);
        if (Date.now() <= expNum) {
          const expectedSig = signVerification(cleanEmail, inputCode, expNum);
          if (expectedSig === sig) {
            isValid = true;
          }
        }
      }

      // Check 3: Cookie validation
      if (!isValid) {
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/finvelayudham_verify_pending=([^;]+)/);
        if (match) {
          const cookieVal = decodeURIComponent(match[1]);
          const [cEmail, cCode, cExp, cSig] = cookieVal.split(':');
          if (cEmail === cleanEmail && cCode === inputCode && Date.now() <= parseInt(cExp)) {
            const expectedSig = signVerification(cleanEmail, inputCode, parseInt(cExp));
            if (expectedSig === cSig) {
              isValid = true;
            }
          }
        }
      }

      if (!isValid) {
        return NextResponse.json(
          { error: 'Incorrect or expired confirmation code. Please check your email and try again.' },
          { status: 400 }
        );
      }

      const response = NextResponse.json({
        success: true,
        verified: true,
        email: cleanEmail,
        message: 'Email confirmed successfully! Account unlocked.',
      });

      // Clear pending verification cookie
      response.cookies.set('finvelayudham_verify_pending', '', {
        maxAge: 0,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('verify route error:', err);
    return NextResponse.json({ error: err.message || 'Verification service error' }, { status: 500 });
  }
}
