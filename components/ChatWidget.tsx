'use client'

import { useCallback, useEffect, useMemo, useRef, useState, Component, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { getUser, getSettings, type User } from '@/lib/authStore'
import { X, Paperclip, ArrowUp, MessageCircle } from 'lucide-react'

/* ════════════════════════════════════════════════════════════════════════
   CONCIERGE CHAT — clean, white, on-brand
   Single continuous conversation (no history, no sessions). White panel,
   the site's mocha (#8F7A70) as the only accent, generous whitespace,
   quiet shadows. Advisor speaks on soft ivory; you reply in mocha.
   ════════════════════════════════════════════════════════════════════════ */

// Error Boundary — never let the widget take the whole site down.
class ChatErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: any, errorInfo: any) { console.error('ChatWidget Error:', error, errorInfo) }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

type ChatMsg = {
  role: 'user' | 'assistant'
  content: string
  readAt?: string | null
  createdAt?: string | null
  fileUrl?: string | null
  contentType?: string | null
  // client-only: optimistic message awaiting server confirmation
  clientId?: string
  pending?: boolean
}

const CSS = `
/* shared tokens on both fixed roots */
.cw-fab, .cw-wrap {
  --cw-white:#FFFFFF; --cw-bg:#FAF9F6; --cw-surface:#F4F0EA; --cw-surface2:#EFEAE2;
  --cw-accent:#8F7A70; --cw-accent-d:#7A665C; --cw-accent-t:rgba(143,122,112,.10);
  --cw-ink:#2C231E; --cw-sub:#8A7F76; --cw-faint:#B5ACA3;
  --cw-line:#EAE4DB; --cw-line2:#DED6CA;
  --cw-ok:#4E9A5E; --cw-err:#B94040;
  --cw-e:cubic-bezier(.22,1,.36,1); --cw-spring:cubic-bezier(.34,1.56,.64,1);
  --cw-serif:var(--font-playfair,var(--font-cormorant),'Cormorant Garamond',Georgia,serif);
  --cw-sans:var(--font-jost,var(--font-dmsans),'Jost','Montserrat',system-ui,sans-serif);
}

/* ══════════ LAUNCHER — simple round chat button ══════════ */
.cw-fab{
  position:fixed; left:24px; bottom:64px; z-index:99990;
  width:56px; height:56px; border-radius:50%; border:none; cursor:pointer; padding:0;
  background:var(--cw-accent); color:#fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 6px 24px rgba(44,35,30,.24), 0 2px 6px rgba(44,35,30,.14);
  -webkit-tap-highlight-color:transparent;
  transition:transform .3s var(--cw-spring), box-shadow .3s var(--cw-e), background .3s;
  animation:cwFabIn .5s var(--cw-e) both;
}
.cw-fab:hover{ background:var(--cw-accent-d); transform:translateY(-2px); box-shadow:0 10px 30px rgba(44,35,30,.28), 0 3px 8px rgba(44,35,30,.16); }
.cw-fab:active{ transform:translateY(0) scale(.96); }
.cw-fab:focus-visible{ outline:2px solid var(--cw-accent); outline-offset:3px; }
.cw-fab svg{ display:block; }
@keyframes cwFabIn{ from{opacity:0; transform:translateY(12px)} to{opacity:1; transform:translateY(0)} }

/* ══════════ SCRIM (mobile) ══════════ */
.cw-scrim{
  position:fixed; inset:0; z-index:100000; background:rgba(44,35,30,.32);
  opacity:0; pointer-events:none; transition:opacity .4s var(--cw-e); display:none;
}
.cw-scrim.show{ opacity:1; pointer-events:auto; }

/* ══════════ PANEL ══════════ */
.cw-wrap{
  position:fixed; left:24px; bottom:96px; z-index:100001;
  width:min(400px,94vw);
  opacity:0; transform:translateY(16px) scale(.98); transform-origin:bottom left;
  pointer-events:none; transition:opacity .35s var(--cw-e), transform .4s var(--cw-e);
}
.cw-wrap.open{ opacity:1; transform:translateY(0) scale(1); pointer-events:auto; }

.cw-panel{
  display:flex; flex-direction:column; overflow:hidden;
  height:min(640px,84vh); border-radius:20px;
  background:var(--cw-white); border:1px solid var(--cw-line);
  box-shadow:0 24px 64px rgba(44,35,30,.18), 0 4px 16px rgba(44,35,30,.08);
}

/* ── HEADER ── */
.cw-head{
  flex-shrink:0; display:flex; align-items:center; gap:12px;
  padding:16px 18px; background:var(--cw-white); border-bottom:1px solid var(--cw-line);
}
.cw-ava{
  flex-shrink:0; width:42px; height:42px; border-radius:50%; overflow:hidden;
  background:var(--cw-bg); border:1px solid var(--cw-line);
  display:flex; align-items:center; justify-content:center;
}
.cw-ava img{ width:100%; height:100%; object-fit:contain; padding:6px; }
.cw-ava span{ font-family:var(--cw-serif); font-size:18px; font-weight:600; color:var(--cw-accent); }
.cw-head-id{ flex:1; min-width:0; }
.cw-head-name{
  font-family:var(--cw-serif); font-size:17px; font-weight:600; color:var(--cw-ink);
  line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.cw-head-status{ display:flex; align-items:center; gap:6px; margin-top:2px; font-family:var(--cw-sans); font-size:11.5px; color:var(--cw-sub); }
.cw-dot{ width:7px; height:7px; border-radius:50%; background:var(--cw-ok); flex-shrink:0; }
.cw-x{
  flex-shrink:0; width:32px; height:32px; border-radius:50%; border:none;
  background:transparent; color:var(--cw-sub);
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition:background .25s var(--cw-e), color .25s;
}
.cw-x:hover{ background:var(--cw-surface); color:var(--cw-ink); }

/* ── BODY ── */
.cw-body{
  position:relative; flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;
  padding:18px 16px 20px; background:var(--cw-bg);
  display:flex; flex-direction:column; gap:2px;
  scrollbar-width:thin; scrollbar-color:var(--cw-line2) transparent;
}
.cw-body::-webkit-scrollbar{ width:5px; }
.cw-body::-webkit-scrollbar-thumb{ background:var(--cw-line2); border-radius:10px; }

/* day divider */
.cw-day{ display:flex; align-items:center; justify-content:center; margin:14px 0 10px; }
.cw-day span{
  font-family:var(--cw-sans); font-size:10px; font-weight:600; letter-spacing:.1em;
  text-transform:uppercase; color:var(--cw-faint);
}

/* rows */
.cw-row{ display:flex; flex-direction:column; animation:cwRise .3s var(--cw-e) both; }
.cw-row.usr{ align-items:flex-end; padding-left:48px; }
.cw-row.adv{ align-items:flex-start; padding-right:48px; }
@keyframes cwRise{ from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:translateY(0)} }

/* advisor bubble — soft ivory */
.cw-adv{
  max-width:100%; padding:11px 15px; margin:4px 0;
  background:var(--cw-surface); border-radius:16px 16px 16px 5px;
}
.cw-adv-tx{ font-family:var(--cw-sans); font-size:13.5px; line-height:1.55; color:var(--cw-ink); white-space:pre-wrap; word-break:break-word; }

/* user bubble — mocha */
.cw-usr{
  max-width:100%; padding:11px 15px; margin:4px 0;
  background:var(--cw-accent); color:#fff;
  font-family:var(--cw-sans); font-size:13.5px; line-height:1.55;
  border-radius:16px 16px 5px 16px;
  white-space:pre-wrap; word-break:break-word;
}

/* image attachment */
.cw-plate{ padding:4px; background:var(--cw-white); border:1px solid var(--cw-line); border-radius:12px; margin-bottom:6px; cursor:zoom-in; max-width:210px; }
.cw-plate img{ display:block; width:100%; border-radius:9px; }

/* meta line */
.cw-meta{ display:flex; align-items:center; gap:5px; margin-top:2px; padding:0 4px; font-family:var(--cw-sans); font-size:10px; color:var(--cw-faint); }
.cw-tick{ display:inline-flex; color:var(--cw-line2); transition:color .3s var(--cw-e); }
.cw-tick.read{ color:var(--cw-accent); }

/* typing */
.cw-typing{ display:flex; align-items:flex-start; padding-right:48px; animation:cwRise .3s var(--cw-e) both; }
.cw-typing-box{ display:flex; gap:5px; padding:13px 16px; margin:4px 0; background:var(--cw-surface); border-radius:16px 16px 16px 5px; }
.cw-typing-box i{ width:6px; height:6px; border-radius:50%; background:var(--cw-sub); display:inline-block; animation:cwBlink 1.2s var(--cw-e) infinite; }
.cw-typing-box i:nth-child(2){ animation-delay:.16s; } .cw-typing-box i:nth-child(3){ animation-delay:.32s; }
@keyframes cwBlink{ 0%,60%,100%{ transform:translateY(0); opacity:.4 } 30%{ transform:translateY(-3px); opacity:1 } }

/* ── EMPTY STATE ── */
.cw-greet{ margin:auto 0; padding:16px 14px; text-align:center; }
.cw-greet-hi{ font-family:var(--cw-serif); font-size:22px; font-weight:600; color:var(--cw-ink); line-height:1.35; animation:cwFadeUp .45s var(--cw-e) .05s both; }
.cw-greet-sub{ font-family:var(--cw-sans); font-size:12.5px; color:var(--cw-sub); margin-top:8px; animation:cwFadeUp .45s var(--cw-e) .12s both; }
.cw-asks{ display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin-top:20px; animation:cwFadeUp .45s var(--cw-e) .2s both; }
.cw-ask{
  padding:9px 15px; border-radius:100px; cursor:pointer;
  background:var(--cw-white); border:1px solid var(--cw-line2);
  color:var(--cw-ink); font-family:var(--cw-sans); font-size:12px; font-weight:500;
  transition:border-color .25s var(--cw-e), background .25s, color .25s;
}
.cw-ask:hover{ border-color:var(--cw-accent); background:var(--cw-accent-t); color:var(--cw-accent-d); }
@keyframes cwFadeUp{ from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }

/* ── COMPOSER ── */
.cw-foot{ flex-shrink:0; padding:12px 14px 14px; background:var(--cw-white); border-top:1px solid var(--cw-line); }
.cw-preview{ position:relative; width:58px; height:58px; margin-bottom:10px; border-radius:12px; overflow:hidden; border:1px solid var(--cw-line); background:var(--cw-bg); padding:3px; }
.cw-preview img{ width:100%; height:100%; object-fit:cover; border-radius:9px; }
.cw-preview button{ position:absolute; top:3px; right:3px; width:18px; height:18px; border-radius:50%; border:none; background:rgba(44,35,30,.65); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; }
.cw-inp-row{
  display:flex; align-items:center; gap:6px; padding:4px 5px 4px 6px;
  background:var(--cw-bg); border:1px solid var(--cw-line2); border-radius:100px;
  transition:border-color .25s, box-shadow .25s;
}
.cw-inp-row:focus-within{ border-color:var(--cw-accent); box-shadow:0 0 0 3px var(--cw-accent-t); }
.cw-attach{
  flex-shrink:0; width:36px; height:36px; border-radius:50%; border:none; background:none;
  color:var(--cw-sub); cursor:pointer; display:flex; align-items:center; justify-content:center;
  transition:color .25s, background .25s;
}
.cw-attach:hover{ color:var(--cw-accent-d); background:var(--cw-surface); }
.cw-inp{ flex:1; background:none; border:none; outline:none; color:var(--cw-ink); font-family:var(--cw-sans); font-size:13.5px; padding:9px 2px; min-width:0; }
.cw-inp::placeholder{ color:var(--cw-faint); }
.cw-send{
  flex-shrink:0; width:38px; height:38px; border-radius:50%; border:none;
  background:var(--cw-accent); color:#fff;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition:background .25s, transform .25s var(--cw-spring), opacity .25s;
}
.cw-send:hover{ background:var(--cw-accent-d); transform:scale(1.05); }
.cw-send:disabled{ opacity:.45; cursor:default; transform:none; }

/* ── GATE (signed-out) ── */
.cw-gate{ flex-shrink:0; padding:20px 20px 22px; background:var(--cw-white); border-top:1px solid var(--cw-line); text-align:center; }
.cw-gate-h{ font-family:var(--cw-serif); font-size:17px; font-weight:600; color:var(--cw-ink); }
.cw-gate-p{ font-family:var(--cw-sans); font-size:12px; line-height:1.55; color:var(--cw-sub); margin:6px 0 14px; }
.cw-gate-cta{
  display:block; width:100%; padding:12px; border-radius:100px; border:none; cursor:pointer;
  background:var(--cw-accent); color:#fff;
  font-family:var(--cw-sans); font-size:12.5px; font-weight:600; letter-spacing:.04em;
  text-decoration:none; transition:background .25s, transform .25s var(--cw-spring);
}
.cw-gate-cta:hover{ background:var(--cw-accent-d); transform:translateY(-1px); }
.cw-gate-ghost{ display:inline-block; margin-top:12px; font-family:var(--cw-sans); font-size:11.5px; color:var(--cw-accent-d); text-decoration:none; border-bottom:1px solid var(--cw-line2); padding-bottom:1px; }

/* grabber (mobile only) */
.cw-grab{ display:none; }

/* ══════════ MOBILE — bottom sheet ══════════ */
@media(max-width:767px){
  .cw-fab{ display:none !important; }
  .cw-scrim{ display:block; }
  .cw-wrap{
    left:0; right:0; bottom:0; width:100%; transform:translateY(100%);
    transition:transform .45s var(--cw-e), opacity .01s; opacity:1;
  }
  .cw-wrap.open{ transform:translateY(0); }
  .cw-panel{ height:92vh; height:92dvh; border-radius:20px 20px 0 0; border-bottom:none; }
  .cw-grab{
    display:block; position:absolute; left:50%; top:8px; transform:translateX(-50%); z-index:10;
    width:38px; height:4px; border-radius:4px; background:var(--cw-line2); cursor:grab;
  }
  .cw-head{ padding-top:20px; }
  .cw-row.usr{ padding-left:32px; } .cw-row.adv{ padding-right:32px; }
  .cw-foot{ padding-bottom:calc(14px + env(safe-area-inset-bottom,0px)); }
  .cw-gate{ padding-bottom:calc(22px + env(safe-area-inset-bottom,0px)); }
}

/* ══════════ COMPACT PHONES ══════════ */
@media(max-width:400px){
  .cw-head{ padding:20px 14px 14px; }
  .cw-body{ padding:14px 12px 16px; }
  .cw-adv-tx,.cw-usr{ font-size:13px; }
  .cw-greet-hi{ font-size:20px; }
  .cw-foot{ padding:10px 10px calc(12px + env(safe-area-inset-bottom,0px)); }
}

/* ══════════ SHORT LANDSCAPE ══════════ */
@media(max-height:520px){
  .cw-head{ padding:12px 16px; }
  .cw-ava{ width:36px; height:36px; }
}

/* ══════════ REDUCED MOTION ══════════ */
@media(prefers-reduced-motion:reduce){
  .cw-fab,.cw-row,.cw-typing,.cw-typing-box i,
  .cw-greet-hi,.cw-greet-sub,.cw-asks{ animation:none !important; }
  .cw-wrap,.cw-scrim{ transition:opacity .16s linear !important; }
  .cw-wrap{ transform:none !important; }
}
`

const ReadTick = ({ read }: { read: boolean }) => (
  <span className={`cw-tick${read ? ' read' : ''}`} aria-hidden="true">
    <svg width="14" height="9" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 5.5 4 8.5 9.5 2" /><path d="M6.5 8 12 2" opacity={read ? 1 : .55} />
    </svg>
  </span>
)

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
function dayLabel(d: Date) {
  const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}
function timeLabel(iso?: string | null) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}
function genId() {
  try { if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID() } catch { }
  return 'sx' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const QUICK_ASKS = [
  'Ring sizing help',
  'Custom design enquiry',
  'Track my order',
  'Care & cleaning tips',
]

export default function ChatWidget() {
  return (
    <ChatErrorBoundary>
      <ChatWidgetContent />
    </ChatErrorBoundary>
  )
}

function ChatWidgetContent() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userToken, setUserToken] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [adminTypingUntil, setAdminTypingUntil] = useState<string | null>(null)
  const [nowTs, setNowTs] = useState(0)
  const endRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Optimistic messages awaiting server confirmation — kept across poll refreshes
  // so a message never "disappears" while the POST is still in flight.
  const pendingRef = useRef<ChatMsg[]>([])

  const isAdmin = pathname?.startsWith('/admin')

  // Brand: prefer the same logo image the header shows; fall back to a monogram.
  const [logoUrl, setLogoUrl] = useState<string>('')
  const mono = useMemo(() => {
    try {
      const s = getSettings()
      const src = (s?.logo_em || s?.logo_text || s?.site_name || 'A').trim()
      return (src[0] || 'A').toUpperCase()
    } catch { return 'A' }
  }, [])
  const brandName = useMemo(() => {
    try { return (getSettings()?.site_name || getSettings()?.logo_text || '').trim() } catch { return '' }
  }, [])

  // Load the header logo (same source the site header uses), with settings fallback.
  useEffect(() => {
    let cancelled = false
    try {
      const fromSettings = (getSettings()?.logo_url || '').trim()
      if (fromSettings) setLogoUrl(fromSettings)
    } catch { }
    ;(async () => {
      try {
        const r = await fetch('/api/header-config', { cache: 'no-store' })
        const j = await r.json()
        const url = (j?.config?.logo_url || '').trim()
        if (!cancelled && url) setLogoUrl(url)
      } catch { }
    })()
    return () => { cancelled = true }
  }, [])

  // ── User token bootstrap (localStorage, HTTPS-safe fallback) ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const key = 'chat_user_token'
      let t = localStorage.getItem(key) || ''
      if (!t) {
        t = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)
        localStorage.setItem(key, t)
      }
      setUserToken(t)
    } catch (e) { console.error('ChatWidget: localStorage error', e) }
  }, [])

  // ── Reactive auth state ──
  useEffect(() => {
    setUser(getUser())
    const onAuth = () => setUser(getUser())
    window.addEventListener('user-updated', onAuth)
    return () => window.removeEventListener('user-updated', onAuth)
  }, [])

  // ── Open via bottom-nav (or anywhere) "open-chat" event ──
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener('open-chat', onOpen)
    return () => window.removeEventListener('open-chat', onOpen)
  }, [])

  // ── ESC to close + body scroll lock on the mobile sheet ──
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const isSheet = typeof window !== 'undefined' && window.matchMedia('(max-width:767px)').matches
    const prev = document.body.style.overflow
    if (isSheet) document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open])

  // ── Auto scroll to newest ──
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length, open, adminTypingUntil])

  // ── Ticking clock (only while open) for typing indicator ──
  useEffect(() => {
    if (!open) return
    setNowTs(Date.now())
    const id = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [open])

  // ── Fetch messages from the DB, merging in any still-pending optimistic ones
  // so a just-sent message never vanishes between the send and the next poll. ──
  const fetchMessages = useCallback(async () => {
    if (!userToken) return
    try {
      const u = getUser()
      const qp = new URLSearchParams({ token: userToken })
      if (u?.email) qp.set('email', u.email)
      const r = await fetch(`/api/messages?${qp.toString()}`, { cache: 'no-store' })
      const j = await r.json()
      if (!j?.messages) return
      const server: ChatMsg[] = j.messages.map((m: any) => ({
        role: m.sender === 'admin' ? 'assistant' : 'user',
        content: m.content, createdAt: m.created_at, readAt: m.read_at,
        fileUrl: m.file_url, contentType: m.content_type,
      }))

      // Reconcile pending optimistic messages against what the server now has.
      const serverUser = server.filter(s => s.role === 'user')
      const consumed = new Set<number>()
      const stillPending = pendingRef.current.filter(p => {
        const pt = p.createdAt ? new Date(p.createdAt).getTime() : 0
        const idx = serverUser.findIndex((s, i) => {
          if (consumed.has(i)) return false
          const st = s.createdAt ? new Date(s.createdAt).getTime() : 0
          if (st < pt - 60000) return false
          const sameText = (p.content || '') === (s.content || '')
          const bothImageOnly = !p.content && !s.content && !!p.fileUrl && !!s.fileUrl
          return sameText || bothImageOnly
        })
        if (idx >= 0) { consumed.add(idx); return false }
        return true
      })
      pendingRef.current = stillPending
      setMessages([...server, ...stillPending])
      setAdminTypingUntil(j?.conversation?.admin_typing_until ?? null)
    } catch { }
  }, [userToken])

  // ── Poll ONLY while open (Supabase egress) ──
  useEffect(() => {
    if (!userToken || !open) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [userToken, open, fetchMessages])

  const advisorTyping = !!adminTypingUntil && new Date(adminTypingUntil).getTime() > nowTs

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text && !selectedFile) return
    const u = getUser()
    if (!u) { setUser(null); return }

    const currentFile = selectedFile
    const currentPreview = imgPreview
    setInput(''); setImgPreview(null); setSelectedFile(null)

    // Optimistic — shown instantly and tracked so a poll can't wipe it mid-flight.
    const optimistic: ChatMsg = {
      role: 'user', content: text, createdAt: new Date().toISOString(),
      readAt: null, fileUrl: currentPreview, contentType: currentFile?.type || null,
      clientId: genId(), pending: true,
    }
    pendingRef.current = [...pendingRef.current, optimistic]
    setMessages(prev => [...prev, optimistic])

    setSending(true)
    try {
      let fileUrlToSend: any = null
      if (currentFile) {
        const reader = new FileReader()
        fileUrlToSend = await new Promise((res) => { reader.onload = () => res(reader.result); reader.readAsDataURL(currentFile) })
      }
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': userToken },
        body: JSON.stringify({
          name: u?.name, email: u?.email, content: text,
          fileUrl: fileUrlToSend, contentType: currentFile?.type, fileName: currentFile?.name,
        }),
      })
      // Reconcile right away instead of waiting for the next poll tick.
      await fetchMessages()
    } catch { } finally { setSending(false) }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => setImgPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  if (isAdmin) return null

  const hasMsgs = messages.length > 0
  const advisorName = 'Customer Care'

  // Build rows with day dividers
  let lastDay = ''
  const rows: Array<{ kind: 'day'; label: string; key: string } | { kind: 'msg'; m: ChatMsg; i: number }> = []
  messages.forEach((m, i) => {
    const d = m.createdAt ? new Date(m.createdAt) : null
    const dk = d ? d.toDateString() : ''
    if (dk && dk !== lastDay) { rows.push({ kind: 'day', label: dayLabel(d as Date), key: `d${i}` }); lastDay = dk }
    rows.push({ kind: 'msg', m, i })
  })

  return (
    <>
      <style>{CSS}</style>

      {/* ── Launcher ── */}
      {!open && (
        <button className="cw-fab" onClick={() => setOpen(true)} aria-label="Chat with us">
          <MessageCircle size={24} strokeWidth={1.8} />
        </button>
      )}

      {/* ── Mobile scrim ── */}
      <div className={`cw-scrim${open ? ' show' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      {/* ── Panel ── */}
      <div className={`cw-wrap${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Chat with us">
        <div className="cw-panel">
          <span className="cw-grab" onClick={() => setOpen(false)} />

          {/* Header */}
          <div className="cw-head">
            <div className="cw-ava">
              {logoUrl
                ? <img src={logoUrl} alt={brandName || 'Logo'} />
                : <span>{mono}</span>}
            </div>
            <div className="cw-head-id">
              <div className="cw-head-name">{brandName || advisorName}</div>
              <div className="cw-head-status">
                <span className="cw-dot" />
                {advisorTyping ? 'Typing…' : 'Online — replies within minutes'}
              </div>
            </div>
            <button className="cw-x" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </div>

          {/* Body */}
          <div className="cw-body">
            {!hasMsgs && (
              <div className="cw-greet">
                <div className="cw-greet-hi">{timeGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}.<br />How can we help you today?</div>
                <div className="cw-greet-sub">Ask us anything — we're here to help.</div>
                {user && (
                  <div className="cw-asks">
                    {QUICK_ASKS.map(q => (
                      <button key={q} className="cw-ask" onClick={() => send(q)}>{q}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {rows.map((r) => r.kind === 'day' ? (
              <div className="cw-day" key={r.key} aria-hidden="true">
                <span>{r.label}</span>
              </div>
            ) : (
              <div className={`cw-row ${r.m.role === 'user' ? 'usr' : 'adv'}`} key={`m${r.i}`}>
                {r.m.role === 'assistant' ? (
                  <div className="cw-adv">
                    {r.m.fileUrl && <div className="cw-plate" onClick={() => window.open(r.m.fileUrl as string, '_blank')}><img src={r.m.fileUrl} alt="attachment" /></div>}
                    {r.m.content && <div className="cw-adv-tx">{r.m.content}</div>}
                  </div>
                ) : (
                  <div className="cw-usr">
                    {r.m.fileUrl && <div className="cw-plate" onClick={() => window.open(r.m.fileUrl as string, '_blank')}><img src={r.m.fileUrl} alt="attachment" /></div>}
                    {r.m.content}
                  </div>
                )}
                <div className="cw-meta">
                  <span>{timeLabel(r.m.createdAt)}</span>
                  {r.m.role === 'user' && <ReadTick read={!!r.m.readAt} />}
                </div>
              </div>
            ))}

            {advisorTyping && (
              <div className="cw-typing">
                <span className="cw-typing-box"><i /><i /><i /></span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Footer: composer or gate */}
          {user ? (
            <div className="cw-foot">
              {imgPreview && (
                <div className="cw-preview">
                  <img src={imgPreview} alt="preview" />
                  <button onClick={() => { setImgPreview(null); setSelectedFile(null) }} aria-label="Remove image"><X size={11} /></button>
                </div>
              )}
              <div className="cw-inp-row">
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                <button className="cw-attach" onClick={() => fileInputRef.current?.click()} aria-label="Attach image"><Paperclip size={17} /></button>
                <input className="cw-inp" placeholder="Type your message…" value={input}
                  onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
                <button className="cw-send" onClick={() => send()} disabled={sending} aria-label="Send"><ArrowUp size={18} strokeWidth={2} /></button>
              </div>
            </div>
          ) : (
            <div className="cw-gate">
              <div className="cw-gate-h">Sign in to start chatting</div>
              <div className="cw-gate-p">Your conversation stays with your account, so we can pick up right where you left off.</div>
              <a className="cw-gate-cta" href="/auth/signin">Sign in</a>
              <br />
              <a className="cw-gate-ghost" href="/auth/signup">Create an account</a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
