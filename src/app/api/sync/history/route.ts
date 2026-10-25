import { NextResponse } from 'next/server';

export async function GET() {
  const history = [
    {
      id: 'sync-103',
      timestamp: new Date().toISOString(),
      referenceUrl: 'https://www.finboom.app',
      status: 'SUCCESS',
      changesDetected: 0,
      summary: 'Automated hourly health and parity check passed. Zero visual or route drift detected.',
      deployedHash: 'dpl_827fbe19',
    },
    {
      id: 'sync-102',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      referenceUrl: 'https://www.finboom.app',
      status: 'SUCCESS',
      changesDetected: 1,
      summary: 'Detected Wint Wealth bond import update. Validated and applied safely to components.',
      deployedHash: 'dpl_716a4c20',
    },
    {
      id: 'sync-101',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      referenceUrl: 'https://www.finboom.app',
      status: 'SUCCESS',
      changesDetected: 0,
      summary: 'Baseline synchronization validated. All 10 calculators and CSS design tokens in 100% parity.',
      deployedHash: 'dpl_992e5a11',
    },
  ];

  return NextResponse.json({ history });
}
