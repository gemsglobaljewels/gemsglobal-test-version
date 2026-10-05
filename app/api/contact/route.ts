import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendAdminContactEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_MESSAGE = 5000
const MAX_FIELD = 200

function clean(s: any, max = MAX_FIELD) {
  return typeof s === 'string' ? s.trim().slice(0, max) : ''
}

/**
 * Public contact-form endpoint (no auth — mirrors newsletter / appointments /
 * messages). Submissions are stored in the existing conversations/messages
 * tables so they surface in /admin/messaging with unread badges; the admin
 * email notification is fire-and-forget so it never blocks the DB write.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    // Honeypot: hidden "website" field — bots fill it, humans never see it.
    // Pretend success so the bot learns nothing.
    if (clean(body?.website)) return NextResponse.json({ ok: true })

    const name = clean(body?.name)
    const email = clean(body?.email)
    const phone = clean(body?.phone, 40)
    const subject = clean(body?.subject)
    const message = clean(body?.message, MAX_MESSAGE)

    if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 })
    if (!email || !EMAIL_RE.test(email))
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    if (!message)
      return NextResponse.json({ error: 'Please write a short message.' }, { status: 400 })

    // Compose a single message body; subject/phone are prefixed into content so
    // the messages schema stays untouched and the admin inbox renders as-is.
    const prefix = [
      subject ? `Subject: ${subject}` : '',
      phone ? `Phone: ${phone}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    const content = prefix ? `${prefix}\n\n${message}` : message

    // Reuse (or create) the conversation keyed by email — same logic as
    // /api/messages so contact submissions join the customer's thread.
    let conversationId: string | null = null
    const { data: byEmail } = await supabaseServer
      .from('conversations')
      .select('id')
      .eq('user_email', email)
      .maybeSingle()
    if (byEmail?.id) conversationId = byEmail.id

    if (!conversationId) {
      const { data: created } = await supabaseServer
        .from('conversations')
        .insert([{ user_token: crypto.randomUUID(), user_name: name, user_email: email }])
        .select('id')
        .single()
      conversationId = created?.id || null
    }
    if (!conversationId)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })

    const { error: msgError } = await supabaseServer
      .from('messages')
      .insert([{ conversation_id: conversationId, sender: 'user', content }])

    if (msgError) {
      console.error('[Contact API] message insert error:', msgError)
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
    }

    // Fire-and-forget admin notification — DB is the source of truth. The
    // recipient can be overridden from the admin editor (form.notify_email).
    ;(async () => {
      let notifyTo = ''
      try {
        const { data } = await supabaseServer
          .from('contact_us')
          .select('config')
          .eq('is_active', true)
          .single()
        const raw = (data?.config as any)?.form?.notify_email
        if (typeof raw === 'string' && EMAIL_RE.test(raw.trim())) notifyTo = raw.trim()
      } catch {
        /* table may not exist yet — fall back to the default recipient */
      }
      await sendAdminContactEmail({ name, email, phone, subject, message, to: notifyTo })
    })().catch((e) => console.error('[Contact API] admin email failed:', e))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[Contact API] POST Catch Error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
