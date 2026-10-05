'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Send, Paperclip, X } from 'lucide-react'

type Msg = {
  id: string
  sender: 'user' | 'admin'
  content: string | null
  file_url?: string | null
  file_name?: string | null
  content_type?: string | null
  created_at: string
}

const CSS = `
/* Bespoke chat layout: scrollable thread + bubbles + composer */
.ch-window {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 280px);
}
.ch-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--c-border-strong) transparent;
}
.ch-messages::-webkit-scrollbar { width: 6px; }
.ch-messages::-webkit-scrollbar-thumb { background: var(--c-border-strong); border-radius: 3px; }

.ch-row { display: flex; }
.ch-row--admin { justify-content: flex-end; }
.ch-row--user { justify-content: flex-start; }

.ch-bubble {
  max-width: 66%;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-family: var(--font-dmsans);
}
.ch-bubble--admin {
  background: var(--c-accent);
  color: #fff;
  border-bottom-right-radius: 4px;
}
.ch-bubble--user {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  color: var(--c-text);
  border-bottom-left-radius: 4px;
}
.ch-bubble-content {
  font-size: 13px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
  word-break: break-word;
}
.ch-bubble--admin .ch-bubble-content { color: #fff; }
.ch-bubble-time {
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.08em;
  margin-top: 6px;
  text-align: right;
}
.ch-bubble--admin .ch-bubble-time { color: rgba(255,255,255,0.72); }
.ch-bubble--user .ch-bubble-time { color: var(--c-text-faint); }

.ch-bubble-img {
  max-width: 100%;
  display: block;
  margin-bottom: 6px;
  border-radius: var(--radius-sm);
}

.ch-sender-label {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.ch-sender-label--admin { color: var(--c-accent); text-align: right; }
.ch-sender-label--user { color: var(--c-text-faint); }

.ch-composer {
  border-top: 1px solid var(--c-border);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  background: var(--c-surface);
}
.ch-attach {
  position: relative;
  flex-shrink: 0;
  cursor: pointer;
}
.ch-attach-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.ch-file-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 0 8px 0 12px;
  height: 42px;
  font-family: var(--font-dmsans);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--c-text-muted);
  max-width: 160px;
  flex-shrink: 0;
}
.ch-file-pill-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ch-file-pill-x {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--c-text-faint);
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
  transition: color 0.18s ease;
}
.ch-file-pill-x:hover { color: var(--c-danger); }
.ch-composer .ch-input { flex: 1; }
`

export default function AdminChatPage() {
  const params = useParams()
  const id = params?.id as string

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [now, setNow] = useState<number>(Date.now())

  const endRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const typingTimer = useRef<any>(null)
  const firstLoad = useRef(true)
  const scrollOnNext = useRef(false)
  const prevLen = useRef(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function load() {
    const r = await fetch(`/api/messages/${id}`, { cache: 'no-store' })
    const j = await r.json()
    setMessages(Array.isArray(j) ? j : [])
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    let alive = true
    const t = setInterval(() => {
      if (alive && !document.hidden) load()
    }, 4000)
    return () => { alive = false; clearInterval(t) }
  }, [id])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false
      prevLen.current = messages.length
      return
    }
    if (scrollOnNext.current || messages.length > prevLen.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
      scrollOnNext.current = false
    }
    prevLen.current = messages.length
  }, [messages])

  async function send() {
    const text = input.trim()
    if ((!text && !pendingFile) || sending) return
    setSending(true)
    scrollOnNext.current = true

    try {
      if (pendingFile) {
        const fd = new FormData()
        fd.append('file', pendingFile)
        const r = await fetch('/api/messages/upload', { method: 'POST', body: fd })
        const j = await r.json().catch(() => ({}))
        if (j?.url) {
          const ct = pendingFile.type || ''
          await fetch(`/api/messages/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: text || '',
              fileUrl: j.url,
              fileName: j.name || pendingFile.name,
              contentType: ct,
            }),
          })
        }
        setPendingFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        await fetch(`/api/messages/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        })
      }
      setInput('')
      await load()
    } finally {
      setSending(false)
    }
  }

  function onInputChange(v: string) {
    setInput(v)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(async () => {
      try {
        await fetch('/api/messages/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id, actor: 'admin' }),
        })
      } catch { }
    }, 1000)
  }

  function fmtTime(ts: string) {
    const d = new Date(ts)
    const diff = Math.floor((now - d.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  const threadId = id ? `#${id.slice(0, 8)}` : ''

  return (
    <>
      <style>{CSS}</style>
      <div className="a-page">

        {/* Header */}
        <Link href="/admin/messaging" className="a-back">
          <ArrowLeft size={14} />
          Back to Inbox
        </Link>

        <div className="a-head">
          <div>
            <div className="a-eyebrow">Messaging</div>
            <h1 className="a-title">Client <em>Conversation</em></h1>
            <p className="a-subtitle">Thread {threadId}</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="a-card ch-window">

          {/* Messages */}
          <div ref={listRef} className="ch-messages">
            {messages.length === 0 ? (
              <div className="a-empty">
                <div className="a-empty-title">No messages yet</div>
                <div className="a-empty-text">There are no messages in this conversation.</div>
              </div>
            ) : (
              messages.map((m) => {
                const isAdmin = m.sender === 'admin'
                return (
                  <div key={m.id}>
                    <div className={`ch-sender-label ch-sender-label--${isAdmin ? 'admin' : 'user'}`}>
                      {isAdmin ? 'You' : 'Customer'}
                    </div>
                    <div className={`ch-row ch-row--${isAdmin ? 'admin' : 'user'}`}>
                      <div className={`ch-bubble ch-bubble--${isAdmin ? 'admin' : 'user'}`}>
                        {m.file_url && (m.content_type || '').startsWith('image') && (
                          <img src={m.file_url} alt={m.file_name || 'attachment'} className="ch-bubble-img" />
                        )}
                        {m.content && (
                          <div className="ch-bubble-content">{m.content}</div>
                        )}
                        <div className="ch-bubble-time">{fmtTime(m.created_at)}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="ch-composer">

            {/* Attach */}
            <label className="a-icon-btn ch-attach" title="Attach file">
              <Paperclip size={16} />
              <input
                ref={fileInputRef}
                type="file"
                className="ch-attach-input"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setPendingFile(f)
                }}
              />
            </label>

            {/* Pending file pill */}
            {pendingFile && (
              <div className="ch-file-pill">
                <span className="ch-file-pill-name">{pendingFile.name}</span>
                <button
                  className="ch-file-pill-x"
                  title="Remove file"
                  onClick={() => {
                    setPendingFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Text input */}
            <input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a reply…"
              className="a-input ch-input"
            />

            {/* Send */}
            <button onClick={send} disabled={sending} className="a-btn a-btn--primary">
              {sending ? 'Sending…' : <><Send size={14} />Send</>}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}
