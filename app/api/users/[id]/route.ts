import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { getAuthUser, isAdminUser, unauthorized, forbidden } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

/** Allow only the account owner or an admin to act on this user id. */
async function requireSelfOrAdmin(request: NextRequest, id: string) {
  const user = await getAuthUser(request)
  if (!user) return unauthorized()
  if (user.id === id) return { user }
  if (await isAdminUser(user.id)) return { user }
  return forbidden()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireSelfOrAdmin(request, id)
    if (auth instanceof NextResponse) return auth
    // Basic profile - handle missing columns gracefully
    let { data: user, error } = await supabaseServer
      .from('users')
      .select('id, email, full_name, phone, created_at, shipping_address, billing_address, avatar_url')
      .eq('id', id)
      .maybeSingle()

    if (error && (error.message.includes('column users.shipping_address does not exist') || error.message.includes('column users.avatar_url does not exist'))) {
      // Fallback if address or avatar columns are missing
      const fallback = await supabaseServer
        .from('users')
        .select('id, email, full_name, phone, created_at')
        .eq('id', id)
        .maybeSingle()
      user = fallback.data as any
      error = fallback.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Orders (by user_id or email fallback)
    let orders: any[] = []
    try {
      const { data: ordersByUser } = await supabaseServer
        .from('orders')
        .select('id, status, total_price, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      orders = Array.isArray(ordersByUser) ? ordersByUser : []
      if (orders.length === 0 && user.email) {
        const { data: ordersByEmail } = await supabaseServer
          .from('orders')
          .select('id, status, total_price, created_at')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
        if (Array.isArray(ordersByEmail)) orders = ordersByEmail
      }
    } catch { }
    // Wishlist count
    let wishlistCount = 0
    try {
      const { data: wl } = await supabaseServer
        .from('wishlist')
        .select('id')
        .eq('user_id', id)
      wishlistCount = Array.isArray(wl) ? wl.length : 0
    } catch { }
    // Last cart entries (approx)
    let cartItems = 0
    try {
      const { data: carts } = await supabaseServer
        .from('carts')
        .select('id')
        .eq('user_id', id)
      cartItems = Array.isArray(carts) ? carts.length : 0
    } catch { }
    const profile = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      phone: user.phone,
      avatarUrl: user.avatar_url || null,
      createdAt: user.created_at,
      shippingAddress: user.shipping_address || null,
      billingAddress: user.billing_address || null,
      wishlistCount,
      cartItems,
      orders: (orders || []).map((o: any) => ({
        id: o.id,
        status: o.status,
        total: Number(o.total_price || 0),
        createdAt: o.created_at,
      })),
    }
    return NextResponse.json(profile, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    const auth = await requireSelfOrAdmin(request, id)
    if (auth instanceof NextResponse) return auth

    const body = await request.json().catch(() => ({}))
    const fullName = String(body?.fullName || body?.name || '').trim()
    const email = String(body?.email || '').trim()
    const phone = body?.phone !== undefined ? String(body?.phone || '').trim() : undefined
    const shippingAddress = body?.shippingAddress || null
    const billingAddress = body?.billingAddress || null
    const avatarUrl = body?.avatarUrl || body?.avatar_url || null

    const updates: any = {}
    if (fullName) updates.full_name = fullName
    if (phone !== undefined) updates.phone = phone
    if (shippingAddress) updates.shipping_address = shippingAddress
    if (billingAddress) updates.billing_address = billingAddress
    if (avatarUrl !== null) updates.avatar_url = avatarUrl

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    let { data, error } = await supabaseServer
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, full_name, phone, created_at, avatar_url')
      .maybeSingle()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      if (email) {
        const byEmail = await supabaseServer
          .from('users')
          .select('id, email, full_name, phone, created_at, avatar_url')
          .eq('email', email)
          .maybeSingle()
        if (byEmail.data?.id) {
          const upd = await supabaseServer
            .from('users')
            .update(updates)
            .eq('id', byEmail.data.id)
            .select('id, email, full_name, phone, created_at, avatar_url')
            .maybeSingle()
          if (upd.error) {
            return NextResponse.json({ error: upd.error.message }, { status: 500 })
          }
          data = upd.data || null
        } else {
          try {
            let found: any = null
            for (let page = 1; page <= 20 && !found; page++) {
              const res = await supabaseServer.auth.admin.listUsers({ page, perPage: 200 })
              if (res.error) break
              const users = res.data?.users || []
              found = users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase()) || null
              if (users.length < 200) break
            }
            if (found?.id) {
              const upsert = await supabaseServer
                .from('users')
                .upsert({ id: found.id, email, full_name: fullName || found.user_metadata?.full_name || '' })
                .select('id, email, full_name, phone, created_at, avatar_url')
                .maybeSingle()
              if (upsert.error) {
                return NextResponse.json({ error: upsert.error.message }, { status: 500 })
              }
              data = upsert.data || null
            }
          } catch { }
        }
      }
      if (!data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }
    // Re-fetch to include address fields
    const { data: updated } = await supabaseServer
      .from('users')
      .select('id, email, full_name, phone, created_at, shipping_address, billing_address')
      .eq('id', data.id)
      .maybeSingle()
    return NextResponse.json({
      id: data.id,
      email: data.email,
      name: data.full_name,
      phone: data.phone,
      avatarUrl: data.avatar_url || null,
      createdAt: data.created_at,
      shippingAddress: updated?.shipping_address || null,
      billingAddress: updated?.billing_address || null,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Deleting an account is an admin-only operation.
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    if (!(await isAdminUser(caller.id))) return forbidden('Admin access required')

    // Check if user is an admin - we shouldn't allow deleting admins via this route
    const { data: isAdmin } = await supabaseServer
      .from('admin_users')
      .select('user_id')
      .eq('user_id', id)
      .maybeSingle()

    if (isAdmin) {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 })
    }

    // 1. Delete from users table (public schema)
    const { error: deleteError } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // 2. Delete from auth.users (requires service role / admin auth)
    // Note: If you have foreign key constraints in other tables (like orders),
    // you might need to handle them (either CASCADE or set to NULL).
    // The public.users table usually handles the profile, while auth.users handles the login.
    const { error: authDeleteError } = await supabaseServer.auth.admin.deleteUser(id)

    // We don't necessarily fail if auth delete fails (e.g. if user only exists in public.users)
    // but we should log it if it's a real error.
    if (authDeleteError && !authDeleteError.message.includes('User not found')) {
      console.error('Auth delete error:', authDeleteError)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('Delete user error:', e)
    return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 500 })
  }
}
