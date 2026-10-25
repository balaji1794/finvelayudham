import { NextResponse } from 'next/server';
import { INITIAL_TRANSACTIONS } from '@/lib/mock-data';

let transactionsStore = [...INITIAL_TRANSACTIONS];

export async function GET() {
  return NextResponse.json({ transactions: transactionsStore });
}

export async function POST(req: Request) {
  try {
    const tx = await req.json();
    if (!tx.amountBase || !tx.type) {
      return NextResponse.json({ error: 'Type and amountBase are required' }, { status: 400 });
    }
    const newTx = {
      id: tx.id || `tx-${Date.now()}`,
      date: tx.date || new Date().toISOString().slice(0, 10),
      ...tx,
    };
    transactionsStore = [newTx, ...transactionsStore];
    return NextResponse.json({ success: true, transaction: newTx });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
