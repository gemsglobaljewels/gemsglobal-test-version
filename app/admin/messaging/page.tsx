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
    <div className="a-page">

      {/* Header */}
      <header className="a-head">
        <div>
          <div className="a-eyebrow">Inbox</div>
          <h1 className="a-title">Client <em>Messages</em></h1>
          <p className="a-subtitle">
            {unreadTotal > 0
              ? `${unreadTotal} conversation${unreadTotal > 1 ? 's' : ''} awaiting reply`
              : 'All customer conversations'}
          </p>
        </div>
        <div className="a-head-actions">
          <span className="a-badge a-badge--success">
            <span className="a-dot a-dot--success a-dot--pulse" />
            Live
          </span>
          {unreadTotal > 0 && (
            <span className="a-badge a-badge--accent">
              {unreadTotal} unread
            </span>
          )}
        </div>
      </header>

      {/* Inbox */}
      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Last Message</th>
                <th className="a-td-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading conversations</span>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><MessageSquare /></div>
                      <div className="a-empty-title">No conversations yet</div>
                      <div className="a-empty-text">Customer messages will appear here as they arrive.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((thread) => {
                  const isUnread = thread.last_message?.sender === 'user'
                  return (
                    <tr key={thread.id} className={isUnread ? 'is-unread' : undefined}>
                      {/* Customer */}
                      <td>
                        <Link
                          href={`/admin/messaging/${thread.id}`}
                          className="a-cell-name a-row"
                          style={{ gap: 10, textDecoration: 'none', color: 'inherit' }}
                        >
                          {isUnread && <span className="a-dot a-dot--accent" />}
                          <span>
                            <span className="a-cell-name">
                              {thread.user_name || thread.user_email || 'Guest'}
                            </span>
                            {thread.user_email && thread.user_name && (
                              <span className="a-cell-meta">{thread.user_email}</span>
                            )}
                          </span>
                        </Link>
                      </td>

                      {/* Last Message */}
                      <td>
                        <Link
                          href={`/admin/messaging/${thread.id}`}
                          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        >
                          {thread.last_message?.content ? (
                            <span
                              className={isUnread ? 'mg-preview mg-preview--unread' : 'mg-preview'}
                            >
                              {thread.last_message.content}
                            </span>
                          ) : (
                            <span className="a-muted" style={{ fontStyle: 'italic' }}>
                              No messages
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* Time */}
                      <td className="a-td-right">
                        <Link
                          href={`/admin/messaging/${thread.id}`}
                          className="a-cell-meta a-mono"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {formatTime(thread.last_message?.created_at)}
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page-local styling: unread row accent + single-line message preview */}
      <style>{`
        .a-dot--accent { background: var(--c-accent); }
        .a-table tbody tr.is-unread { background: var(--c-accent-soft); }
        .a-table tbody tr.is-unread td:first-child {
          box-shadow: inset 2px 0 0 var(--c-accent);
        }
        .mg-preview {
          display: block;
          max-width: 520px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          color: var(--c-text-muted);
          font-family: var(--font-dmsans);
        }
        .mg-preview--unread { color: var(--c-text); font-weight: 500; }
        @media (max-width: 640px) {
          .a-table thead th:nth-child(2),
          .a-table tbody td:nth-child(2) { display: none; }
        }
      `}</style>
    </div>
  )
}
