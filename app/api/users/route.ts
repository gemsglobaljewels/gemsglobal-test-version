import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export async function GET(request: NextRequest) {
  try {
    // Admin-only: returns the full customer directory (PII).
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth

    const params = request.nextUrl.searchParams
    const search = params.get('search') || ''
    let query = supabaseServer
      .from('users')
      .select('id, email, full_name, phone, created_at')
      .order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter out admin users
    const { data: adminUsers } = await supabaseServer.from('admin_users').select('user_id')
    const adminIds = new Set((adminUsers || []).map((a: any) => a.user_id))

    let list = (data || [])
      .filter((u: any) => !adminIds.has(u.id))
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.full_name,
        phone: u.phone,
        createdAt: u.created_at,
        kind: 'registered',
      }))

    if (search) {
      const s = search.toLowerCase()
      list = list.filter(
        (u: any) =>
          String(u.email || '').toLowerCase().includes(s) ||
          String(u.name || '').toLowerCase().includes(s) ||
          String(u.phone || '').toLowerCase().includes(s),
      )
    }
    list.sort((a: any, b: any) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tb - ta
    })
    return NextResponse.json(list)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
