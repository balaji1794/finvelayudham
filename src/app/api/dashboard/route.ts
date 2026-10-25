import { NextResponse } from 'next/server';
import { INITIAL_ASSETS, INITIAL_LIABILITIES, INITIAL_SNAPSHOTS, INITIAL_TRANSACTIONS } from '@/lib/mock-data';

export async function GET() {
  const totalAssets = INITIAL_ASSETS.reduce((sum, a) => sum + a.currentValue, 0);
  const totalLiabilities = INITIAL_LIABILITIES.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

  return NextResponse.json({
    netWorth,
    totalAssets,
    totalLiabilities,
    baseCurrency: 'INR',
    assetsCount: INITIAL_ASSETS.length,
    liabilitiesCount: INITIAL_LIABILITIES.length,
    snapshots: INITIAL_SNAPSHOTS,
    transactions: INITIAL_TRANSACTIONS,
  });
}
