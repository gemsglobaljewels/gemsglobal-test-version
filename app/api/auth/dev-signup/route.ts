import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    // Dev-only: this creates a pre-confirmed auth user via the service role,
    // skipping email verification. It must never be reachable in production.
    if (process.env.NEXT_PUBLIC_AUTH_DEV_AUTO_CONFIRM !== 'true') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { email, password, fullName, phone, makeAdmin, role } = body || {}

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName || '',
        phone: phone || '',
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user) {
      const { error: upsertError } = await supabaseServer
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || '',
          phone: phone || '',
        })

      if (upsertError) {
        console.error('[DevSignup] Profile upsert error:', upsertError)
        // If profile creation fails, we might want to know why, 
        // but we shouldn't necessarily block the user if the auth user was created.
        // However, for dev-signup, let's be strict to help debugging.
        return NextResponse.json({ error: `User created but profile failed: ${upsertError.message}` }, { status: 500 })
      }

      if (makeAdmin === true) {
        const hdr = request.headers.get('x-admin-setup-secret')
        const secret = process.env.ADMIN_SETUP_SECRET
        if (!secret || hdr !== secret) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const selectedRole =
          role && ['owner', 'admin', 'editor'].includes(String(role)) ? String(role) : 'admin'
        await supabaseServer.from('admin_users').upsert({
          user_id: data.user.id,
          role: selectedRole,
        })
        await supabaseServer.from('admin_profiles').upsert({
          user_id: data.user.id,
          display_name: fullName || '',
          is_active: true,
        })
        return NextResponse.json({ user: data.user, role: selectedRole }, { status: 201 })
      }
    }

    return NextResponse.json({ user: data.user }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
