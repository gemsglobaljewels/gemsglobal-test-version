import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

function normalizeRole(role: unknown) {
  const r = String(role || '').toLowerCase()
  return r === 'owner' || r === 'admin' || r === 'editor' ? r : 'admin'
}

export async function POST(request: NextRequest) {
  try {
    const hdr = request.headers.get('x-admin-setup-secret')
    const secret = process.env.ADMIN_SETUP_SECRET
    if (!secret || hdr !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const email = (body?.email as string | undefined)?.trim()
    const displayName = (body?.fullName as string | undefined)?.trim()
    const role = normalizeRole(body?.role)

    if (!email) {
      return NextResponse.json({ error: 'email required' }, { status: 400 })
    }

    const emailLower = email.toLowerCase()

    // Find auth user by email (paginate; keep bounded)
    let found: any = null
    for (let page = 1; page <= 20 && !found; page++) {
      const { data, error } = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      const users = data?.users || []
      found = users.find((u: any) => (u.email || '').toLowerCase() === emailLower) || null
      if (users.length < 200) break
    }

    if (!found?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const nameFromMeta = (found.user_metadata?.full_name as string | undefined) || ''
    const finalName = displayName || nameFromMeta || ''

    // Ensure public user profile exists
    await supabaseServer.from('users').upsert({
      id: found.id,
      email: found.email,
      full_name: finalName,
    })

    // Promote to admin
    await supabaseServer.from('admin_users').upsert({
      user_id: found.id,
      role,
    })

    await supabaseServer.from('admin_profiles').upsert({
      user_id: found.id,
      display_name: finalName,
      is_active: true,
    })

    return NextResponse.json(
      {
        userId: found.id,
        email: found.email,
        role,
      },
      { status: 200 },
    )
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to promote user' }, { status: 500 })
  }
}

