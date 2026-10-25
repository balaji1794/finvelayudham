import { NextResponse } from 'next/server';
import { INITIAL_ASSETS } from '@/lib/mock-data';

let assetsStore = [...INITIAL_ASSETS];

export async function GET() {
  return NextResponse.json({ assets: assetsStore });
}

export async function POST(req: Request) {
  try {
    const asset = await req.json();
    if (!asset.name || !asset.currentValue) {
      return NextResponse.json({ error: 'Name and currentValue are required' }, { status: 400 });
    }
    const newAsset = {
      id: asset.id || `asset-${Date.now()}`,
      ...asset,
    };
    assetsStore = [newAsset, ...assetsStore];
    return NextResponse.json({ success: true, asset: newAsset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
