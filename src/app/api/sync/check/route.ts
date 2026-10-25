import { NextResponse } from 'next/server';
import { checkReferenceSite } from '@/lib/sync-engine';

export async function GET() {
  try {
    const report = await checkReferenceSite('https://www.finboom.app');
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Sync check failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const referenceUrl = body.referenceUrl || 'https://www.finboom.app';
    const report = await checkReferenceSite(referenceUrl);
    return NextResponse.json({
      success: true,
      appliedAt: new Date().toISOString(),
      report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Trigger failed' },
      { status: 500 }
    );
  }
}
