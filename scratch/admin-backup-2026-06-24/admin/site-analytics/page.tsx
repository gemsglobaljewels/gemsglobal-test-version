'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Eye, MousePointerClick, Clock, Users,
  TrendingUp, TrendingDown, ArrowUp, ArrowDown,
  ChevronDown, BarChart3, Activity, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

type PageStat = {
  path: string
  title: string
  views: number
  clicks: number
  avgTimeOnPage: number
}

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
  chartDataViews: { name: string; views: number }[]
  chartDataClicks: { name: string; clicks: number }[]
  chartDataDistribution: { name: string; value: number }[]
}

// 10 vivid, maximally distinct colors for the pie chart
const PIE_COLORS = [
  '#8F7A70', // taupe accent
  '#60A5FA', // sky blue
  '#F472B6', // pink
  '#34D399', // emerald
  '#F97316', // orange
  '#A78BFA', // violet
  '#2DD4BF', // teal
  '#FBBF24', // amber
  '#E879F9', // fuchsia
  '#86EFAC', // mint
]

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds}s`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  if (min < 60) return sec > 0 ? `${min}m ${sec}s` : `${min}m`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

function shortenPath(path: string, max = 20): string {
  if (!path) return ''
  if (path.length <= max) return path
  return '…' + path.slice(-(max - 1))
}

const CSS = `

*{box-sizing:border-box}
.an-page{min-height:100vh;background:var(--c-bg);font-family:var(--font-main)}
.an-inner{padding:44px 52px;display:flex;flex-direction:column;gap:32px}

/* Header */
.an-header{display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:28px;border-bottom:1px solid var(--c-border)}
.an-eyebrow{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.an-eyebrow-line{width:20px;height:1px;background:var(--c-accent);flex-shrink:0}
.an-eyebrow-tag{font-size:8px;font-weight:400;letter-spacing:0.44em;text-transform:uppercase;color:rgba(var(--c-accent-rgb),0.65)}
.an-page-title{font-family:var(--font-main);font-size:38px;font-weight:300;color:var(--c-text);line-height:1.05;margin:0 0 6px 0}
.an-page-title em{font-style:italic;color:var(--c-accent)}
.an-page-subtitle{font-size:11px;font-weight:300;color:var(--c-text-muted);letter-spacing:0.08em}
.an-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.an-live{display:flex;align-items:center;gap:8px;font-size:8px;font-weight:400;letter-spacing:0.30em;text-transform:uppercase;color:rgba(74,222,128,0.55)}
.an-live-dot{width:6px;height:6px;border-radius:50%;background:rgba(74,222,128,0.7);animation:an-pulse 2.4s ease-in-out infinite}
@keyframes an-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
.an-refresh-btn{display:inline-flex;align-items:center;gap:6px;background:transparent;border:1px solid rgba(var(--c-accent-rgb),0.18);color:rgba(var(--c-accent-rgb),0.50);font-family:var(--font-main);font-size:8px;font-weight:500;letter-spacing:0.24em;text-transform:uppercase;height:32px;padding:0 14px;cursor:pointer;transition:border-color 0.2s,color 0.2s,background 0.2s;border-radius:var(--radius)}
.an-refresh-btn:hover{border-color:rgba(var(--c-accent-rgb),0.40);color:var(--c-accent);background:rgba(var(--c-accent-rgb),0.04)}
.an-refresh-btn svg{width:11px;height:11px}

/* KPI */
.an-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.an-kpi{background:#ffffff;border:1px solid var(--c-border);padding:24px 22px 20px;position:relative;overflow:hidden;transition:border-color 0.25s,transform 0.25s;cursor:default;border-radius:var(--radius);box-shadow:var(--shadow-md)}
.an-kpi:hover{border-color:rgba(var(--c-accent-rgb),0.26);transform:translateY(-2px)}
.an-kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--c-accent-rgb),0.42),transparent)}
.an-kpi-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}
.an-kpi-icon{width:38px;height:38px;border:1px solid rgba(var(--c-accent-rgb),0.15);display:flex;align-items:center;justify-content:center;color:rgba(var(--c-accent-rgb),0.55);flex-shrink:0;border-radius:var(--radius);background:var(--c-surface)}
.an-kpi-icon svg{width:16px;height:16px}
.an-kpi-label{font-size:7.5px;font-weight:400;letter-spacing:0.40em;text-transform:uppercase;color:rgba(var(--c-accent-rgb),0.42);display:block;margin-bottom:0}
.an-kpi-value{font-family:var(--font-main);font-size:36px;font-weight:300;color:var(--c-text);line-height:1}

/* Section heading */
.an-section-head{display:flex;align-items:center;gap:14px;margin-bottom:16px}
.an-section-line{flex:1;height:1px;background:var(--c-border)}
.an-section-tag{font-size:8px;font-weight:400;letter-spacing:0.44em;text-transform:uppercase;color:var(--c-text-muted);white-space:nowrap}

/* Cards */
.an-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.an-card{background:#ffffff;border:1px solid var(--c-border);position:relative;border-radius:var(--radius);box-shadow:var(--shadow-md)}
.an-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--c-accent-rgb),0.38),transparent);pointer-events:none}
.an-card-header{padding:18px 22px 16px;border-bottom:1px solid var(--c-border);background:var(--c-surface)}
.an-card-title{font-family:var(--font-main);font-size:18px;font-weight:300;color:var(--c-text);margin:0 0 3px 0}
.an-card-title em{font-style:italic;color:var(--c-accent)}
.an-card-subtitle{font-size:9.5px;font-weight:300;color:var(--c-text-muted);letter-spacing:0.08em}
.an-card-body{padding:20px 22px}

/* Pie legend */
.an-pie-legend{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:16px;justify-content:center}
.an-pie-legend-item{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:300;letter-spacing:0.04em;color:var(--c-text-muted)}
.an-pie-legend-swatch{width:9px;height:9px;border-radius:2px;flex-shrink:0}

/* Time list */
.an-time-list{display:flex;flex-direction:column;gap:8px}
.an-time-row{display:flex;align-items:center;gap:14px;padding:12px 16px;background:var(--c-surface);border:1px solid var(--c-border);transition:border-color 0.15s,background 0.15s;border-radius:var(--radius)}
.an-time-row:hover{border-color:rgba(var(--c-accent-rgb),0.16);background:rgba(var(--c-accent-rgb),0.03)}
.an-time-rank{font-family:var(--font-main);font-size:22px;font-weight:300;color:rgba(var(--c-accent-rgb),0.28);width:22px;text-align:center;flex-shrink:0}
.an-time-info{flex:1;min-width:0}
.an-time-path{font-size:11px;font-weight:300;color:var(--c-text);letter-spacing:0.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.an-time-meta{font-size:9px;font-weight:300;color:var(--c-text-muted);letter-spacing:0.06em;margin-top:2px}
.an-time-dur{display:flex;align-items:center;gap:5px;font-family:var(--font-main);font-size:17px;font-weight:300;color:var(--c-accent);flex-shrink:0}
.an-time-dur svg{width:12px;height:12px;color:rgba(var(--c-accent-rgb),0.45)}

/* Insights */
.an-insight-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.an-insight{background:#ffffff;border:1px solid var(--c-border);padding:18px 18px 16px;position:relative;transition:border-color 0.2s,transform 0.2s;border-radius:var(--radius);box-shadow:var(--shadow-md)}
.an-insight:hover{transform:translateY(-1px)}
.an-insight::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--c-accent-rgb),0.28),transparent)}
.an-insight-head{display:flex;align-items:center;gap:9px;margin-bottom:12px}
.an-insight-icon{width:30px;height:30px;border:1px solid rgba(var(--c-accent-rgb),0.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:var(--radius);background:var(--c-surface)}
.an-insight-icon svg{width:13px;height:13px}
.an-insight-title{font-size:8px;font-weight:400;letter-spacing:0.34em;text-transform:uppercase;color:rgba(var(--c-accent-rgb),0.42)}
.an-insight-path{font-size:11px;font-weight:300;color:var(--c-text-muted);letter-spacing:0.04em;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.an-insight-metric{font-family:var(--font-main);font-size:28px;font-weight:300;line-height:1}
.an-insight-metric-unit{font-size:9px;font-weight:300;letter-spacing:0.14em;color:var(--c-text-muted);margin-left:4px;font-family:var(--font-main)}
.an-insight-empty{font-size:10px;font-weight:300;color:var(--c-text-muted);font-style:italic}
.an-insight--up .an-insight-icon{border-color:rgba(74,222,128,0.20);color:rgba(74,222,128,0.65)}
.an-insight--up .an-insight-metric{color:rgba(74,222,128,0.82)}
.an-insight--down .an-insight-icon{border-color:rgba(248,113,113,0.20);color:rgba(248,113,113,0.65)}
.an-insight--down .an-insight-metric{color:rgba(248,113,113,0.78)}
.an-insight--click-up .an-insight-icon{border-color:rgba(96,165,250,0.20);color:rgba(96,165,250,0.65)}
.an-insight--click-up .an-insight-metric{color:rgba(96,165,250,0.82)}
.an-insight--click-down .an-insight-icon{border-color:rgba(251,191,36,0.20);color:rgba(251,191,36,0.65)}
.an-insight--click-down .an-insight-metric{color:rgba(251,191,36,0.82)}

/* Engage */
.an-engage-grid{display:grid;grid-template-columns:repeat(4,1fr)}
.an-engage-item{padding:28px 24px;text-align:center;border-right:1px solid var(--c-border)}
.an-engage-item:last-child{border-right:none}
.an-engage-value{font-family:var(--font-main);font-size:38px;font-weight:300;color:var(--c-accent);line-height:1;margin-bottom:10px}
.an-engage-label{font-size:8px;font-weight:400;letter-spacing:0.38em;text-transform:uppercase;color:var(--c-text-muted)}

/* Table */
.an-table-scroll{overflow-x:auto;scrollbar-width:thin;scrollbar-color:rgba(var(--c-accent-rgb),0.15) transparent}
.an-table-scroll::-webkit-scrollbar{height:3px}
.an-table-scroll::-webkit-scrollbar-thumb{background:rgba(var(--c-accent-rgb),0.18)}
.an-table{width:100%;border-collapse:collapse;min-width:600px}
.an-table thead{background:var(--c-surface);border-bottom:1px solid var(--c-border)}
.an-table th{padding:13px 20px;text-align:left;font-size:7.5px;font-weight:500;letter-spacing:0.38em;text-transform:uppercase;color:rgba(var(--c-accent-rgb),0.45);white-space:nowrap}
.an-table th.an-th-right{text-align:right}
.an-table tbody tr{border-bottom:1px solid var(--c-border);transition:background 0.15s}
.an-table tbody tr:last-child{border-bottom:none}
.an-table tbody tr:hover{background:rgba(var(--c-accent-rgb),0.025)}
.an-table td{padding:14px 20px;font-size:12px;font-weight:300;color:var(--c-text);letter-spacing:0.04em;vertical-align:middle}
.an-table td.an-td-right{text-align:right}
.an-td-num{font-family:'Courier New',monospace;font-size:10px;color:var(--c-text-muted)}
.an-td-path{font-size:12px;font-weight:300;color:var(--c-text);letter-spacing:0.04em;margin-bottom:2px}
.an-td-title{font-size:9.5px;font-weight:300;color:var(--c-text-muted);letter-spacing:0.04em}
.an-td-bar-wrap{display:flex;align-items:center;gap:10px;justify-content:flex-end}
.an-td-bar{height:3px;background:rgba(var(--c-accent-rgb),0.10);flex:1;max-width:80px;position:relative;overflow:hidden}
.an-td-bar-fill{position:absolute;left:0;top:0;height:100%;background:var(--c-accent);transition:width 0.4s}
.an-td-bar-fill--blue{background:rgba(96,165,250,0.65)}
.an-td-val{font-family:var(--font-main);font-size:15px;font-weight:300;white-space:nowrap;min-width:44px;text-align:right}
.an-td-val--gold{color:rgba(var(--c-accent-rgb),0.82)}
.an-td-val--blue{color:rgba(96,165,250,0.78)}
.an-td-val--dim{color:var(--c-text-muted);font-size:13px}

/* Load more */
.an-load-more-wrap{padding:18px;border-top:1px solid var(--c-border);display:flex;justify-content:center}
.an-load-more{position:relative;overflow:hidden;display:inline-flex;align-items:center;gap:8px;background:transparent;border:1px solid rgba(var(--c-accent-rgb),0.22);color:rgba(var(--c-accent-rgb),0.55);font-family:var(--font-main);font-size:8.5px;font-weight:500;letter-spacing:0.26em;text-transform:uppercase;height:38px;padding:0 22px;cursor:pointer;transition:border-color 0.2s,color 0.2s,background 0.2s;border-radius:var(--radius)}
.an-load-more:hover{border-color:rgba(var(--c-accent-rgb),0.45);color:var(--c-accent);background:rgba(var(--c-accent-rgb),0.04)}
.an-load-more:disabled{opacity:0.30;cursor:not-allowed}
.an-load-more svg{width:13px;height:13px}
.an-spin{width:12px;height:12px;border:1px solid rgba(var(--c-accent-rgb),0.3);border-top-color:var(--c-accent);border-radius:50%;animation:an-spin 0.8s linear infinite}
@keyframes an-spin{to{transform:rotate(360deg)}}
.an-all-loaded{padding:12px;border-top:1px solid var(--c-border);text-align:center;font-size:8.5px;font-weight:300;letter-spacing:0.22em;text-transform:uppercase;color:var(--c-text-muted)}

/* States */
.an-state{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:16px}
.an-state-ring{width:36px;height:36px;border:1px solid rgba(var(--c-accent-rgb),0.12);border-top-color:rgba(var(--c-accent-rgb),0.55);border-radius:50%;animation:an-spin 1s linear infinite}
.an-state-label{font-size:9px;font-weight:300;letter-spacing:0.30em;text-transform:uppercase;color:var(--c-text-muted)}
.an-no-data{text-align:center;padding:40px 0;font-size:10px;font-weight:300;letter-spacing:0.18em;color:var(--c-text-muted);font-style:italic}
`

function GoldTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#ffffff', border: '1px solid var(--c-border)', padding: '10px 16px', fontFamily: "var(--font-main)", boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 8, letterSpacing: '0.30em', textTransform: 'uppercase', color: 'rgba(var(--c-accent-rgb),0.50)', marginBottom: 5 }}>{label || payload[0]?.name}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontFamily: "var(--font-main)", fontSize: 18, fontWeight: 300, color: p.fill || 'var(--c-text)' }}>{p.value?.toLocaleString()}</div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{ background: '#ffffff', border: `1px solid ${item.payload.fill}66`, padding: '10px 16px', fontFamily: "var(--font-main)", boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: 8, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: 4 }}>{shortenPath(item.name, 24)}</div>
      <div style={{ fontFamily: "var(--font-main)", fontSize: 20, fontWeight: 300, color: item.payload.fill }}>{item.value?.toLocaleString()} views</div>
    </div>
  )
}

export default function SiteAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [allPageStats, setAllPageStats] = useState<PageStat[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true)
      const res = await fetch(`/api/analytics/detailed?offset=0&limit=5`, { cache: 'no-store' })
      const json = await res.json()
      setData(json)
      setAllPageStats(json.pageStats || [])
      setOffset(json.pageStats?.length || 0)
      setHasMore(json.hasMore ?? false)
    } catch { setData(null) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/analytics/detailed?offset=${offset}&limit=10`, { cache: 'no-store' })
      const json = await res.json()
      setAllPageStats(prev => [...prev, ...(json.pageStats || [])])
      setOffset(prev => prev + (json.pageStats?.length || 0))
      setHasMore(json.hasMore ?? false)
    } catch {} finally { setLoadingMore(false) }
  }

  if (loading) return (<><style>{CSS}</style><div className="an-page"><div className="an-state"><div className="an-state-ring" /><span className="an-state-label">Loading analytics</span></div></div></>)
  if (!data) return (<><style>{CSS}</style><div className="an-page"><div className="an-state"><span className="an-state-label">Failed to load analytics data</span></div></div></>)

  const maxViews = Math.max(...allPageStats.map(p => p.views), 1)
  const maxClicks = Math.max(...allPageStats.map(p => p.clicks), 1)
  const ctr = data.totalViews > 0 ? ((data.totalClicks / data.totalViews) * 100).toFixed(1) : '0'
  const pps = data.totalSessions > 0 ? (data.totalViews / data.totalSessions).toFixed(1) : '0'

  const kpis = [
    { label: 'Page Views', value: data.totalViews.toLocaleString(), icon: Eye },
    { label: 'Total Clicks', value: data.totalClicks.toLocaleString(), icon: MousePointerClick },
    { label: 'Unique Sessions', value: data.totalSessions.toLocaleString(), icon: Users },
    { label: 'Avg Session', value: formatDuration(data.avgSessionDuration), icon: Clock },
  ]
  const insights = [
    { title: 'Most Viewed', page: data.topByViews?.[0], metric: data.topByViews?.[0]?.views, unit: 'views', icon: TrendingUp, variant: 'up' },
    { title: 'Least Viewed', page: data.bottomByViews?.[0], metric: data.bottomByViews?.[0]?.views, unit: 'views', icon: TrendingDown, variant: 'down' },
    { title: 'Most Clicked', page: data.topByClicks?.[0], metric: data.topByClicks?.[0]?.clicks, unit: 'clicks', icon: ArrowUp, variant: 'click-up' },
    { title: 'Least Clicked', page: data.bottomByClicks?.[0], metric: data.bottomByClicks?.[0]?.clicks, unit: 'clicks', icon: ArrowDown, variant: 'click-down' },
  ]
  const pieData = (data.chartDataDistribution || []).map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))

  return (
    <>
      <style>{CSS}</style>
      <div className="an-page">
        <div className="an-inner">

          {/* Header */}
          <div className="an-header">
            <div>
              <div className="an-eyebrow"><span className="an-eyebrow-line" /><span className="an-eyebrow-tag">Dashboard · Insights</span></div>
              <h1 className="an-page-title">Site <em>Analytics</em></h1>
              <p className="an-page-subtitle">{data.totalPages} tracked pages · all-time data</p>
            </div>
            <div className="an-header-right">
              <div className="an-live"><span className="an-live-dot" />Live</div>
              <button className="an-refresh-btn" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCw style={{ animation: refreshing ? 'an-spin 0.8s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="an-kpi-grid">
            {kpis.map(({ label, value, icon: Icon }) => (
              <div className="an-kpi" key={label}>
                <div className="an-kpi-top">
                  <span className="an-kpi-label">{label}</span>
                  <div className="an-kpi-icon"><Icon /></div>
                </div>
                <div className="an-kpi-value">{value}</div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div>
            <div className="an-section-head"><span className="an-section-tag">Traffic</span><span className="an-section-line" /></div>
            <div className="an-chart-grid">
              <div className="an-card">
                <div className="an-card-header">
                  <div className="an-card-title">Top Pages by <em>Views</em></div>
                  <div className="an-card-subtitle">Highest visited pages</div>
                </div>
                <div className="an-card-body">
                  {data.chartDataViews.length > 0 ? (
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chartDataViews} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="rgba(var(--c-accent-rgb),0.06)" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }} />
                          <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }} tickFormatter={(v) => shortenPath(v, 14)} />
                          <Tooltip content={<GoldTooltip />} cursor={{ fill: 'rgba(var(--c-accent-rgb),0.04)' }} />
                          <Bar dataKey="views" radius={[0, 3, 3, 0]} barSize={14}>
                            {data.chartDataViews.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--c-accent)' : `rgba(var(--c-accent-rgb),${Math.max(0.28, 0.62 - i * 0.08)})`} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="an-no-data">No view data yet</p>}
                </div>
              </div>

              <div className="an-card">
                <div className="an-card-header">
                  <div className="an-card-title">Top Pages by <em>Clicks</em></div>
                  <div className="an-card-subtitle">Most interacted pages</div>
                </div>
                <div className="an-card-body">
                  {data.chartDataClicks.length > 0 ? (
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.chartDataClicks} layout="vertical" margin={{ left: 0, right: 20, top: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="rgba(96,165,250,0.06)" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }} />
                          <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }} tickFormatter={(v) => shortenPath(v, 14)} />
                          <Tooltip content={<GoldTooltip />} cursor={{ fill: 'rgba(96,165,250,0.04)' }} />
                          <Bar dataKey="clicks" radius={[0, 3, 3, 0]} barSize={14}>
                            {data.chartDataClicks.map((_, i) => <Cell key={i} fill={i === 0 ? '#60A5FA' : `rgba(96,165,250,${Math.max(0.28, 0.72 - i * 0.08)})`} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="an-no-data">No click data yet</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="an-chart-grid">
            {/* Pie — vivid distinct colors */}
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">Views <em>Distribution</em></div>
                <div className="an-card-subtitle">Share across top pages</div>
              </div>
              <div className="an-card-body">
                {pieData.length > 0 ? (
                  <>
                    <div style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={92} paddingAngle={4} dataKey="value" strokeWidth={0}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.90} />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="an-pie-legend">
                      {pieData.map((d) => {
                        const pct = data.totalViews > 0 ? ((d.value / data.totalViews) * 100).toFixed(1) : '0'
                        return (
                          <div className="an-pie-legend-item" key={d.name}>
                            <span className="an-pie-legend-swatch" style={{ background: d.fill }} />
                            {shortenPath(d.name, 16)} <span style={{ color: d.fill, marginLeft: 3 }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : <p className="an-no-data">No distribution data yet</p>}
              </div>
            </div>

            {/* Time Spent */}
            <div className="an-card">
              <div className="an-card-header">
                <div className="an-card-title">Most <em>Time Spent</em></div>
                <div className="an-card-subtitle">Deepest engagement pages</div>
              </div>
              <div className="an-card-body">
                {(data.topByTimeSpent || []).length > 0 ? (
                  <div className="an-time-list">
                    {data.topByTimeSpent.map((p, i) => (
                      <div className="an-time-row" key={p.path}>
                        <span className="an-time-rank">{i + 1}</span>
                        <div className="an-time-info">
                          <div className="an-time-path" title={p.path}>{p.path}</div>
                          <div className="an-time-meta">{p.views.toLocaleString()} views · {p.clicks.toLocaleString()} clicks</div>
                        </div>
                        <div className="an-time-dur"><Clock />{formatDuration(p.avgTimeOnPage)}</div>
                      </div>
                    ))}
                  </div>
                ) : <p className="an-no-data">No duration data yet</p>}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div>
            <div className="an-section-head"><span className="an-section-tag">Performance Insights</span><span className="an-section-line" /></div>
            <div className="an-insight-grid">
              {insights.map(({ title, page, metric, unit, icon: Icon, variant }) => (
                <div className={`an-insight an-insight--${variant}`} key={title}>
                  <div className="an-insight-head">
                    <div className="an-insight-icon"><Icon size={13} /></div>
                    <span className="an-insight-title">{title}</span>
                  </div>
                  {page ? (
                    <>
                      <div className="an-insight-path" title={page.path}>{page.path}</div>
                      <div className="an-insight-metric">{metric?.toLocaleString()}<span className="an-insight-metric-unit">{unit}</span></div>
                    </>
                  ) : <span className="an-insight-empty">No data available</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Overview */}
          <div>
            <div className="an-section-head"><span className="an-section-tag">Engagement Overview</span><span className="an-section-line" /></div>
            <div className="an-card">
              <div className="an-engage-grid">
                {[
                  { value: data.totalPages, label: 'Tracked Pages' },
                  { value: pps, label: 'Pages / Session' },
                  { value: `${ctr}%`, label: 'Click-through Rate' },
                  { value: formatDuration(data.avgSessionDuration), label: 'Avg Session Duration' },
                ].map(({ value, label }) => (
                  <div className="an-engage-item" key={label}>
                    <div className="an-engage-value">{value}</div>
                    <div className="an-engage-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div>
            <div className="an-section-head">
              <span className="an-section-tag">Detailed Page Statistics</span>
              <span className="an-section-line" />
              <span style={{ fontSize: 9, color: 'var(--c-text-muted)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{allPageStats.length} / {data.totalPages} pages</span>
            </div>
            <div className="an-card">
              <div className="an-table-scroll">
                <table className="an-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th>Page Path</th>
                      <th className="an-th-right">Views</th>
                      <th className="an-th-right">Clicks</th>
                      <th className="an-th-right">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPageStats.map((p, i) => (
                      <tr key={`${p.path}-${i}`}>
                        <td><span className="an-td-num">{i + 1}</span></td>
                        <td>
                          <div className="an-td-path" title={p.path}>{p.path}</div>
                          {p.title && p.title !== p.path && <div className="an-td-title">{p.title}</div>}
                        </td>
                        <td className="an-td-right">
                          <div className="an-td-bar-wrap">
                            <div className="an-td-bar"><div className="an-td-bar-fill" style={{ width: `${(p.views / maxViews) * 100}%` }} /></div>
                            <span className="an-td-val an-td-val--gold">{p.views.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="an-td-right">
                          <div className="an-td-bar-wrap">
                            <div className="an-td-bar"><div className="an-td-bar-fill an-td-bar-fill--blue" style={{ width: `${(p.clicks / maxClicks) * 100}%` }} /></div>
                            <span className="an-td-val an-td-val--blue">{p.clicks.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="an-td-right"><span className="an-td-val an-td-val--dim">{formatDuration(p.avgTimeOnPage)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasMore && (
                <div className="an-load-more-wrap">
                  <button onClick={loadMore} disabled={loadingMore} className="an-load-more">
                    {loadingMore ? <><span className="an-spin" />Loading…</> : <><ChevronDown size={13} />Load More</>}
                  </button>
                </div>
              )}
              {!hasMore && allPageStats.length > 0 && <div className="an-all-loaded">All {data.totalPages} pages loaded</div>}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
