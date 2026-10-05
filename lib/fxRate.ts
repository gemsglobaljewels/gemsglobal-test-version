import { supabaseServer } from '@/lib/supabaseServer'

// Single source of truth for USD -> INR.
//
// 1. If the admin fixed a rate in Settings (site_settings.usd_inr_rate),
//    EVERYTHING (storefront, admin, checkout) uses it.
// 2. Otherwise the live market rate is used (cached 4h in-memory).

let fixedCache: { rate: number; at: number } | null = null
let liveCachedRate: number | null = null
let liveLastFetch = 0

async function getFixedRate(): Promise<number | null> {
  const now = Date.now()
  if (fixedCache && now - fixedCache.at < 60_000) return fixedCache.rate
  try {
    const { data, error } = await supabaseServer
      .from('site_settings')
      .select('value')
      .eq('key', 'usd_inr_rate')
      .maybeSingle()
    const v = Number((data as any)?.value)
    if (!error && isFinite(v) && v > 0) {
      fixedCache = { rate: v, at: now }
      return v
    }
  } catch {
    /* fall through to live rate */
  }
  return null
}

async function getLiveRate(): Promise<number> {
  const now = Date.now()
  if (liveCachedRate && now - liveLastFetch < 4 * 60 * 60 * 1000) {
    return liveCachedRate
  }
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    })
    if (!response.ok) throw new Error('Failed to fetch exchange rate')
    const data = await response.json()
    const rate = Number(data?.rates?.INR)
    if (!isFinite(rate) || rate <= 0) throw new Error('INR rate not found in API response')
    liveCachedRate = rate
    liveLastFetch = now
    return rate
  } catch (error) {
    console.error('[fxRate] live fetch failed:', error)
    return liveCachedRate || 83
  }
}

export async function getUsdInrRate(liveOnly = false): Promise<{ rate: number; fixed: boolean }> {
  if (!liveOnly) {
    const fixed = await getFixedRate()
    if (fixed !== null) return { rate: fixed, fixed: true }
  }
  return { rate: await getLiveRate(), fixed: false }
}
