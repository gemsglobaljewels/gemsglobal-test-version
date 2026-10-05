import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendInnerCircleWelcomeEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

// GET /api/newsletter — list all subscribers (admin)
export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('[Newsletter] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/newsletter  { email }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email || '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Check if already exists
    const { data: existing } = await supabaseServer
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', email)
      .maybeSingle()

    if (existing && existing.is_active) {
      return NextResponse.json({ success: true, message: 'Already subscribed', alreadySubscribed: true }, { status: 200 })
    }

    const { data, error } = await supabaseServer
      .from('newsletter_subscribers')
      .upsert({ email, is_active: true }, { onConflict: 'email' })
      .select()
      .single()

    if (error) throw error

    // ─── Send Inner Circle Welcome Email (shared "Light Atelier" design) ─────
    try {
      await sendInnerCircleWelcomeEmail(email)
    } catch (emailErr) {
      console.error('[Newsletter] Failed to send welcome email:', emailErr)
      // We don't throw here so the user is still subscribed in DB
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('[Newsletter] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/newsletter?id=<uuid> — unsubscribe / remove (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await supabaseServer
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Newsletter] DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
