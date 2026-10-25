import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, name, type = 'welcome' } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const userName = name || 'Valued Member';
    const isRegister = type === 'welcome';
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'FinVelayudham <onboarding@resend.dev>';
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
      <a href="${appUrl}/demo" class="button">Access My Wealth Dashboard</a>
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

    // 1. Try sending via Resend API if API Key is configured in environment
    if (resendApiKey) {
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
      } else {
        const errText = await resendRes.text();
        console.error('Resend API failed:', errText);
        // Fall through to simulate/inform mode
      }
    }

    // 2. Fallback / Configuration Guide Mode:
    // When RESEND_API_KEY is not yet in Vercel environment variables
    console.log(
      `[FinVelayudham Auth] Prepared ${isRegister ? 'welcome' : 'login'} email for: ${email} (${userName})`
    );

    return NextResponse.json({
      success: true,
      delivered: false,
      simulated: true,
      emailSentTo: email,
      message: `Account activated for ${email}. To deliver live emails to your external inbox, add your RESEND_API_KEY in Vercel Environment Variables.`,
    });
  } catch (error: any) {
    console.error('send-welcome API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch email' },
      { status: 500 }
    );
  }
}
