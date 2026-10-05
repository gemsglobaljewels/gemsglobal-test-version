
import { NextResponse } from 'next/server';
import { getUsdInrRate } from '@/lib/fxRate';

export const dynamic = 'force-dynamic';

const API_KEY = process.env.CURRENCY_FREAKS_API_KEY || 'YOUR_APIKEY';
const API_URL = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${API_KEY}&symbols=INR`;

export async function GET() {
  // Prefer the single source of truth (admin fixed rate, else live market).
  try {
    const pref = await getUsdInrRate();
    if (pref && isFinite(pref.rate) && pref.rate > 0) {
      return NextResponse.json({ rate: pref.rate, fixed: pref.fixed });
    }
  } catch { /* fall through to providers below */ }
  try {
    let rate: number | null = null;
    if (API_KEY && API_KEY !== 'YOUR_APIKEY') {
      const response = await fetch(API_URL, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        const r = Number(data?.rates?.INR);
        if (Number.isFinite(r) && r > 0) rate = r;
      }
    }
    if (!rate) {
      const alt = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=INR', { cache: 'no-store' });
      if (alt.ok) {
        const data = await alt.json();
        const r = Number(data?.rates?.INR);
        if (Number.isFinite(r) && r > 0) rate = r;
      }
    }

    if (!rate) {
      throw new Error('INR rate not found in response');
    }

    return NextResponse.json({ rate });
  } catch (error) {
    console.error('Currency API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
  }
}
