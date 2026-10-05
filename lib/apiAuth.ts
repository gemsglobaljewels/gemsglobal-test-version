import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from './supabaseServer'

/**
 * Server-side API authentication & authorization helpers.
 *
 * The client (see components/AuthCookieBridge.tsx) mirrors the Supabase
 * access token into a same-origin cookie ("sb-access-token") so that every
 * existing same-origin fetch() automatically carries auth without changing
 * call sites. We also accept a standard Authorization: Bearer <jwt> header.
 *
 * These helpers validate the JWT with Supabase (never trust a client-supplied
 * userId) and, for admin routes, verify membership in the admin_users table.
 */

const ACCESS_TOKEN_COOKIE = 'sb-access-token'

export type AuthedUser = {
  id: string
  email?: string | null
}

function extractToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (header && header.toLowerCase().startsWith('bearer ')) {
    const t = header.slice(7).trim()
    if (t) return t
  }
  const cookie = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (cookie) return cookie
  return null
}

/** Returns the authenticated user, or null if the request has no valid token. */
export async function getAuthUser(request: NextRequest): Promise<AuthedUser | null> {
  const token = extractToken(request)
  if (!token) return null
  try {
    const { data, error } = await supabaseServer.auth.getUser(token)
    if (error || !data?.user) return null
    return { id: data.user.id, email: data.user.email }
  } catch {
    return null
  }
}

/** True if the given user id is present in admin_users. */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseServer
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

export type AdminInfo = { user: AuthedUser; role: string }

/** Returns the admin user + role, or null if not an admin. */
export async function getAdmin(request: NextRequest): Promise<AdminInfo | null> {
  const user = await getAuthUser(request)
  if (!user) return null
  try {
    const { data } = await supabaseServer
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!data) return null
    return { user, role: (data as any).role || 'admin' }
  } catch {
    return null
  }
}

/** 401 JSON response. */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 })
}

/** 403 JSON response. */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Guard for routes that require any signed-in user.
 * Usage:
 *   const auth = await requireAuth(request)
 *   if (auth instanceof NextResponse) return auth
 *   // auth.user is the AuthedUser
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthedUser } | NextResponse> {
  const user = await getAuthUser(request)
  if (!user) return unauthorized()
  return { user }
}

/**
 * Guard for admin-only routes.
 * Returns 401 if not signed in, 403 if signed in but not an admin.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: AuthedUser; role: string } | NextResponse> {
  const user = await getAuthUser(request)
  if (!user) return unauthorized()
  const admin = await getAdmin(request)
  if (!admin) return forbidden('Admin access required')
  return { user, role: admin.role }
}
