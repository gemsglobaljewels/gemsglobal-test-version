// Shared admin FX resolver: the server (/api/exchange-rate) is the single
// source of truth (admin fixed rate if set, else live market). Falls back to
// the per-browser stored rate, then 83.
let cached: number | null = null;

export async function resolveAdminFxRate(): Promise<number> {
  if (cached !== null && isFinite(cached) && cached > 0) return cached;
  try {
    const data = await fetch('/api/exchange-rate', { cache: 'no-store' }).then((r) => r.json());
    const v = Number(data?.rate);
    if (isFinite(v) && v > 0) {
      cached = v;
      try {
        localStorage.setItem('admin_fx_rate', String(v));
      } catch {
        /* ignore */
      }
      return v;
    }
  } catch {
    /* fall through to stored rate */
  }
  const fb = Number(
    typeof window !== 'undefined' ? localStorage.getItem('admin_fx_rate') : '83'
  );
  cached = isFinite(fb) && fb > 0 ? fb : 83;
  return cached;
}

export function clearAdminFxCache() {
  cached = null;
}
