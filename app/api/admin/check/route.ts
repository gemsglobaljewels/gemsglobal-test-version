import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAuthUser, unauthorized, forbidden } from '@/lib/apiAuth'

export async function POST(request: NextRequest) {
  try {
    // Must be signed in, and may only check your OWN admin status.
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()

    const body = await request.json().catch(() => ({}))
    const userId = body?.userId as string | undefined
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }
    if (userId !== caller.id) {
      return forbidden()
    }

    const { data, error } = await supabaseServer
      .from('admin_users')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 })
    }

    return NextResponse.json({ role: data.role })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to check admin role' }, { status: 500 })
  }
}
