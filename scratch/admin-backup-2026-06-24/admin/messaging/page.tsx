'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

type Thread = {
  id: string
  user_name?: string | null
  user_email?: string | null
  created_at?: string
  last_message?: { content: string; created_at: string; sender: string } | null
  unread_count?: number
}

const CSS = `


.mg-page {
  min-height: 100vh;
  background: var(--c-bg);
  padding: 40px 48px;
  font-family: var(--font-main);
}

/* ── Page Header ── */
.mg-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.mg-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.mg-eyebrow-line { width: 20px; height: 1px; background: var(--c-accent); flex-shrink: 0; }
.mg-eyebrow-tag {
  font-size: 8px; font-weight: 400; letter-spacing: 0.44em;
  text-transform: uppercase; color: rgba(var(--c-accent-rgb),0.65);
}
.mg-page-title {
  font-family: var(--font-main);
  font-size: 36px; font-weight: 300; color: var(--c-text);
  line-height: 1.1; margin: 0 0 6px 0;
}
.mg-page-title em { font-style: italic; color: var(--c-accent); }
.mg-page-subtitle {
  font-size: 11px; font-weight: 300;
  color: var(--c-text-muted); letter-spacing: 0.06em;
}

/* ── Live indicator ── */
.mg-live {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 8px;
  font-weight: 400;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(74,222,128,0.55);
}
.mg-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(74,222,128,0.7);
  animation: mg-pulse 2s ease-in-out infinite;
}
@keyframes mg-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

/* ── Inbox Card ── */
.mg-card {
  background: #fff;
  border: 1px solid var(--c-border);
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
}
.mg-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb),0.45), transparent);
  pointer-events: none; z-index: 1;
}

/* ── Table Header ── */
.mg-thead {
  display: grid;
  grid-template-columns: 260px 1fr 120px;
  padding: 12px 22px;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
}
.mg-th {
  font-size: 7.5px; font-weight: 500; letter-spacing: 0.38em;
  text-transform: uppercase; color: rgba(var(--c-accent-rgb),0.45);
}
.mg-th--right { text-align: right; }

/* ── Thread Rows ── */
.mg-thread {
  display: grid;
  grid-template-columns: 260px 1fr 120px;
  padding: 16px 22px;
  border-bottom: 1px solid var(--c-border);
  text-decoration: none;
  transition: background 0.15s;
  position: relative;
  align-items: center;
}
.mg-thread:last-child { border-bottom: none; }
.mg-thread:hover { background: rgba(var(--c-accent-rgb),0.03); }

/* Unread — sender is user */
.mg-thread--unread {
  background: rgba(var(--c-accent-rgb),0.035);
}
.mg-thread--unread::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--c-accent);
}

/* ── User cell ── */
.mg-user-name {
  font-size: 12px; font-weight: 400;
  color: var(--c-text);
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}
.mg-user-email {
  font-size: 10px; font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.04em;
}

/* ── Message cell ── */
.mg-message-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  padding-right: 16px;
}
.mg-unread-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--c-accent);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(var(--c-accent-rgb),0.5);
}
.mg-message-text {
  font-size: 11px; font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mg-message-text--unread {
  color: var(--c-text);
  font-weight: 400;
}
.mg-message-empty {
  font-size: 11px; font-weight: 300;
  color: var(--c-text-muted);
  font-style: italic;
}

/* ── Time cell ── */
.mg-time {
  font-size: 10px; font-weight: 300;
  color: var(--c-text-muted);
  letter-spacing: 0.06em;
  text-align: right;
}

/* ── States ── */
.mg-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 64px 0; gap: 14px;
}
.mg-state-icon {
  width: 44px; height: 44px;
  border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center;
  color: rgba(var(--c-accent-rgb),0.22);
  border-radius: var(--radius);
  background: var(--c-surface);
}
.mg-state-icon svg { width: 20px; height: 20px; }
.mg-state-label {
  font-size: 9px; font-weight: 300; letter-spacing: 0.28em;
  text-transform: uppercase; color: var(--c-text-muted);
}
.mg-loading-ring {
  width: 28px; height: 28px;
  border: 1px solid var(--c-border);
  border-top-color: rgba(var(--c-accent-rgb),0.55);
  border-radius: 50%;
  animation: mg-spin 1s linear infinite;
}
@keyframes mg-spin { to { transform: rotate(360deg); } }

/* ── Count badge ── */
.mg-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--c-accent);
  color: #080604;
  font-size: 7px;
  font-weight: 500;
  letter-spacing: 0.10em;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 50px;
}
`

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function AdminMessagingPage() {
  const [rows, setRows] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const firstLoad = useRef(true)

  async function load() {
    try {
      if (firstLoad.current) setLoading(true)
      const r = await fetch('/api/messages/inbox', { cache: 'no-store' })
      const j = await r.json()
      setRows(Array.isArray(j) ? j : [])
    } finally {
      if (firstLoad.current) {
        setLoading(false)
        firstLoad.current = false
      }
    }
  }

  useEffect(() => {
    let alive = true
    load()
    const t = setInterval(() => {
      if (alive && !document.hidden) load()
    }, 8000)
    return () => { alive = false; clearInterval(t) }
  }, [])

  const unreadTotal = rows.filter(r => r.last_message?.sender === 'user').length

  return (
    <>
      <style>{CSS}</style>
      <div className="mg-page">

        {/* Header */}
        <div className="mg-header">
          <div>
            <div className="mg-eyebrow">
              <span className="mg-eyebrow-line" />
              <span className="mg-eyebrow-tag">Inbox</span>
            </div>
            <h1 className="mg-page-title">Client <em>Messages</em></h1>
            <p className="mg-page-subtitle">
              {unreadTotal > 0
                ? `${unreadTotal} conversation${unreadTotal > 1 ? 's' : ''} awaiting reply`
                : 'All customer conversations'}
            </p>
          </div>

          {/* Live pulse */}
          <div className="mg-live">
            <span className="mg-live-dot" />
            Live
          </div>
        </div>

        {/* Inbox Card */}
        <div className="mg-card">

          {/* Column headers */}
          <div className="mg-thead">
            <div className="mg-th">Customer</div>
            <div className="mg-th">Last Message</div>
            <div className="mg-th mg-th--right">Time</div>
          </div>

          {/* States */}
          {loading ? (
            <div className="mg-state">
              <div className="mg-loading-ring" />
              <span className="mg-state-label">Loading conversations</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="mg-state">
              <div className="mg-state-icon"><MessageSquare /></div>
              <span className="mg-state-label">No conversations yet</span>
            </div>
          ) : (
            rows.map((thread) => {
              const isUnread = thread.last_message?.sender === 'user'
              return (
                <Link
                  key={thread.id}
                  href={`/admin/messaging/${thread.id}`}
                  className={`mg-thread${isUnread ? ' mg-thread--unread' : ''}`}
                >
                  {/* User */}
                  <div>
                    <div className="mg-user-name">
                      {thread.user_name || thread.user_email || 'Guest'}
                    </div>
                    {thread.user_email && thread.user_name && (
                      <div className="mg-user-email">{thread.user_email}</div>
                    )}
                  </div>

                  {/* Message */}
                  <div className="mg-message-wrap">
                    {isUnread && <span className="mg-unread-dot" />}
                    {thread.last_message?.content ? (
                      <span className={`mg-message-text${isUnread ? ' mg-message-text--unread' : ''}`}>
                        {thread.last_message.content}
                      </span>
                    ) : (
                      <span className="mg-message-empty">No messages</span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="mg-time">
                    {formatTime(thread.last_message?.created_at)}
                  </div>
                </Link>
              )
            })
          )}
        </div>

      </div>
    </>
  )
}
