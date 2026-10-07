import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

/* ─── Instant storefront refresh after admin saves ──────────────────────────
   Problem: ISR pages (home 60s, collection 300s, PDP 300s) kept serving stale
   HTML after an admin save, so new sliders/products needed 3–4 refreshes.
   Fix: every admin mutation calls refreshStorefront(), which
     1. marks the affected paths stale via revalidatePath, and
     2. warms them (fetches the public pages server-side AFTER responding,
        via after()) so the VERY NEXT load — a single refresh — is fresh.
   Call it AFTER a successful DB write, never before. Failures are swallowed:
   a missed warm only means one extra refresh, never a failed save.
───────────────────────────────────────────────────────────────────────────── */

function siteBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
  ]
  for (const c of candidates) {
    if (c && !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(c)) return c.replace(/\/+$/, '')
  }
  // NOTE: vercel.app preview URLs are intentionally skipped — warming a
  // preview does nothing for production. Production envs must set one of
  // the *_URL vars above (they already do for emails/links).
  return ''
}

export function refreshStorefront(paths: string[] = []) {
  const all = new Set<string>(['/', '/collection', ...paths.filter(Boolean)])
  for (const p of all) {
    try {
      revalidatePath(p)
    } catch {
      /* not in a request context that supports it — ignore */
    }
  }
  try {
    after(async () => {
      const base = siteBaseUrl()
      if (!base) return
      await Promise.all(
        Array.from(all).map(async (p) => {
          const ctl = new AbortController()
          const timer = setTimeout(() => ctl.abort(), 9000)
          try {
            // cache:bust the CDN edge too, then let ISR regenerate warm.
            await fetch(base + p, { signal: ctl.signal, cache: 'no-store' })
          } catch {
            /* warm is best-effort */
          } finally {
            clearTimeout(timer)
          }
        })
      )
    })
  } catch {
    /* after() unavailable outside a request (tests, scripts) — the
       revalidatePath calls above already did the invalidation. */
  }
}
