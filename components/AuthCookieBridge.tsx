'use client'

import { useEffect } from 'react'

/**
 * Mirrors the Supabase access token into a same-origin cookie so that every
 * existing same-origin fetch('/api/...') automatically carries authentication.
 *
 * Why a cookie: the app persists the Supabase session in localStorage (client
 * only). API routes run on the server and cannot read localStorage, so before
 * this bridge the server had no way to identify the caller. Rather than editing
 * every fetch() call site to attach an Authorization header, we keep a short-
 * lived cookie in sync with the current session. Server helpers in
 * lib/apiAuth.ts validate this token with Supabase on every request.
 *
 * The cookie is NOT HttpOnly (it must be set from JS as the session lives in
 * the browser), but it is SameSite=Lax + Secure and only ever contains the
 * short-lived access token — never the refresh token.
 */

const COOKIE_NAME = 'sb-access-token'

/**
 * Best-effort SYNCHRONOUS hydration: supabase-js persists the session in
 * localStorage under `sb-<project-ref>-auth-token`. Reading it synchronously on
 * first load lets us set the cookie before other components fire their initial
 * fetch(), avoiding a spurious 401 on cold loads. The async getSession() path
 * below remains the source of truth and keeps the cookie fresh on refresh.
 */
function hydrateFromStorageSync() {
  if (typeof window === 'undefined') return
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const ref = url.replace(/^https?:\/\//, '').split('.')[0]
    if (!ref) return
    const raw = window.localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const session = Array.isArray(parsed) ? parsed[0] : parsed?.currentSession || parsed
    const token = session?.access_token
    const expiresAt = session?.expires_at
    if (token) writeCookie(token, expiresAt)
  } catch {
    /* ignore — async path will set it shortly */
  }
}

function writeCookie(token: string | null, expiresAt?: number) {
  if (typeof document === 'undefined') return
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  if (!token) {
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
    return
  }
  // Expire slightly before the token itself; default 1h if unknown.
  const now = Math.floor(Date.now() / 1000)
  const maxAge = expiresAt && expiresAt > now ? expiresAt - now : 3600
  document.cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

// Run once as soon as this client-only module loads, before effects fire.
hydrateFromStorageSync()

export default function AuthCookieBridge() {
  useEffect(() => {
    let unsub: (() => void) | null = null
    ;(async () => {
      const { supabase } = await import('@/lib/supabase')

      // Sync current session immediately on mount.
      const { data } = await supabase.auth.getSession()
      const session = data.session
      writeCookie(session?.access_token ?? null, session?.expires_at ?? undefined)

      // Keep the cookie in sync on sign-in, sign-out and token refresh.
      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        writeCookie(newSession?.access_token ?? null, newSession?.expires_at ?? undefined)
      })
      unsub = () => listener.subscription.unsubscribe()
    })()

    return () => {
      if (unsub) unsub()
    }
  }, [])

  return null
}
