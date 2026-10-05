'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Eye, MousePointerClick, Clock, Users, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, RefreshCw, Activity, ChevronDown,
  Layers, Percent, Gauge,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */
type PageStat = { path: string; title: string; views: number; clicks: number; avgTimeOnPage: number }
type SeriesPoint = { date: string; views: number; clicks: number }
type AnalyticsData = {
  totalViews: number
  totalClicks: number
  totalSessions: number
  totalPages: number
  avgSessionDuration: number
  pageStats: PageStat[]
  hasMore: boolean
  topByViews: PageStat[]
  bottomByViews: PageStat[]
  topByClicks: PageStat[]
  bottomByClicks: PageStat[]
  topByTimeSpent: PageStat[]
  chartDataDistribution: { name: string; value: number }[]
  series: SeriesPoint[]
  range: string
  capped: boolean
}

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'all', label: 'All Time' },
]

const DONUT_COLORS = [
  'var(--c-accent)', 'var(--c-info)', 'var(--c-success)',
  'var(--c-warning)', '#A78BFA', '#2DD4BF', '#E879F9', '#F59E0B',
]

/* ──────────────────────────────────────────────────────────────
   Helpers — every one is null-safe so the page can never crash
   ────────────────────────────────────────────────────────────── */
function n(v: any): number { const x = Number(v); return Number.isFinite(x) ? x : 0 }

function normalize(j: any): AnalyticsData {
  return {
    totalViews: n(j?.totalViews),
    totalClicks: n(j?.totalClicks),
    totalSessions: n(j?.totalSessions),
    totalPages: n(j?.totalPages),
    avgSessionDuration: n(j?.avgSessionDuration),
    pageStats: Array.isArray(j?.pageStats) ? j.pageStats : [],
    hasMore: !!j?.hasMore,
    topByViews: Array.isArray(j?.topByViews) ? j.topByViews : [],
    bottomByViews: Array.isArray(j?.bottomByViews) ? j.bottomByViews : [],
    topByClicks: Array.isArray(j?.topByClicks) ? j.topByClicks : [],
    bottomByClicks: Array.isArray(j?.bottomByClicks) ? j.bottomByClicks : [],
    topByTimeSpent: Array.isArray(j?.topByTimeSpent) ? j.topByTimeSpent : [],
    chartDataDistribution: Array.isArray(j?.chartDataDistribution) ? j.chartDataDistribution : [],
    series: Array.isArray(j?.series) ? j.series : [],
    range: String(j?.range || '30d'),
    capped: !!j?.capped,
  }
}

function formatDuration(seconds: number): string {
  const s = Math.round(n(seconds))
  if (s <= 0) return '—'
  if (s < 60) return `${s}s`
  const min = Math.floor(s / 60)
  const sec = s % 60
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function formatNum(v: number): string { return n(v).toLocaleString() }

function shortenPath(path: string, max = 22): string {
  if (!path) return '/'
  if (path.length <= max) return path
  return '…' + path.slice(-(max - 1))
}

function dayLabel(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  } catch { return dateStr }
}

// Measure a container's width (for crisp, responsive SVG charts)
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(760)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = () => { const cw = el.clientWidth; if (cw > 0) setW(Math.round(cw)) }
    set()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(set)
      ro.observe(el)
    } else {
      window.addEventListener('resize', set)
    }
    return () => { ro ? ro.disconnect() : window.removeEventListener('resize', set) }
  }, [])
  return [ref, w]
}

/* ──────────────────────────────────────────────────────────────
   Self-contained charts (zero deps — always render)
   ────────────────────────────────────────────────────────────── */
function TrendChart({ series }: { series: SeriesPoint[] }) {
  const [wrapRef, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const H = 240, padT = 18, padB = 26, padX = 6
  const data = series.length ? series : [{ date: '', views: 0, clicks: 0 }]
  const nPts = data.length
  const maxV = Math.max(1, ...data.map(d => n(d.views)))
  const plotW = Math.max(1, width - padX * 2)
  const plotH = H - padT - padB
  const xAt = (i: number) => padX + (nPts <= 1 ? plotW / 2 : (i / (nPts - 1)) * plotW)
  const yAt = (v: number) => padT + (1 - n(v) / maxV) * plotH

  const linePts = data.map((d, i) => `${xAt(i).toFixed(1)},${yAt(d.views).toFixed(1)}`)
  const linePath = linePts.length ? `M ${linePts.join(' L ')}` : ''
  const areaPath = linePts.length
    ? `M ${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} L ${linePts.join(' L ')} L ${xAt(nPts - 1).toFixed(1)},${(H - padB).toFixed(1)} Z`
    : ''

  // sparse x labels (~6)
  const labelStep = Math.max(1, Math.ceil(nPts / 6))
  const gridY = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div ref={wrapRef} className="an-chart-box" style={{ position: 'relative' }}>
      <svg width={width} height={H} style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const mx = e.clientX - rect.left
          const rel = Math.max(0, Math.min(1, (mx - padX) / plotW))
          setHover(Math.round(rel * (nPts - 1)))
        }}>
        <defs>
          <linearGradient id="anTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-accent)" stopOpacity="0.24" />
            <stop offset="100%" stopColor="var(--c-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridY.map((g, i) => {
          const y = padT + g * plotH
          return <line key={i} x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--c-border)" strokeWidth={1} strokeDasharray="2 5" />
        })}
        {areaPath && <path d={areaPath} fill="url(#anTrendFill)" />}
        {linePath && <path d={linePath} fill="none" stroke="var(--c-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {maxV > 0 && data.map((d, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(d.views)} r={hover === i ? 4 : 0} fill="var(--c-accent)" stroke="#fff" strokeWidth={1.5} />
        ))}
        {hover != null && data[hover] && (
          <line x1={xAt(hover)} y1={padT} x2={xAt(hover)} y2={H - padB} stroke="var(--c-accent)" strokeWidth={1} strokeOpacity={0.4} />
        )}
        {data.map((d, i) => (i % labelStep === 0 || i === nPts - 1) && d.date ? (
          <text key={i} x={xAt(i)} y={H - 8} textAnchor="middle" fontSize={9.5} fill="var(--c-text-muted)" fontFamily="var(--font-dmsans)">{dayLabel(d.date)}</text>
        ) : null)}
      </svg>
      {hover != null && data[hover] && data[hover].date && (
        <div className="an-tip" style={{ left: `${(xAt(hover) / width) * 100}%` }}>
          <div className="an-tip-date">{dayLabel(data[hover].date)}</div>
          <div className="an-tip-row"><span className="an-tip-dot" style={{ background: 'var(--c-accent)' }} />{formatNum(data[hover].views)} views</div>
          <div className="an-tip-row"><span className="an-tip-dot" style={{ background: 'var(--c-info)' }} />{formatNum(data[hover].clicks)} clicks</div>
        </div>
      )}
    </div>
  )
}

function Donut({ data, total }: { data: { name: string; value: number; fill: string }[]; total: number }) {
  const size = 168, stroke = 24, r = (size - stroke) / 2, C = 2 * Math.PI * r
  const safeTotal = total > 0 ? total : 1
  let acc = 0
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth={stroke} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const frac = n(d.value) / safeTotal
            const dash = frac * C
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.fill} strokeWidth={stroke}
                strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc * C}
                opacity={0.92}>
                <title>{shortenPath(d.name, 30)} — {formatNum(d.value)}</title>
              </circle>
            )
            acc += frac
            return el
          })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" fontSize={26} fontFamily="var(--font-main)" fill="var(--c-text)">{formatNum(total)}</text>
        <text x="50%" y="59%" textAnchor="middle" fontSize={9} letterSpacing="0.16em" fill="var(--c-text-muted)" fontFamily="var(--font-dmsans)">VIEWS</text>
      </svg>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Page-local styles (charts/lists only — rest uses a-* system)
   ────────────────────────────────────────────────────────────── */
const CSS = `
.an-chart-box{width:100%}
.an-tip{position:absolute;top:0;transform:translateX(-50%);background:#fff;border:1px solid var(--c-border);box-shadow:var(--shadow-md);border-radius:10px;padding:9px 12px;pointer-events:none;white-space:nowrap;z-index:5}
.an-tip-date{font-family:var(--font-dmsans);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--c-text-muted);margin-bottom:5px}
.an-tip-row{display:flex;align-items:center;gap:6px;font-family:var(--font-dmsans);font-size:12px;color:var(--c-text)}
.an-tip-dot{width:8px;height:8px;border-radius:3px;flex-shrink:0}

.an-legend{display:flex;flex-direction:column;gap:9px;margin-top:6px}
.an-legend-item{display:flex;align-items:center;gap:9px;font-family:var(--font-dmsans);font-size:12px;color:var(--c-text-muted)}
.an-legend-sw{width:9px;height:9px;border-radius:3px;flex-shrink:0}
.an-legend-name{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--c-text)}
.an-legend-pct{font-family:var(--font-main);color:var(--c-text-muted)}

.an-bars{display:flex;flex-direction:column;gap:13px}
.an-bar-row{display:flex;flex-direction:column;gap:5px}
.an-bar-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
.an-bar-name{font-family:var(--font-dmsans);font-size:12.5px;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.an-bar-val{font-family:var(--font-main);font-size:14px;color:var(--c-accent);flex-shrink:0}
.an-bar-track{height:7px;background:var(--c-surface-2);border-radius:999px;overflow:hidden}
.an-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--c-accent),var(--c-accent));transition:width .5s cubic-bezier(.16,1,.3,1)}

.an-time-list{display:flex;flex-direction:column;gap:8px}
.an-time-row{display:flex;align-items:center;gap:14px;padding:12px 15px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);transition:border-color .2s}
.an-time-row:hover{border-color:var(--c-border-strong)}
.an-time-rank{font-family:var(--font-main);font-size:20px;font-weight:300;color:var(--c-text-faint);width:20px;text-align:center;flex-shrink:0}
.an-time-info{flex:1;min-width:0}
.an-time-path{font-family:var(--font-dmsans);font-size:13px;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.an-time-meta{font-family:var(--font-dmsans);font-size:11px;color:var(--c-text-muted);margin-top:2px}
.an-time-dur{display:flex;align-items:center;gap:5px;font-family:var(--font-main);font-size:16px;font-weight:300;color:var(--c-accent);flex-shrink:0}
.an-time-dur svg{width:13px;height:13px}

.an-td-bar-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.an-td-bar{height:4px;background:var(--c-surface-2);flex:1;max-width:70px;position:relative;overflow:hidden;border-radius:999px}
.an-td-bar-fill{position:absolute;left:0;top:0;height:100%;border-radius:999px}
.an-td-val{font-family:var(--font-main);font-size:14px;font-weight:300;white-space:nowrap;min-width:42px;text-align:right}
.an-td-val--gold{color:var(--c-accent)}
.an-td-val--blue{color:var(--c-info)}
.an-td-val--dim{color:var(--c-text-muted);font-size:13px}

.an-mini-grid{display:grid;grid-template-columns:repeat(3,1fr)}
.an-mini{padding:20px 22px;text-align:center;border-right:1px solid var(--c-border)}
.an-mini:last-child{border-right:none}
.an-mini-val{font-family:var(--font-main);font-size:30px;font-weight:300;color:var(--c-accent);line-height:1;margin-bottom:9px}
.an-mini-label{font-family:var(--font-dmsans);font-size:9.5px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--c-text-muted)}
@media (max-width:640px){.an-mini-grid{grid-template-columns:1fr}.an-mini{border-right:none;border-bottom:1px solid var(--c-border)}.an-mini:last-child{border-bottom:none}}

.an-2col{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.an-donut-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center}
@media (max-width:900px){.an-2col{grid-template-columns:1fr}}
@media (max-width:520px){.an-donut-col{grid-template-columns:1fr}}

.an-seg{display:inline-flex;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--radius);padding:3px;gap:2px}
.an-seg button{border:0;background:transparent;cursor:pointer;border-radius:7px;padding:7px 12px;font-family:var(--font-dmsans);font-size:11px;font-weight:600;letter-spacing:.04em;color:var(--c-text-muted);transition:.15s;white-space:nowrap}
.an-seg button.is-active{background:#fff;color:var(--c-text);box-shadow:var(--shadow-sm)}
.an-seg button:hover:not(.is-active){color:var(--c-text)}

.an-spin{width:12px;height:12px;border:1.5px solid var(--c-border-strong);border-top-color:var(--c-accent);border-radius:50%;animation:an-spin .8s linear infinite;display:inline-block}
@keyframes an-spin{to{transform:rotate(360deg)}}
.an-all-loaded{padding:14px;border-top:1px solid var(--c-border);text-align:center;font-family:var(--font-dmsans);font-size:10px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--c-text-faint)}
.an-cap{margin-bottom:16px}
`

/* ──────────────────────────────────────────────────────────────
   Page
   ────────────────────────────────────────────────────────────── */
export default function SiteAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [allPageStats, setAllPageStats] = useState<PageStat[]>([])
  const [range, setRange] = useState('30d')
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchData = useCallback(async (r: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setStatus('loading')
      const res = await fetch(`/api/analytics/detailed?range=${encodeURIComponent(r)}&offset=0&limit=8`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`status ${res.status}`)
      const json = await res.json()
      const nd = normalize(json)
      setData(nd)
      setAllPageStats(nd.pageStats)
      setOffset(nd.pageStats.length)
      setHasMore(nd.hasMore)
      setStatus('ok')
    } catch {
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(range) }, [range, fetchData])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/analytics/detailed?range=${encodeURIComponent(range)}&offset=${offset}&limit=12`, { cache: 'no-store' })
      if (!res.ok) throw new Error('bad')
      const json = await res.json()
      const nd = normalize(json)
      setAllPageStats(prev => [...prev, ...nd.pageStats])
      setOffset(prev => prev + nd.pageStats.length)
      setHasMore(nd.hasMore)
    } catch { /* keep current list */ }
    finally { setLoadingMore(false) }
  }

  const rangeLabel = RANGES.find(x => x.key === range)?.label || ''

  /* ── loading ── */
  if (status === 'loading') return (
    <>
      <style>{CSS}</style>
      <div className="a-page">
        <div className="a-loader-row"><span className="a-loader" /><span className="a-loader-label">Loading analytics</span></div>
      </div>
    </>
  )

  /* ── error ── */
  if (status === 'error' || !data) return (
    <>
      <style>{CSS}</style>
      <div className="a-page">
        <div className="a-empty">
          <div className="a-empty-ico"><Activity size={26} /></div>
          <div className="a-empty-title">Couldn’t load analytics</div>
          <div className="a-empty-text">The request failed or you may need to sign in again. Please retry.</div>
          <button className="a-btn a-btn--primary" onClick={() => fetchData(range)} style={{ marginTop: 14 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    </>
  )

  const hasAnyData = data.totalViews > 0 || data.totalClicks > 0 || data.totalSessions > 0
  const maxViews = Math.max(1, ...allPageStats.map(p => n(p.views)))
  const maxClicks = Math.max(1, ...allPageStats.map(p => n(p.clicks)))
  const ctr = data.totalViews > 0 ? ((data.totalClicks / data.totalViews) * 100).toFixed(1) : '0'
  const pps = data.totalSessions > 0 ? (data.totalViews / data.totalSessions).toFixed(1) : '0'

  const kpis = [
    { label: 'Page Views', value: formatNum(data.totalViews), icon: Eye },
    { label: 'Total Clicks', value: formatNum(data.totalClicks), icon: MousePointerClick },
    { label: 'Unique Sessions', value: formatNum(data.totalSessions), icon: Users },
    { label: 'Avg Session', value: formatDuration(data.avgSessionDuration), icon: Clock },
  ]
  const insights = [
    { title: 'Most Viewed', page: data.topByViews?.[0], metric: data.topByViews?.[0]?.views, unit: 'views', icon: TrendingUp, badge: 'success' },
    { title: 'Least Viewed', page: data.bottomByViews?.[0], metric: data.bottomByViews?.[0]?.views, unit: 'views', icon: TrendingDown, badge: 'danger' },
    { title: 'Most Clicked', page: data.topByClicks?.[0], metric: data.topByClicks?.[0]?.clicks, unit: 'clicks', icon: ArrowUpRight, badge: 'info' },
    { title: 'Least Clicked', page: data.bottomByClicks?.[0], metric: data.bottomByClicks?.[0]?.clicks, unit: 'clicks', icon: ArrowDownRight, badge: 'warning' },
  ]
  const donutData = (data.chartDataDistribution || []).slice(0, 8).map((d, i) => ({ ...d, value: n(d.value), fill: DONUT_COLORS[i % DONUT_COLORS.length] }))
  const topBars = (data.topByViews || []).slice(0, 6)
  const barMax = Math.max(1, ...topBars.map(p => n(p.views)))

  return (
    <>
      <style>{CSS}</style>
      <div className="a-page">

        {/* Header */}
        <div className="a-head">
          <div>
            <div className="a-eyebrow">Dashboard · Insights</div>
            <h1 className="a-title">Site <em>Analytics</em></h1>
            <p className="a-subtitle">{formatNum(data.totalPages)} tracked pages · {rangeLabel.toLowerCase()}</p>
          </div>
          <div className="a-head-actions">
            <div className="an-seg" role="tablist" aria-label="Date range">
              {RANGES.map(r => (
                <button key={r.key} className={range === r.key ? 'is-active' : ''} onClick={() => setRange(r.key)} disabled={refreshing}>{r.label}</button>
              ))}
            </div>
            <span className="a-badge a-badge--success"><span className="a-dot a-dot--success a-dot--pulse" />Live</span>
            <button className="a-btn a-btn--ghost" onClick={() => fetchData(range, true)} disabled={refreshing}>
              <RefreshCw size={14} style={{ animation: refreshing ? 'an-spin 0.8s linear infinite' : 'none' }} /> Refresh
            </button>
          </div>
        </div>

        {data.capped && (
          <div className="a-badge a-badge--warning an-cap" style={{ padding: '9px 13px', display: 'flex', gap: 7 }}>
            <Layers size={14} /> High traffic — showing the most recent {formatNum(12000)} events for this window. Narrow the range for exact figures.
          </div>
        )}

        {!hasAnyData ? (
          <div className="a-empty" style={{ padding: '72px 24px' }}>
            <div className="a-empty-ico"><Activity size={28} /></div>
            <div className="a-empty-title">No analytics yet for this range</div>
            <div className="a-empty-text">
              Visits are tracked automatically across every public page and product. As people browse the storefront in the selected period, views, clicks and time-on-page will appear here. Try a wider range like “All Time”.
            </div>
            {range !== 'all' && (
              <button className="a-btn a-btn--ghost" onClick={() => setRange('all')} style={{ marginTop: 14 }}>View All Time</button>
            )}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="a-stats">
              {kpis.map(({ label, value, icon: Icon }) => (
                <div className="a-stat" key={label}>
                  <div className="a-stat-top">
                    <span className="a-stat-label">{label}</span>
                    <div className="a-stat-ico"><Icon size={17} /></div>
                  </div>
                  <div className="a-stat-val">{value}</div>
                </div>
              ))}
            </div>

            {/* Trend */}
            <div style={{ marginBottom: 20 }}>
              <div className="a-card">
                <div className="a-card-head">
                  <div>
                    <div className="a-card-title">Traffic <em>Trend</em></div>
                    <div className="a-card-sub">Daily page views · {rangeLabel.toLowerCase()}</div>
                  </div>
                  <span className="a-badge a-badge--accent"><Eye size={12} />{formatNum(data.totalViews)} total</span>
                </div>
                <div className="a-card-body">
                  <TrendChart series={data.series} />
                </div>
              </div>
            </div>

            {/* Distribution + Top pages */}
            <div className="an-2col" style={{ marginBottom: 20 }}>
              <div className="a-card">
                <div className="a-card-head">
                  <div><div className="a-card-title">Views <em>Distribution</em></div><div className="a-card-sub">Share across top pages</div></div>
                </div>
                <div className="a-card-body">
                  {donutData.length > 0 ? (
                    <div className="an-donut-col">
                      <Donut data={donutData} total={data.totalViews} />
                      <div className="an-legend">
                        {donutData.map((d) => {
                          const pct = data.totalViews > 0 ? ((d.value / data.totalViews) * 100).toFixed(1) : '0'
                          return (
                            <div className="an-legend-item" key={d.name}>
                              <span className="an-legend-sw" style={{ background: d.fill }} />
                              <span className="an-legend-name" title={d.name}>{shortenPath(d.name, 20)}</span>
                              <span className="an-legend-pct">{pct}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : <p className="a-muted" style={{ textAlign: 'center', padding: '32px 0' }}>No distribution data yet</p>}
                </div>
              </div>

              <div className="a-card">
                <div className="a-card-head">
                  <div><div className="a-card-title">Top Pages by <em>Views</em></div><div className="a-card-sub">Most visited pages</div></div>
                </div>
                <div className="a-card-body">
                  {topBars.length > 0 ? (
                    <div className="an-bars">
                      {topBars.map((p) => (
                        <div className="an-bar-row" key={p.path}>
                          <div className="an-bar-top">
                            <span className="an-bar-name" title={p.path}>{shortenPath(p.path, 34)}</span>
                            <span className="an-bar-val">{formatNum(p.views)}</span>
                          </div>
                          <div className="an-bar-track"><div className="an-bar-fill" style={{ width: `${Math.max(3, (n(p.views) / barMax) * 100)}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="a-muted" style={{ textAlign: 'center', padding: '32px 0' }}>No view data yet</p>}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div>
              <div className="a-section-title">Performance Insights</div>
              <div className="a-stats">
                {insights.map(({ title, page, metric, unit, icon: Icon, badge }) => (
                  <div className="a-stat" key={title}>
                    <div className="a-stat-top">
                      <span className={`a-badge a-badge--${badge}`}><Icon size={12} />{title}</span>
                    </div>
                    {page ? (
                      <>
                        <div className="a-stat-sub" title={page.path} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.path}</div>
                        <div className="a-stat-val">{formatNum(metric || 0)}<span className="a-muted" style={{ fontSize: 11, marginLeft: 6, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{unit}</span></div>
                      </>
                    ) : <span className="a-muted" style={{ fontStyle: 'italic', fontSize: 12 }}>No data available</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Time spent + engagement mini-stats */}
            <div className="an-2col" style={{ marginBottom: 20 }}>
              <div className="a-card">
                <div className="a-card-head">
                  <div><div className="a-card-title">Most <em>Time Spent</em></div><div className="a-card-sub">Deepest engagement pages</div></div>
                </div>
                <div className="a-card-body">
                  {(data.topByTimeSpent || []).length > 0 ? (
                    <div className="an-time-list">
                      {data.topByTimeSpent.map((p, i) => (
                        <div className="an-time-row" key={p.path}>
                          <span className="an-time-rank">{i + 1}</span>
                          <div className="an-time-info">
                            <div className="an-time-path" title={p.path}>{p.path}</div>
                            <div className="an-time-meta">{formatNum(p.views)} views · {formatNum(p.clicks)} clicks</div>
                          </div>
                          <div className="an-time-dur"><Clock />{formatDuration(p.avgTimeOnPage)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="a-muted" style={{ textAlign: 'center', padding: '32px 0' }}>No duration data yet</p>}
                </div>
              </div>

              <div className="a-card">
                <div className="a-card-head">
                  <div><div className="a-card-title">Engagement <em>Overview</em></div><div className="a-card-sub">Key ratios</div></div>
                </div>
                <div className="a-card-body a-card-body--flush">
                  <div className="an-mini-grid">
                    {[
                      { value: `${ctr}%`, label: 'Click-through Rate', icon: Percent },
                      { value: pps, label: 'Pages / Session', icon: Layers },
                      { value: formatDuration(data.avgSessionDuration), label: 'Avg Session', icon: Gauge },
                    ].map(({ value, label }) => (
                      <div className="an-mini" key={label}>
                        <div className="an-mini-val">{value}</div>
                        <div className="an-mini-label">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed table */}
            <div>
              <div className="a-row a-row--between" style={{ marginBottom: 12 }}>
                <div className="a-section-title" style={{ margin: 0 }}>Detailed Page Statistics</div>
                <span className="a-muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{allPageStats.length} / {formatNum(data.totalPages)} pages</span>
              </div>
              <div className="a-table-wrap">
                <div className="a-table-scroll">
                  <table className="a-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>#</th>
                        <th>Page Path</th>
                        <th className="a-td-right">Views</th>
                        <th className="a-td-right">Clicks</th>
                        <th className="a-td-right">Avg Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPageStats.map((p, i) => (
                        <tr key={`${p.path}-${i}`}>
                          <td><span className="a-mono">{i + 1}</span></td>
                          <td>
                            <div className="a-cell-name" title={p.path}>{p.path}</div>
                            {p.title && p.title !== p.path && <div className="a-cell-meta">{p.title}</div>}
                          </td>
                          <td className="a-td-right">
                            <div className="an-td-bar-wrap">
                              <div className="an-td-bar"><div className="an-td-bar-fill" style={{ width: `${(n(p.views) / maxViews) * 100}%`, background: 'var(--c-accent)' }} /></div>
                              <span className="an-td-val an-td-val--gold">{formatNum(p.views)}</span>
                            </div>
                          </td>
                          <td className="a-td-right">
                            <div className="an-td-bar-wrap">
                              <div className="an-td-bar"><div className="an-td-bar-fill" style={{ width: `${(n(p.clicks) / maxClicks) * 100}%`, background: 'var(--c-info)' }} /></div>
                              <span className="an-td-val an-td-val--blue">{formatNum(p.clicks)}</span>
                            </div>
                          </td>
                          <td className="a-td-right"><span className="an-td-val an-td-val--dim">{formatDuration(p.avgTimeOnPage)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {hasMore && (
                  <div className="a-card-foot" style={{ justifyContent: 'center' }}>
                    <button onClick={loadMore} disabled={loadingMore} className="a-btn a-btn--ghost">
                      {loadingMore ? <><span className="an-spin" />Loading…</> : <><ChevronDown size={14} />Load More</>}
                    </button>
                  </div>
                )}
                {!hasMore && allPageStats.length > 0 && <div className="an-all-loaded">All {formatNum(data.totalPages)} pages loaded</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
