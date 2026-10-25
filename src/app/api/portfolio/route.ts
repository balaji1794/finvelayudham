import { NextResponse } from 'next/server';

// Server-side persistent storage mapped per user ID
// In production with Supabase/PostgreSQL, this points to encrypted table rows
const userVaultStore = new Map<string, { userId: string; email: string; payload: string; updatedAt: string }>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    const record = userVaultStore.get(userId);
    if (!record) {
      return NextResponse.json({ found: false, portfolio: null }, { status: 200 });
    }

    return NextResponse.json({
      found: true,
      userId: record.userId,
      payload: record.payload,
      updatedAt: record.updatedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server vault error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, payload, updatedAt } = body;

    if (!userId || !payload) {
      return NextResponse.json({ error: 'Invalid payload: userId and encrypted data required' }, { status: 400 });
    }

    userVaultStore.set(userId, {
      userId,
      email: email || '',
      payload,
      updatedAt: updatedAt || new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Vault securely synchronized',
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save vault' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identifier required' }, { status: 400 });
    }

    userVaultStore.delete(userId);

    return NextResponse.json({
      success: true,
      message: 'User vault permanently purged',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to purge vault' }, { status: 500 });
  }
}
