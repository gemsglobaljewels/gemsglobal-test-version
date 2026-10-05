import { NextRequest, NextResponse } from 'next/server';
import { getUsdInrRate } from '@/lib/fxRate';

export async function GET(request: NextRequest) {
  // ?live=1 forces the live market rate (used by Settings to display it
  // even while a fixed admin rate is active).
  const liveOnly =
    request.nextUrl.searchParams.get('live') === '1' ||
    request.nextUrl.searchParams.get('source') === 'live';
  const { rate, fixed } = await getUsdInrRate(liveOnly);
  return NextResponse.json({ rate, fixed });
}
