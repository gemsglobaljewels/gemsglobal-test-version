import { supabase } from './supabase'

/**
 * fetch() that authenticates against our API routes with the live Supabase
 * session instead of relying on the "sb-access-token" cookie mirror.
 *
 * The cookie (see components/AuthCookieBridge.tsx) is written asynchronously
 * after hydration and expires with the access token, so a fetch fired from a
 * page's mount effect can race it (cold load) or find it expired (returning
 * visitor) and get a 401 even though the user has a valid session.
 * supabase.auth.getSession() restores the persisted session and transparently
 * refreshes an expired access token, so the Authorization header attached here
 * is always current. Falls back to a plain fetch when signed out.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  let token: string | null = null
  try {
    const { data } = await supabase.auth.getSession()
    token = data.session?.access_token ?? null
  } catch {
    // No session available — proceed unauthenticated (cookie may still work).
  }

  const headers = new Headers(init.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}
