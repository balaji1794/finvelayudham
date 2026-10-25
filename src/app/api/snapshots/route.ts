import { NextResponse } from 'next/server';
import { INITIAL_SNAPSHOTS } from '@/lib/mock-data';

let snapshotsStore = [...INITIAL_SNAPSHOTS];

export async function GET() {
  return NextResponse.json({ snapshots: snapshotsStore });
}

export async function POST(req: Request) {
  try {
    const snap = await req.json();
    const newSnap = {
      id: snap.id || `s-${Date.now()}`,
      takenAt: snap.takenAt || new Date().toISOString(),
      baseCurrency: snap.baseCurrency || 'INR',
      ...snap,
    };
    snapshotsStore = [...snapshotsStore, newSnap];
    return NextResponse.json({ success: true, snapshot: newSnap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
