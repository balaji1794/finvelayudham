import { NextResponse } from 'next/server';
import { updateAccount } from '@/lib/server-auth-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentEmail, name, newEmail, newPassword } = body;

    if (!currentEmail) {
      return NextResponse.json(
        { success: false, error: 'Current email is required.' },
        { status: 400 }
      );
    }

    const result = updateAccount(currentEmail, { name, newEmail, newPassword });
    if (!result.success || !result.account) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update profile' },
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
      { success: false, error: err.message || 'Profile update server error' },
      { status: 500 }
    );
  }
}
