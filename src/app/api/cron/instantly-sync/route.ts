import { NextRequest, NextResponse } from 'next/server';
import { runInstantlySync } from '@/lib/instantly-sync';

// Fluid Compute is on for this project, which allows up to 300s on Hobby — this ran in
// ~33s locally, but Vercel's network path to Instantly/Supabase may differ, so leaving
// real headroom rather than cutting it close at 60s.
export const maxDuration = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await runInstantlySync();
    return NextResponse.json(result);
  } catch (err) {
    console.error('Instantly sync failed:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'sync failed' }, { status: 500 });
  }
}
