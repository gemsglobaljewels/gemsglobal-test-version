import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { sendNewsletterBroadcast } from '@/lib/email'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// POST /api/newsletter/broadcast
// Body: { subject, htmlContent, previewText }
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof NextResponse) return auth
    const body = await request.json()
    const { subject, htmlContent, previewText } = body

    if (!subject?.trim() || !htmlContent?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Fetch all active subscribers
    const { data: subscribers, error } = await supabaseServer
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true)

    if (error) throw error
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers found' }, { status: 400 })
    }

    const emails = subscribers.map((s: any) => s.email)

    // Send in batches of 10 to avoid SMTP overload
    const results = await sendNewsletterBroadcast({
      subject,
      htmlContent,
      previewText: previewText || '',
      recipients: emails,
    })

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      total: emails.length,
    })
  } catch (error: any) {
    console.error('[Newsletter Broadcast] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
