import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// Column sets — the "full" set includes fields added in migration 017. If those
// columns don't exist yet (migration not run), queries transparently fall back
// to the legacy set so the booking flow keeps working.
const LEGACY_COLUMNS = 'id, user_id, customer_name, customer_email, customer_phone, appointment_date, appointment_time, service_type, status, notes, created_at'
const FULL_COLUMNS = `${LEGACY_COLUMNS}, appointment_type, preferred_platform, meeting_link, location`

function shape(a: any) {
  return {
    id: a.id,
    userId: a.user_id,
    customerName: a.customer_name,
    customerEmail: a.customer_email,
    customerPhone: a.customer_phone,
    date: a.appointment_date,
    time: a.appointment_time,
    service: a.service_type,
    status: a.status,
    notes: a.notes,
    appointmentType: a.appointment_type ?? 'visit',
    preferredPlatform: a.preferred_platform ?? '',
    meetingLink: a.meeting_link ?? '',
    location: a.location ?? '',
    createdAt: a.created_at,
  }
}

function isMissingColumnError(error: any): boolean {
  if (!error) return false
  const msg = String(error.message || '').toLowerCase()
  const code = String(error.code || '')
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    (msg.includes('column') && (msg.includes('does not exist') || msg.includes('not found'))) ||
    msg.includes('could not find')
  )
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const status = params.get('status')
  const userId = params.get('userId')
  const email = params.get('email')
  const limitParam = params.get('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : undefined

  function buildQuery(columns: string) {
    let query = supabaseServer
      .from('appointments')
      .select(columns)
      .order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    if (userId) query = query.eq('user_id', userId)
    else if (email) query = query.eq('customer_email', email)
    if (limit && Number.isFinite(limit) && limit > 0) query = query.limit(limit)
    return query
  }

  let { data, error } = await buildQuery(FULL_COLUMNS)
  if (error && isMissingColumnError(error)) {
    ({ data, error } = await buildQuery(LEGACY_COLUMNS))
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data || []).map(shape))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      time,
      service,
      notes,
      appointmentType,
      preferredPlatform,
      meetingLink,
      location,
    } = body || {}

    if (!customerName || !date || !time || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let effectiveUserId: string | null = userId || null
    if (effectiveUserId) {
      try {
        const { data: existing } = await supabaseServer
          .from('users')
          .select('id')
          .eq('id', effectiveUserId)
          .maybeSingle()
        if (!existing) {
          await supabaseServer
            .from('users')
            .upsert([{ id: effectiveUserId, email: customerEmail || null }], { onConflict: 'id' })
        }
      } catch {
        effectiveUserId = null
      }
    }

    // Normalise known display names to slugs; pass any other (admin-defined) slug through.
    const serviceType = (() => {
      const map: Record<string, string> = {
        'Personal Consultation': 'consultation',
        'Jewellery Fitting': 'fitting',
        'Jewelry Fitting': 'fitting',
        'Custom Design Session': 'custom-design',
        'Repair Assessment': 'repair',
      }
      return map[service] || service
    })()

    const legacyPayload = {
      user_id: effectiveUserId,
      customer_name: customerName,
      customer_email: customerEmail || '',
      customer_phone: customerPhone || '',
      appointment_date: date,
      appointment_time: time,
      service_type: serviceType,
      status: 'pending',
      notes: notes || '',
    }

    const fullPayload = {
      ...legacyPayload,
      appointment_type: appointmentType === 'online' ? 'online' : 'visit',
      preferred_platform: preferredPlatform || null,
      meeting_link: meetingLink || null,
      location: location || null,
    }

    let { data, error } = await supabaseServer.from('appointments').insert([fullPayload]).select(FULL_COLUMNS).single()
    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabaseServer.from('appointments').insert([legacyPayload]).select(LEGACY_COLUMNS).single())
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(shape(data), { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
