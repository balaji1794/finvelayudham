import { NextResponse } from 'next/server';
import { INITIAL_LIABILITIES } from '@/lib/mock-data';

let liabilitiesStore = [...INITIAL_LIABILITIES];

export async function GET() {
  return NextResponse.json({ liabilities: liabilitiesStore });
}

export async function POST(req: Request) {
  try {
    const liab = await req.json();
    if (!liab.name || !liab.outstandingAmount) {
      return NextResponse.json({ error: 'Name and outstandingAmount are required' }, { status: 400 });
    }
    const newLiab = {
      id: liab.id || `liab-${Date.now()}`,
      ...liab,
    };
    liabilitiesStore = [newLiab, ...liabilitiesStore];
    return NextResponse.json({ success: true, liability: newLiab });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
