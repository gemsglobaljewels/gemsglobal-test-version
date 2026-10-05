import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'
import { requireAdmin } from '@/lib/apiAuth'

export const dynamic = 'force-dynamic'

// Number of days each range covers (null = all-time / no lower bound).
const RANGE_DAYS: Record<string, number | null> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
}

// Max rows we pull per table for the in-Node breakdown aggregation. PostgREST
// caps a single request at ~1000 rows, so we page through with .range() up to
// this ceiling. Headline behaviour stays bounded & predictable; if a window
// ever exceeds this we flag `capped` so the UI can say so (no silent truncation).
const ROW_CAP = 12000
const PAGE_SIZE = 1000

function isoStartOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

// Lower bound (ISO) for the requested range, or null for all-time.
function rangeSince(days: number | null): string | null {
  if (days == null) return null
  const now = new Date()
  const start = isoStartOfDayUTC(now)
  // "today" = since start of today; "7d" = since start of (today - 6), etc.
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return start.toISOString()
}

function dayKey(iso: string): string {
  // YYYY-MM-DD in UTC
  return new Date(iso).toISOString().slice(0, 10)
}

type EventRow = { event_type: string; path: string; page_title: string | null; session_id: string | null; created_at: string }
type SessionRow = { session_id: string | null; path: string; duration_seconds: number | null; created_at: string }

// Page through a query with .range() until we run out of rows or hit ROW_CAP.
async function fetchWindow<T>(
  build: (from: number, to: number) => any,
): Promise<{ rows: T[]; capped: boolean }> {
  const rows: T[] = []
  for (let from = 0; from < ROW_CAP; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await build(from, to)
    if (error || !Array.isArray(data) || data.length === 0) break
    rows.push(...(data as T[]))
    if (data.length < PAGE_SIZE) break
  }
  return { rows, capped: rows.length >= ROW_CAP }
}

const EMPTY = {
  totalViews: 0,
  totalClicks: 0,
  totalSessions: 0,
  totalPages: 0,
  avgSessionDuration: 0,
  pageStats: [] as any[],
  hasMore: false,
  topByViews: [] as any[],
  bottomByViews: [] as any[],
  topByClicks: [] as any[],
  bottomByClicks: [] as any[],
  topByTimeSpent: [] as any[],
  chartDataViews: [] as any[],
  chartDataClicks: [] as any[],
  chartDataDistribution: [] as any[],
  series: [] as any[],
  range: '30d',
  capped: false,
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth

  try {
    const url = new URL(request.url)
    const range = url.searchParams.get('range') || '30d'
    const days = range in RANGE_DAYS ? RANGE_DAYS[range] : 30
    const since = rangeSince(days)
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 8)))

    // ── Pull events + sessions for the window (bounded, paginated) ──
    const [{ rows: events, capped: evCapped }, { rows: sessions, capped: seCapped }] = await Promise.all([
      fetchWindow<EventRow>((from, to) => {
        let q = supabaseServer
          .from('analytics_events')
          .select('event_type, path, page_title, session_id, created_at')
          .not('path', 'like', '/admin%')
          .in('event_type', ['page_view', 'click'])
          .order('created_at', { ascending: false })
          .range(from, to)
        if (since) q = q.gte('created_at', since)
        return q
      }),
      fetchWindow<SessionRow>((from, to) => {
        let q = supabaseServer
          .from('page_sessions')
          .select('session_id, path, duration_seconds, created_at')
          .not('path', 'like', '/admin%')
          .order('created_at', { ascending: false })
          .range(from, to)
        if (since) q = q.gte('created_at', since)
        return q
      }),
    ])

    // ── Aggregate views + clicks by path, plus daily time-series ──
    const byPath: Record<string, { views: number; clicks: number; title: string }> = {}
    const dayViews: Record<string, number> = {}
    const dayClicks: Record<string, number> = {}
    const sessionIds = new Set<string>()
    let totalViews = 0
    let totalClicks = 0
    let earliest: string | null = null

    for (const e of events) {
      const p = e.path || '/'
      if (!byPath[p]) byPath[p] = { views: 0, clicks: 0, title: '' }
      if (e.session_id) sessionIds.add(e.session_id)
      if (e.created_at && (!earliest || e.created_at < earliest)) earliest = e.created_at
      const dk = e.created_at ? dayKey(e.created_at) : ''
      if (e.event_type === 'page_view') {
        byPath[p].views++
        totalViews++
        if (dk) dayViews[dk] = (dayViews[dk] || 0) + 1
        if (e.page_title) byPath[p].title = e.page_title
      } else if (e.event_type === 'click') {
        byPath[p].clicks++
        totalClicks++
        if (dk) dayClicks[dk] = (dayClicks[dk] || 0) + 1
      }
    }

    // ── Durations by path + per-session totals ──
    const durByPath: Record<string, { total: number; count: number }> = {}
    const sessionDur: Record<string, number> = {}
    for (const s of sessions) {
      const p = s.path || '/'
      const dur = Number(s.duration_seconds) || 0
      if (dur < 1) continue
      if (!durByPath[p]) durByPath[p] = { total: 0, count: 0 }
      durByPath[p].total += dur
      durByPath[p].count++
      if (s.session_id) {
        sessionIds.add(s.session_id)
        sessionDur[s.session_id] = (sessionDur[s.session_id] || 0) + dur
      }
    }

    const totalSessions = sessionIds.size
    const durValues = Object.values(sessionDur)
    const avgSessionDuration = durValues.length
      ? Math.round(durValues.reduce((a, b) => a + b, 0) / durValues.length)
      : 0

    // ── Combined per-page stats ──
    const allPaths = new Set([...Object.keys(byPath), ...Object.keys(durByPath)])
    const allPageStats = Array.from(allPaths)
      .map((path) => {
        const s = byPath[path] || { views: 0, clicks: 0, title: '' }
        const d = durByPath[path] || { total: 0, count: 0 }
        return {
          path,
          title: s.title || path,
          views: s.views,
          clicks: s.clicks,
          avgTimeOnPage: d.count > 0 ? Math.round(d.total / d.count) : 0,
        }
      })
      .sort((a, b) => b.views - a.views || b.clicks - a.clicks)

    const totalPages = allPageStats.length
    const pageStats = allPageStats.slice(offset, offset + limit)
    const hasMore = offset + limit < totalPages

    const byViewsDesc = allPageStats
    const byViewsAsc = [...allPageStats].filter((p) => p.views > 0).sort((a, b) => a.views - b.views)
    const byClicksDesc = [...allPageStats].sort((a, b) => b.clicks - a.clicks)
    const byClicksAsc = [...allPageStats].filter((p) => p.clicks > 0).sort((a, b) => a.clicks - b.clicks)
    const byTimeDesc = [...allPageStats].filter((p) => p.avgTimeOnPage > 0).sort((a, b) => b.avgTimeOnPage - a.avgTimeOnPage)

    // ── Continuous daily series for the trend chart ──
    // For fixed windows use the window length; for all-time span earliest→today, capped at 90 buckets.
    let seriesDays: number
    if (days != null) {
      seriesDays = days
    } else if (earliest) {
      const diff = Math.floor((Date.now() - new Date(earliest).getTime()) / 86400000) + 1
      seriesDays = Math.min(90, Math.max(1, diff))
    } else {
      seriesDays = 30
    }
    const series: { date: string; views: number; clicks: number }[] = []
    const cursor = isoStartOfDayUTC(new Date())
    cursor.setUTCDate(cursor.getUTCDate() - (seriesDays - 1))
    for (let i = 0; i < seriesDays; i++) {
      const key = cursor.toISOString().slice(0, 10)
      series.push({ date: key, views: dayViews[key] || 0, clicks: dayClicks[key] || 0 })
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }

    return NextResponse.json({
      totalViews,
      totalClicks,
      totalSessions,
      totalPages,
      avgSessionDuration,
      pageStats,
      hasMore,
      topByViews: byViewsDesc.slice(0, 5),
      bottomByViews: byViewsAsc.slice(0, 5),
      topByClicks: byClicksDesc.slice(0, 5),
      bottomByClicks: byClicksAsc.slice(0, 5),
      topByTimeSpent: byTimeDesc.slice(0, 6),
      chartDataViews: byViewsDesc.slice(0, 8).map((p) => ({ name: p.path, views: p.views })),
      chartDataClicks: byClicksDesc.slice(0, 8).map((p) => ({ name: p.path, clicks: p.clicks })),
      chartDataDistribution: byViewsDesc.filter((p) => p.views > 0).slice(0, 6).map((p) => ({ name: p.path, value: p.views })),
      series,
      range,
      capped: evCapped || seCapped,
    })
  } catch (err) {
    console.error('[analytics/detailed] error:', err)
    return NextResponse.json(EMPTY)
  }
}
