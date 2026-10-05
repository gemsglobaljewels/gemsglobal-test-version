import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const sessionId = String(body?.sessionId || '').trim()
        const path = String(body?.path || '').trim()
        const title = String(body?.title || '').trim()
        const durationSeconds = Math.round(Number(body?.durationSeconds) || 0)

        // Validate required fields
        if (!sessionId || !path) {
            return NextResponse.json({ ok: false, error: 'missing fields' }, { status: 400 })
        }

        // Only store meaningful durations (> 1 second, < 12 hours)
        if (durationSeconds < 1 || durationSeconds > 43200) {
            return NextResponse.json({ ok: false, error: 'invalid duration' }, { status: 400 })
        }

        // Skip admin paths
        if (path.startsWith('/admin')) {
            return NextResponse.json({ ok: false, error: 'admin path skipped' }, { status: 200 })
        }

        const { error } = await supabaseServer.from('page_sessions').insert([{
            session_id: sessionId,
            path,
            page_title: title,
            duration_seconds: durationSeconds,
        }])

        if (error) {
            console.error('page_sessions insert error:', error.message)
            return NextResponse.json({ ok: false }, { status: 500 })
        }

        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('session endpoint error:', err)
        return NextResponse.json({ ok: false }, { status: 500 })
    }
}
