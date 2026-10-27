import { NextResponse } from 'next/server';
import { registerAccount } from '@/lib/server-auth-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password } = body;

    const result = registerAccount(email, name, password);
    if (!result.success || !result.account) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed' },
        { status: 400 }
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
      { success: false, error: err.message || 'Server registration error' },
      { status: 500 }
    );
  }
}
