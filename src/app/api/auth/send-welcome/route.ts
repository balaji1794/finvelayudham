import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, name, type = 'welcome' } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const userName = name || 'Valued Member';
    const isRegister = type === 'welcome';
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const fromEmail = process.env.EMAIL_FROM || (smtpUser ? `FinVelayudham <${smtpUser}>` : 'FinVelayudham <onboarding@resend.dev>');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://finvelayudham.vercel.app';

    const emailSubject = isRegister
      ? 'Welcome to FinVelayudham · Your 100% Free Financial Dashboard'
      : 'FinVelayudham · Sign-in Confirmation';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f8; margin: 0; padding: 24px; color: #1c1c1c; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .brand { font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #15803d; text-decoration: none; }
    .badge { display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-top: 8px; text-transform: uppercase; }
    h1 { font-size: 20px; font-weight: 700; margin-top: 20px; color: #0f172a; }
    p { font-size: 14px; line-height: 1.6; color: #475569; }
    .features { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .features li { font-size: 13px; color: #334155; margin-bottom: 8px; }
    .button { display: inline-block; background-color: #166534; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="text-align: center;">
      <a href="${appUrl}" class="brand">FinVelayudham.</a><br/>
      <span class="badge">100% Free · Unlimited Platform</span>
    </div>

    <h1>Hello ${userName},</h1>
    <p>
      ${
        isRegister
          ? 'Welcome to FinVelayudham! Your personal wealth and net worth tracking account is ready. No bank logins, no passwords to link, and zero fees—ever.'
          : 'You successfully signed into your FinVelayudham wealth tracker. Here is your sign-in receipt.'
      }
    </p>

    <div class="features">
      <strong style="font-size: 13px; color: #0f172a;">What is ready in your account:</strong>
      <ul style="padding-left: 20px; margin-top: 8px;">
        <li><strong>Consolidated Wealth Dashboard:</strong> Track Mutual Funds, EPF, PPF, Stocks, Real Estate, and Gold.</li>
        <li><strong>Multi-Currency:</strong> Real-time FX conversion across 45+ global currencies.</li>
        <li><strong>10 Financial Calculators:</strong> SIP with step-up, XIRR solver, EMI, Retirement Corpus, and CAGR.</li>
        <li><strong>Zero Limits:</strong> Unlimited assets, unlimited liabilities, and complete data privacy.</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${appUrl}/dashboard" class="button">Access My Wealth Vault</a>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
      Account email: <strong>${email}</strong><br/>
      Date: ${new Date().toUTCString()}
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

    // 1. Dispatch via Resend API if API Key is configured in environment
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
            to: [email],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (resendRes.ok) {
          const data = await resendRes.json();
          return NextResponse.json({
            success: true,
            delivered: true,
            provider: 'resend',
            id: data.id,
            message: `Confirmation email dispatched to ${email}`,
          });
        }

        // Handle Resend Validation Errors (e.g. 403 testing mode limitation)
        const errJson = await resendRes.json().catch(() => null);
        console.error('Resend API error:', errJson);

        // If SMTP credentials are configured, try sending directly to the recipient via SMTP
        if (smtpUser && smtpPass) {
          try {
            const transporter = nodemailer.createTransport({
              host: smtpHost,
              port: smtpPort,
              secure: smtpPort === 465,
              auth: { user: smtpUser, pass: smtpPass },
            });

            const smtpInfo = await transporter.sendMail({
              from: smtpUser ? `FinVelayudham <${smtpUser}>` : fromEmail,
              to: email,
              subject: emailSubject,
              html: emailHtml,
            });

            return NextResponse.json({
              success: true,
              delivered: true,
              provider: 'smtp',
              id: smtpInfo.messageId,
              message: `Welcome email delivered directly to ${email} via SMTP`,
            });
          } catch (smtpErr) {
            console.error('SMTP fallback failed:', smtpErr);
          }
        }

        if (errJson && errJson.message && errJson.message.includes('You can only send testing emails to your own email address')) {
          const match = errJson.message.match(/\(([^)]+)\)/);
          const allowedEmail = match ? match[1] : 'balajibuddy1794@gmail.com';

          // Resend allows sending to the account owner's email address in testing mode
          const retryRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [allowedEmail],
              subject: `[Sandbox Relay for ${email}] ${emailSubject}`,
              html: `
                <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-family: sans-serif; font-size: 13px; color: #92400e;">
                  <strong>⚠️ Resend Testing Sandbox Relay:</strong><br/>
                  This email was generated for <strong>${email}</strong> (${userName}).<br/>
                  Because Resend's free tier with <code>onboarding@resend.dev</code> only permits sending to your registered owner email (<strong>${allowedEmail}</strong>), it was delivered here.<br/><br/>
                  <em>To send directly to ${email} or external recipients: verify your custom domain in Resend, or configure Gmail SMTP (SMTP_USER + SMTP_PASS) in Vercel.</em>
                </div>
                ${emailHtml}
              `,
            }),
          });

          if (retryRes.ok) {
            const retryData = await retryRes.json();
            return NextResponse.json({
              success: true,
              delivered: true,
              sandboxRelayed: true,
              deliveredTo: allowedEmail,
              originalRecipient: email,
              provider: 'resend-sandbox-relay',
              id: retryData.id,
              message: `Delivered to verified Resend account (${allowedEmail}) via sandbox relay for ${email}. Check your Gmail inbox!`,
            });
          }
        }
      } catch (err: any) {
        console.error('Resend network error:', err);
      }
    }

    // 2. Dispatch via SMTP / Gmail if credentials configured
    if (smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: fromEmail,
          to: email,
          subject: emailSubject,
          html: emailHtml,
        });

        return NextResponse.json({
          success: true,
          delivered: true,
          provider: 'smtp',
          messageId: info.messageId,
          message: `Confirmation email dispatched via SMTP to ${email}`,
        });
      } catch (err: any) {
        console.error('SMTP transmission error:', err);
      }
    }

    // 3. Informational / In-App Delivery Mode:
    // When no external relay (Resend / SMTP) has been configured in Vercel environment variables yet
    console.log(
      `[FinVelayudham Auth] Prepared ${isRegister ? 'welcome' : 'login'} email for: ${email} (${userName})`
    );

    return NextResponse.json({
      success: true,
      delivered: false,
      simulated: true,
      emailSentTo: email,
      subject: emailSubject,
      previewHtml: emailHtml,
      message: `Account activated for ${email}. To deliver live emails to ${email}, please add your custom domain to Resend or configure Gmail SMTP in Vercel.`,
    });
  } catch (error: any) {
    console.error('send-welcome API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
