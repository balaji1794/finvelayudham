import { NextResponse } from 'next/server';
import { verifyCredentials, saveAccount, hashPassword } from '@/lib/server-auth-store';
import { deriveUserIdFromEmail } from '@/lib/portfolio-vault';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const result = verifyCredentials(cleanEmail, password);

    if (!result.success || !result.account) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.account.id,
        email: result.account.email,
        name: result.account.name,
        createdAt: result.account.createdAt,
        isVerified: result.account.isVerified,
      },
    });

    response.cookies.set('finvelayudham_session', encodeURIComponent(result.account.email), {
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Login verification error' },
      { status: 500 }
    );
  }
}
