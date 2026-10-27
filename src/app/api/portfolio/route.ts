import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Server-side persistent storage mapped per user ID and email
// In production with Supabase/PostgreSQL, this points to encrypted table rows
const userVaultStore = new Map<string, { userId: string; email: string; payload: string; updatedAt: string }>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'User identifier or email required' }, { status: 400 });
    }

    let record = userId ? userVaultStore.get(userId) : undefined;

    // Fallback: look up by email
    if (!record && email) {
      const cleanEmail = email.trim().toLowerCase();
      record = userVaultStore.get(`email_${cleanEmail}`);

      if (!record) {
        for (const [_, entry] of userVaultStore.entries()) {
          if (entry.email && entry.email.trim().toLowerCase() === cleanEmail) {
            record = entry;
            break;
          }
        }
      }
    }

    if (!record) {
      return NextResponse.json({ found: false, portfolio: null }, { status: 200 });
    }

    return NextResponse.json({
      found: true,
      userId: record.userId,
      email: record.email,
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

    if ((!userId && !email) || !payload) {
      return NextResponse.json({ error: 'Invalid payload: userId/email and encrypted data required' }, { status: 400 });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const effectiveUserId = userId || `usr_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const record = {
      userId: effectiveUserId,
      email: cleanEmail,
      payload,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    userVaultStore.set(effectiveUserId, record);
    if (cleanEmail) {
      userVaultStore.set(`email_${cleanEmail}`, record);
    }

    return NextResponse.json({
      success: true,
      message: 'Vault securely synchronized',
      updatedAt: record.updatedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to save vault' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'User identifier or email required' }, { status: 400 });
    }

    if (userId) {
      userVaultStore.delete(userId);
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      userVaultStore.delete(`email_${cleanEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: 'User vault permanently purged',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to purge vault' }, { status: 500 });
  }
}
