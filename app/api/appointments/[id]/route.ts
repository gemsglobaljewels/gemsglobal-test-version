import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendAppointmentConfirmationEmail, sendAppointmentCompletionEmail, sendAppointmentCancellationEmail } from '@/lib/email'
import { getAuthUser, isAdminUser, unauthorized, forbidden } from '@/lib/apiAuth'

const LEGACY_COLUMNS = 'id, user_id, customer_name, customer_email, customer_phone, appointment_date, appointment_time, service_type, status, notes, created_at'
const FULL_COLUMNS = `${LEGACY_COLUMNS}, appointment_type, preferred_platform, meeting_link, location`

/** True when the appointment belongs to the caller (by user_id or verified email). */
function ownsAppointment(a: { user_id?: string | null; customer_email?: string | null }, caller: { id: string; email?: string | null }): boolean {
  if (a.user_id && a.user_id === caller.id) return true
  const callerEmail = (caller.email || '').trim().toLowerCase()
  const apptEmail = (a.customer_email || '').trim().toLowerCase()
  return !!callerEmail && callerEmail === apptEmail
}

/** Statuses a customer may self-cancel from. */
const USER_CANCELLABLE = ['pending', 'confirmed']
/** Statuses a customer may remove from their diary (already concluded). */
const USER_REMOVABLE = ['cancelled', 'completed']

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

function emailPayload(data: any) {
  return {
    appointmentId: data.id,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    service: data.service_type,
    date: data.appointment_date,
    time: data.appointment_time,
    notes: data.notes,
    appointmentType: (data.appointment_type ?? 'visit') as 'visit' | 'online',
    meetingLink: data.meeting_link ?? '',
    location: data.location ?? '',
    preferredPlatform: data.preferred_platform ?? '',
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let { data, error } = await supabaseServer
    .from('appointments').select(FULL_COLUMNS).eq('id', id).single()
  if (error && isMissingColumnError(error)) {
    ({ data, error } = await supabaseServer
      .from('appointments').select(LEGACY_COLUMNS).eq('id', id).single())
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(shape(data))
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admins may edit anything; a signed-in customer may only CANCEL their own
    // appointment (verified against the JWT identity — cookie or Bearer).
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    const callerIsAdmin = await isAdminUser(caller.id)

    const { id } = await params
    const body = await request.json()

    // New fields (accept snake_case or camelCase).
    const meetingLink = body.meeting_link ?? body.meetingLink
    const preferredPlatform = body.preferred_platform ?? body.preferredPlatform
    const location = body.location
    const appointmentType = body.appointment_type ?? body.appointmentType

    const legacyUpdates: any = {}
    if (body.date) legacyUpdates.appointment_date = body.date
    if (body.time) legacyUpdates.appointment_time = body.time
    if (body.service) legacyUpdates.service_type = body.service
    if (body.status) legacyUpdates.status = body.status
    if (body.notes !== undefined) legacyUpdates.notes = body.notes

    const fullUpdates: any = { ...legacyUpdates }
    if (meetingLink !== undefined) fullUpdates.meeting_link = meetingLink || null
    if (preferredPlatform !== undefined) fullUpdates.preferred_platform = preferredPlatform || null
    if (location !== undefined) fullUpdates.location = location || null
    if (appointmentType !== undefined) fullUpdates.appointment_type = appointmentType === 'online' ? 'online' : 'visit'

    // Fetch the current row — used for the status-transition rules and, for
    // non-admin callers, the ownership check.
    const { data: current } = await supabaseServer
      .from('appointments')
      .select('user_id, customer_email, status')
      .eq('id', id)
      .single()
    if (!current) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }
    const previousStatus = current.status || ''

    // ─── NON-ADMIN: owner-only, cancel-only ───
    if (!callerIsAdmin) {
      if (!ownsAppointment(current, caller)) return forbidden()
      const onlyCancel = Object.keys(fullUpdates).length === 1 && fullUpdates.status === 'cancelled'
      if (!onlyCancel) return forbidden('Only appointment cancellation is allowed')
      if (!USER_CANCELLABLE.includes(previousStatus)) {
        return NextResponse.json(
          { error: `A ${previousStatus} appointment can no longer be cancelled.` },
          { status: 400 }
        )
      }
    }

    // "Completed" is a final state — cannot change status after completion
    if (previousStatus === 'completed' && body.status && body.status !== 'completed') {
      return NextResponse.json(
        { error: 'Completed appointments cannot be modified' },
        { status: 400 }
      )
    }

    // "Cancelled" or "Confirmed" appointments cannot go back to "pending"
    if ((previousStatus === 'cancelled' || previousStatus === 'confirmed') && body.status === 'pending') {
      return NextResponse.json(
        { error: 'This appointment cannot be reverted to pending' },
        { status: 400 }
      )
    }

    let { data, error } = await supabaseServer
      .from('appointments')
      .update(fullUpdates)
      .eq('id', id)
      .select(FULL_COLUMNS)
      .single()
    if (error && isMissingColumnError(error)) {
      ({ data, error } = await supabaseServer
        .from('appointments')
        .update(legacyUpdates)
        .eq('id', id)
        .select(LEGACY_COLUMNS)
        .single())
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Send confirmation email when status changes to "confirmed" (fire-and-forget)
    if (data.status === 'confirmed' && previousStatus !== 'confirmed') {
      sendAppointmentConfirmationEmail(emailPayload(data)).catch((err) => {
        console.error('[API] Background confirmation email failed:', err)
      })
    }

    // Send thank-you + feedback email when status changes to "completed" (fire-and-forget)
    if (data.status === 'completed' && previousStatus !== 'completed') {
      sendAppointmentCompletionEmail(emailPayload(data)).catch((err) => {
        console.error('[API] Background completion email failed:', err)
      })
    }

    // Send apology email when status changes to "cancelled" (fire-and-forget)
    if (data.status === 'cancelled' && previousStatus !== 'cancelled') {
      sendAppointmentCancellationEmail(emailPayload(data)).catch((err) => {
        console.error('[API] Background cancellation email failed:', err)
      })
    }

    return NextResponse.json(shape(data))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admins may delete any appointment. A signed-in customer may remove their
    // OWN appointment from their diary once it is cancelled or completed —
    // live bookings must go through cancellation first.
    const caller = await getAuthUser(request)
    if (!caller) return unauthorized()
    const callerIsAdmin = await isAdminUser(caller.id)

    const { id } = await params

    if (!callerIsAdmin) {
      const { data: appt } = await supabaseServer
        .from('appointments')
        .select('user_id, customer_email, status')
        .eq('id', id)
        .single()
      if (!appt) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }
      if (!ownsAppointment(appt, caller)) return forbidden()
      if (!USER_REMOVABLE.includes(appt.status)) {
        return NextResponse.json(
          { error: 'Only cancelled or completed appointments can be removed. Cancel the appointment first.' },
          { status: 400 }
        )
      }
    }

    const { error } = await supabaseServer.from('appointments').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }
}
