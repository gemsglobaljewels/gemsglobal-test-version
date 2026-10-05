'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Send, Paperclip } from 'lucide-react'

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
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

.ch-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: 'Jost', sans-serif;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.ch-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-shrink: 0;
}
.ch-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 0 16px;
  height: 34px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  flex-shrink: 0;
}
.ch-back:hover { border-color: rgba(212,175,55,0.4); color: #D4AF37; background: rgba(212,175,55,0.04); }
.ch-back svg { width: 12px; height: 12px; }
.ch-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.ch-eyebrow-line { width: 20px; height: 1px; background: #D4AF37; flex-shrink: 0; }
.ch-eyebrow-tag { font-size: 8px; font-weight: 400; letter-spacing: 0.44em; text-transform: uppercase; color: rgba(212,175,55,0.65); }
.ch-page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: #F0EBE0; margin: 0 0 4px 0; line-height: 1.1; }
.ch-page-title em { font-style: italic; color: #D4AF37; }
.ch-page-subtitle { font-size: 10px; font-weight: 300; color: rgba(235,229,216,0.35); letter-spacing: 0.06em; }

/* ── Chat window ── */
.ch-window {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 240px);
}
.ch-window::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.45), transparent);
  pointer-events: none; z-index: 1;
}

/* ── Message list ── */
.ch-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 22px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scrollbar-width: thin;
  scrollbar-color: rgba(212,175,55,0.15) transparent;
}
.ch-messages::-webkit-scrollbar { width: 4px; }
.ch-messages::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.18); border-radius: 2px; }

/* ── Bubble row ── */
.ch-row { display: flex; }
.ch-row--admin { justify-content: flex-end; }
.ch-row--user { justify-content: flex-start; }

/* ── Bubbles ── */
.ch-bubble {
  max-width: 65%;
  padding: 10px 14px;
  position: relative;
}
.ch-bubble--admin {
  background: #D4AF37;
  color: #0a0806;
}
.ch-bubble--user {
  background: rgba(235,229,216,0.05);
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(235,229,216,0.82);
}
.ch-bubble-content {
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  line-height: 1.6;
  letter-spacing: 0.03em;
  word-break: break-word;
}
.ch-bubble--admin .ch-bubble-content { color: #0d0b08; font-weight: 400; }
.ch-bubble-time {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.08em;
  margin-top: 5px;
  text-align: right;
  opacity: 0.55;
}
.ch-bubble--admin .ch-bubble-time { color: rgba(10,8,6,0.7); }
.ch-bubble--user .ch-bubble-time { color: rgba(235,229,216,0.35); }

/* Image attachment */
.ch-bubble-img {
  max-width: 100%;
  display: block;
  margin-bottom: 6px;
}

/* Sender label */
.ch-sender-label {
  font-size: 7.5px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-bottom: 5px;
}
.ch-sender-label--admin { color: rgba(212,175,55,0.55); text-align: right; }
.ch-sender-label--user { color: rgba(235,229,216,0.25); }

/* ── Empty state ── */
.ch-empty {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  flex: 1; gap: 12px; padding: 48px 0;
}
.ch-empty-label { font-size: 9px; font-weight: 300; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(235,229,216,0.20); }

/* ── Composer ── */
.ch-composer {
  border-top: 1px solid rgba(212,175,55,0.08);
  padding: 16px 22px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  background: rgba(10,8,6,0.6);
}

/* Attach button */
.ch-attach-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 40px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.14);
  color: rgba(212,175,55,0.40);
  cursor: pointer;
  flex-shrink: 0;
  transition: border-color 0.2s, color 0.2s;
  position: relative;
}
.ch-attach-label:hover { border-color: rgba(212,175,55,0.35); color: rgba(212,175,55,0.7); }
.ch-attach-label svg { width: 14px; height: 14px; }
.ch-attach-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* Text input */
.ch-input {
  flex: 1;
  height: 40px;
  padding: 0 14px;
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  font-weight: 300;
  color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
.ch-input::placeholder { color: rgba(235,229,216,0.18); }
.ch-input:focus { border-color: rgba(212,175,55,0.38); background: rgba(235,229,216,0.06); }

/* Send button */
.ch-send {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  background: #D4AF37;
  color: #0a0806;
  border: none;
  font-family: 'Jost', sans-serif;
  font-size: 8.5px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  height: 40px;
  padding: 0 20px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, box-shadow 0.2s;
}
.ch-send:hover { background: #E8D48B; box-shadow: 0 4px 18px rgba(212,175,55,0.25); }
.ch-send::before {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg);
  transition: left 0.4s;
}
.ch-send:hover::before { left: 160%; }
.ch-send:disabled { opacity: 0.40; cursor: not-allowed; }
.ch-send:disabled::before { display: none; }
.ch-send svg { width: 13px; height: 13px; }

/* Pending file indicator */
.ch-file-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(212,175,55,0.08);
  border: 1px solid rgba(212,175,55,0.20);
  padding: 0 10px;
  height: 40px;
  font-size: 9px;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: rgba(212,175,55,0.65);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}
.ch-file-pill-x {
  background: transparent;
  border: none;
  color: rgba(212,175,55,0.4);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  margin-left: 2px;
  flex-shrink: 0;
}
.ch-file-pill-x:hover { color: rgba(212,175,55,0.8); }
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
      <div className="ch-page">

        {/* Header */}
        <div className="ch-header">
          <div>
            <div className="ch-eyebrow">
              <span className="ch-eyebrow-line" style={{ width: 20, height: 1, background: '#D4AF37', flexShrink: 0, display: 'block' }} />
              <span className="ch-eyebrow-tag">Messaging</span>
            </div>
            <h1 className="ch-page-title">Client <em>Conversation</em></h1>
            <p className="ch-page-subtitle">Thread {threadId}</p>
          </div>
          <Link href="/admin/messaging" className="ch-back">
            <ArrowLeft />
            Back to Inbox
          </Link>
        </div>

        {/* Chat Window */}
        <div className="ch-window">

          {/* Messages */}
          <div ref={listRef} className="ch-messages">
            {messages.length === 0 ? (
              <div className="ch-empty">
                <span className="ch-empty-label">No messages in this conversation</span>
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
            <label className="ch-attach-label" title="Attach file">
              <Paperclip />
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
                {pendingFile.name}
                <button
                  className="ch-file-pill-x"
                  onClick={() => {
                    setPendingFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >×</button>
              </div>
            )}

            {/* Text input */}
            <input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Type a reply…"
              className="ch-input"
            />

            {/* Send */}
            <button onClick={send} disabled={sending} className="ch-send">
              {sending ? 'Sending…' : <><Send />Send</>}
            </button>

          </div>
        </div>
      </div>
    </>
  )
}