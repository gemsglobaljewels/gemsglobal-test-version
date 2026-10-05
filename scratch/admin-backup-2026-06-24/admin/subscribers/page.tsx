'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2, Mail, Users, Loader2, Download, Search,
  Send, Image as ImageIcon, Bold, Italic, Link2, Minus,
  AlignLeft, ChevronUp, ChevronDown, Eye, X, CheckCircle2
} from 'lucide-react'

interface Subscriber {
  id: string
  email: string
  subscribed_at: string
  is_active: boolean
}

type ComposeTab = 'compose' | 'preview'

export default function AdminSubscribersPage() {
  // ── Subscribers list state ──────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  // ── Compose state ──────────────────────────────────────────────────────
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTab, setComposeTab] = useState<ComposeTab>('compose')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)
  const [sendError, setSendError] = useState('')
  const [imgUploading, setImgUploading] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchSubscribers() }, [])

  // Sync editor innerHTML → htmlContent state
  const syncContent = useCallback(() => {
    if (editorRef.current) setHtmlContent(editorRef.current.innerHTML)
  }, [])

  async function fetchSubscribers() {
    try {
      setLoading(true)
      const res = await fetch('/api/newsletter')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSubscribers(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteSubscriber(id: string) {
    if (!confirm('Remove this subscriber?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/newsletter?id=${id}`, { method: 'DELETE' })
      if (res.ok) setSubscribers(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    } finally {
      setDeleting(null)
    }
  }

  function exportCSV() {
    const rows = ['Email,Subscribed At', ...subscribers.map(s =>
      `${s.email},${new Date(s.subscribed_at).toLocaleString()}`
    )]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'subscribers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Rich text commands ─────────────────────────────────────────────────
  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    syncContent()
  }

  function insertLink() {
    const url = prompt('Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  function insertDivider() {
    exec('insertHTML', '<hr style="border:none;border-top:1px solid rgba(var(--c-accent-rgb),0.3);margin:24px 0;" />')
  }

  async function insertImage() {
    fileInputRef.current?.click()
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/storage/upload-newsletter-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      exec('insertHTML', `<img src="${data.url}" alt="" style="max-width:100%;height:auto;margin:12px 0;display:block;" />`)
    } catch (err: any) {
      alert('Image upload failed: ' + err.message)
    } finally {
      setImgUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendBroadcast() {
    syncContent()
    if (!subject.trim()) { setSendError('Subject is required.'); return }
    if (!htmlContent.trim() || htmlContent === '<br>') { setSendError('Email body cannot be empty.'); return }
    if (!confirm(`Send to all ${subscribers.filter(s => s.is_active).length} active subscribers?`)) return

    setSending(true)
    setSendError('')
    setSendResult(null)
    try {
      const res = await fetch('/api/newsletter/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlContent, previewText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setSendResult({ sent: data.sent, failed: data.failed })
      // Reset compose on success
      setSubject('')
      setPreviewText('')
      setHtmlContent('')
      if (editorRef.current) editorRef.current.innerHTML = ''
    } catch (err: any) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  )
  const activeCount = subscribers.filter(s => s.is_active).length

  const TOOLBAR = [
    { icon: Bold, title: 'Bold', action: () => exec('bold') },
    { icon: Italic, title: 'Italic', action: () => exec('italic') },
    { icon: Link2, title: 'Insert Link', action: insertLink },
    { icon: ImageIcon, title: 'Insert Image', action: insertImage },
    { icon: Minus, title: 'Divider', action: insertDivider },
  ]

  const CSS = `
    @keyframes ns-spin { to { transform: rotate(360deg); } }

    .ns-root { min-height:100vh; background:var(--c-bg); color:var(--c-text); padding:40px; font-family:var(--font-main); }
    .ns-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px; flex-wrap:wrap; gap:16px; }
    .ns-title { font-family:var(--font-main); font-size:32px; font-weight:300; }
    .ns-title em { font-style:italic; color:var(--c-accent); }
    .ns-subtitle { font-size:12px; color:var(--c-text-muted); margin-top:4px; letter-spacing:0.05em; }
    .ns-header-actions { display:flex; gap:10px; align-items:center; }
    .ns-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; border:1px solid var(--c-border); color:var(--c-accent); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; font-family:var(--font-main); background:transparent; border-radius:var(--radius); }
    .ns-btn:hover { background:var(--c-surface); color:var(--c-accent); border-color:var(--c-accent); }
    .ns-btn.primary { background:var(--c-accent); color:#0a0806; border-color:var(--c-accent); }
    .ns-btn.primary:hover { background:var(--c-text); }
    .ns-btn:disabled { opacity:0.4; cursor:not-allowed; }

    .ns-stats { display:flex; gap:16px; margin-bottom:32px; flex-wrap:wrap; }
    .ns-stat { background:var(--c-surface); border:1px solid var(--c-border); padding:20px 28px; flex:1; min-width:140px; border-radius:var(--radius); }
    .ns-stat-val { font-family:var(--font-main); font-size:36px; font-weight:300; color:var(--c-accent); line-height:1; }
    .ns-stat-label { font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:var(--c-text-muted); margin-top:6px; }

    /* ── Compose Section ── */
    .ns-compose { border:1px solid var(--c-border); background:#fff; margin-bottom:32px; position:relative; overflow:hidden; border-radius:var(--radius); box-shadow:var(--shadow-md); }
    .ns-compose::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(var(--c-accent-rgb),0.3),transparent); }
    .ns-compose-header { padding:20px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(var(--c-accent-rgb),0.08); cursor:pointer; }
    .ns-compose-title { font-family:var(--font-main); font-size:20px; font-weight:300; display:flex; align-items:center; gap:12px; }
    .ns-compose-title em { font-style:italic; color:var(--c-accent); }
    .ns-compose-body { padding:24px; }
    .ns-compose-tabs { display:flex; gap:0; margin-bottom:20px; border-bottom:1px solid rgba(var(--c-accent-rgb),0.08); }
    .ns-ctab { padding:8px 20px; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; cursor:pointer; color:var(--c-text-muted); border-bottom:2px solid transparent; margin-bottom:-1px; background:transparent; border-top:none; border-left:none; border-right:none; font-family:var(--font-main); transition:color 0.2s; }
    .ns-ctab.on { color:var(--c-accent); border-bottom-color:var(--c-accent); }

    .ns-field { margin-bottom:16px; }
    .ns-label { font-size:9px; letter-spacing:0.3em; text-transform:uppercase; color:rgba(var(--c-accent-rgb),0.5); margin-bottom:6px; display:block; }
    .ns-input { width:100%; background:var(--c-surface); border:1px solid var(--c-border); padding:11px 16px; color:var(--c-text); font-family:var(--font-main); font-size:13px; outline:none; box-sizing:border-box; border-radius:var(--radius); }
    .ns-input:focus { border-color:var(--c-accent); background:#fff; }
    .ns-input::placeholder { color:var(--c-text-muted); }

    /* Toolbar */
    .ns-toolbar { display:flex; gap:4px; padding:10px 12px; background:var(--c-surface); border:1px solid var(--c-border); border-bottom:none; flex-wrap:wrap; align-items:center; border-radius:var(--radius) var(--radius) 0 0; }
    .ns-tool-btn { width:30px; height:30px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid transparent; color:var(--c-text-muted); cursor:pointer; transition:all 0.2s; border-radius:3px; }
    .ns-tool-btn:hover { background:rgba(var(--c-accent-rgb),0.1); color:var(--c-accent); border-color:rgba(var(--c-accent-rgb),0.2); }
    .ns-tool-sep { width:1px; height:20px; background:var(--c-border); margin:0 4px; }
    .ns-font-select { background:var(--c-surface); border:1px solid var(--c-border); color:var(--c-text-muted); font-family:var(--font-main); font-size:11px; padding:4px 8px; outline:none; cursor:pointer; border-radius:var(--radius); }
    .ns-font-select option { background:#fff; }

    /* Editor */
    .ns-editor-wrap { position:relative; }
    .ns-editor {
      min-height:300px; background:#fff; border:1px solid var(--c-border);
      padding:20px; color:var(--c-text); font-family:var(--font-main); font-size:14px; line-height:1.8;
      outline:none; caret-color:var(--c-accent); border-radius:0 0 var(--radius) var(--radius);
    }
    .ns-editor:focus { border-color:var(--c-accent); }
    .ns-editor:empty::before { content:attr(data-placeholder); color:var(--c-text-muted); pointer-events:none; }
    .ns-editor a { color:var(--c-accent); }
    .ns-editor img { max-width:100%; margin:8px 0; display:block; }
    .ns-editor h1,.ns-editor h2,.ns-editor h3 { font-family:var(--font-main); font-weight:300; color:var(--c-text); margin:20px 0 10px; }
    .ns-editor blockquote { border-left:2px solid var(--c-accent); padding-left:20px; color:var(--c-text-muted); font-style:italic; margin:16px 0; }
    .ns-editor ul,.ns-editor ol { padding-left:24px; }

    /* Preview */
    .ns-preview { background:var(--c-bg); border:1px solid var(--c-border); padding:0; min-height:300px; overflow:hidden; border-radius:var(--radius); }
    .ns-preview-inner { max-width:560px; margin:0 auto; padding:20px; }

    /* Send actions */
    .ns-send-row { display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:12px; }
    .ns-send-info { font-size:11px; color:var(--c-text-muted); }
    .ns-send-info strong { color:var(--c-accent); }
    .ns-result { display:flex; align-items:center; gap:8px; font-size:12px; padding:10px 16px; border-radius:3px; }
    .ns-result.ok { background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); color:#6ee7b7; }
    .ns-result.err { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#fca5a5; }

    /* Subscribers table */
    .ns-controls { display:flex; gap:12px; margin-bottom:20px; }
    .ns-search-wrap { position:relative; flex:1; max-width:400px; }
    .ns-search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--c-text-muted); }
    .ns-search-input { width:100%; background:#fff; border:1px solid var(--c-border); padding:10px 12px 10px 38px; color:var(--c-text); font-family:inherit; font-size:13px; outline:none; border-radius:var(--radius); }
    .ns-search-input:focus { border-color:var(--c-accent); }
    .ns-search-input::placeholder { color:var(--c-text-muted); }
    .ns-table-wrap { background:#fff; border:1px solid var(--c-border); border-radius:var(--radius); overflow:hidden; box-shadow:var(--shadow-md); }
    .ns-table { width:100%; border-collapse:collapse; text-align:left; }
    .ns-table th { padding:16px 20px; font-size:10px; font-weight:500; text-transform:uppercase; letter-spacing:0.12em; color:var(--c-text-muted); border-bottom:1px solid var(--c-border); white-space:nowrap; background:var(--c-surface); }
    .ns-table td { padding:14px 20px; font-size:13px; border-bottom:1px solid rgba(var(--c-accent-rgb),0.04); vertical-align:middle; }
    .ns-table tr:last-child td { border-bottom:none; }
    .ns-table tr:hover td { background:var(--c-surface); }
    .ns-email { display:flex; align-items:center; gap:10px; }
    .ns-email-ic { width:30px; height:30px; border:1px solid var(--c-border); display:flex; align-items:center; justify-content:center; color:var(--c-accent); flex-shrink:0; border-radius:var(--radius); }
    .ns-date { font-size:11px; color:var(--c-text-muted); }
    .ns-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; background:rgba(34,197,94,0.1); color:#22c55e; }
    .ns-del-btn { width:30px; height:30px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid rgba(239,68,68,0.15); color:rgba(239,68,68,0.4); cursor:pointer; transition:all 0.2s; border-radius:var(--radius); }
    .ns-del-btn:hover { background:rgba(239,68,68,0.1); color:#ef4444; border-color:rgba(239,68,68,0.4); }
    .ns-del-btn:disabled { opacity:0.4; cursor:not-allowed; }
    .ns-empty { padding:80px; text-align:center; }
    .ns-empty-ic { width:56px; height:56px; border:1px solid var(--c-border); display:flex; align-items:center; justify-content:center; color:rgba(var(--c-accent-rgb),0.2); margin:0 auto 20px; border-radius:var(--radius); }
    .ns-empty-title { font-family:var(--font-main); font-size:24px; font-weight:300; color:var(--c-text-muted); margin-bottom:8px; }
    .ns-empty-sub { font-size:12px; color:var(--c-text-muted); }
    .ns-error-bar { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); color:#fca5a5; padding:14px 20px; font-size:13px; margin-bottom:24px; border-radius:var(--radius); }
    @media (max-width:768px) { .ns-root { padding:20px; } .ns-header { flex-direction:column; } }
  `

  return (
    <div className="ns-root">
      <style>{CSS}</style>

      <div className="ns-header">
        <div>
          <h1 className="ns-title">Newsletter <em>Subscribers</em></h1>
          <p className="ns-subtitle">{activeCount} active · {subscribers.length} total</p>
        </div>
        <div className="ns-header-actions">
          <button className="ns-btn" onClick={exportCSV} disabled={subscribers.length === 0}>
            <Download size={13} strokeWidth={1.5} /> Export CSV
          </button>
          <button className="ns-btn primary" onClick={() => { setComposeOpen(true); setSendResult(null); }}>
            <Send size={13} strokeWidth={1.5} /> Compose Newsletter
          </button>
        </div>
      </div>

      {error && <div className="ns-error-bar">{error}</div>}

      {/* Stats */}
      <div className="ns-stats">
        <div className="ns-stat">
          <div className="ns-stat-val">{subscribers.length}</div>
          <div className="ns-stat-label">Total Subscribers</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-val">{activeCount}</div>
          <div className="ns-stat-label">Active</div>
        </div>
        <div className="ns-stat">
          <div className="ns-stat-val">
            {subscribers.filter(s => {
              const d = new Date(s.subscribed_at)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}
          </div>
          <div className="ns-stat-label">This Month</div>
        </div>
      </div>

      {/* ── Compose Panel ── */}
      {composeOpen && (
        <div className="ns-compose">
          <div className="ns-compose-header" onClick={() => setComposeOpen(v => !v)}>
            <div className="ns-compose-title">
              <Send size={16} style={{ color: 'var(--c-accent)' }} />
              Compose <em>Newsletter</em>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--c-text-muted)', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); setComposeOpen(false); }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
          <div className="ns-compose-body">

            {/* Subject & preview */}
            <div className="ns-field">
              <label className="ns-label">Email Subject *</label>
              <input
                className="ns-input"
                placeholder="e.g. ✨ New Arrivals — Exclusive Preview"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div className="ns-field">
              <label className="ns-label">Preview Text <span style={{ opacity: 0.5 }}>(shown in inbox before opening)</span></label>
              <input
                className="ns-input"
                placeholder="A short teaser that appears below the subject line…"
                value={previewText}
                onChange={e => setPreviewText(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <div className="ns-compose-tabs">
              <button className={`ns-ctab${composeTab === 'compose' ? ' on' : ''}`} onClick={() => setComposeTab('compose')}>
                Compose
              </button>
              <button className={`ns-ctab${composeTab === 'preview' ? ' on' : ''}`} onClick={() => { syncContent(); setComposeTab('preview'); }}>
                <Eye size={11} style={{ marginRight: 4 }} />Preview
              </button>
            </div>

            {composeTab === 'compose' && (
              <>
                {/* Toolbar */}
                <div className="ns-toolbar">
                  {/* Font size */}
                  <select className="ns-font-select" onChange={e => exec('fontSize', e.target.value)} defaultValue="">
                    <option value="" disabled>Size</option>
                    {['1', '2', '3', '4', '5', '6', '7'].map(s => <option key={s} value={s}>{['10', '13', '16', '18', '22', '28', '36'][+s - 1]}px</option>)}
                  </select>
                  <select className="ns-font-select" onChange={e => exec('formatBlock', e.target.value)} defaultValue="" style={{ marginLeft: 4 }}>
                    <option value="" disabled>Heading</option>
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Blockquote</option>
                  </select>
                  <div className="ns-tool-sep" />
                  {TOOLBAR.map(({ icon: Icon, title, action }) => (
                    <button key={title} className="ns-tool-btn" title={title} onMouseDown={e => { e.preventDefault(); action(); }}>
                      {title === 'Insert Image' && imgUploading
                        ? <Loader2 size={14} style={{ animation: 'ns-spin 0.6s linear infinite' }} />
                        : <Icon size={14} strokeWidth={1.5} />
                      }
                    </button>
                  ))}
                  <div className="ns-tool-sep" />
                  <button className="ns-tool-btn" title="Text Color" onMouseDown={e => { e.preventDefault(); const c = prompt('Hex color:', 'var(--c-accent)'); if (c) exec('foreColor', c); }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-accent)' }}>A</span>
                  </button>
                  <button className="ns-tool-btn" title="Align Left" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
                    <AlignLeft size={14} strokeWidth={1.5} />
                  </button>
                  <button className="ns-tool-btn" title="Align Center" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
                    <AlignLeft size={14} strokeWidth={1.5} style={{ transform: 'scaleX(-1)' }} />
                  </button>
                  <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageFile} />
                </div>

                {/* Editor */}
                <div
                  ref={editorRef}
                  className="ns-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Write your newsletter here… Use the toolbar to format text, insert images, add links, and more."
                  onInput={syncContent}
                  onBlur={syncContent}
                />
              </>
            )}

            {composeTab === 'preview' && (
              <div className="ns-preview">
                <div className="ns-preview-inner">
                  {subject && <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(var(--c-accent-rgb),0.5)', marginBottom: 8 }}>Subject: {subject}</p>}
                  {previewText && <p style={{ fontSize: 11, color: 'var(--c-text-muted)', fontStyle: 'italic', marginBottom: 20, borderBottom: '1px solid rgba(var(--c-accent-rgb),0.06)', paddingBottom: 12 }}>{previewText}</p>}
                  <div
                    style={{ color: 'var(--c-text)', fontSize: 14, lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color:var(--c-text-muted);font-style:italic;">Nothing to preview yet…</p>' }}
                  />
                </div>
              </div>
            )}

            {/* Send row */}
            <div className="ns-send-row">
              <p className="ns-send-info">
                Will be sent to <strong>{activeCount}</strong> active subscriber{activeCount !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {sendResult && (
                  <div className="ns-result ok">
                    <CheckCircle2 size={14} />
                    Sent {sendResult.sent}/{sendResult.sent + sendResult.failed} successfully
                    {sendResult.failed > 0 && ` · ${sendResult.failed} failed`}
                  </div>
                )}
                {sendError && <div className="ns-result err">{sendError}</div>}
                <button className="ns-btn primary" onClick={sendBroadcast} disabled={sending || activeCount === 0}>
                  {sending
                    ? <><Loader2 size={13} style={{ animation: 'ns-spin 0.6s linear infinite' }} /> Sending…</>
                    : <><Send size={13} strokeWidth={1.5} /> Send to All</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="ns-controls">
        <div className="ns-search-wrap">
          <Search size={14} className="ns-search-icon" />
          <input
            type="text"
            className="ns-search-input"
            placeholder="Search by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="ns-table-wrap">
        {loading ? (
          <div className="ns-empty">
            <Loader2 size={28} style={{ color: 'var(--c-accent)', animation: 'ns-spin 0.7s linear infinite', margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="ns-empty">
            <div className="ns-empty-ic"><Users size={22} strokeWidth={1.2} /></div>
            <div className="ns-empty-title">{search ? 'No results found' : 'No subscribers yet'}</div>
            <p className="ns-empty-sub">{search ? 'Try a different search term.' : 'Subscribers will appear here once people sign up.'}</p>
          </div>
        ) : (
          <table className="ns-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Subscribed On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => (
                <tr key={sub.id}>
                  <td style={{ color: 'var(--c-text-muted)', fontSize: 11 }}>{i + 1}</td>
                  <td>
                    <div className="ns-email">
                      <div className="ns-email-ic"><Mail size={13} strokeWidth={1.5} /></div>
                      <span>{sub.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ns-date">{new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    <div className="ns-date" style={{ marginTop: 2 }}>{new Date(sub.subscribed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td><span className="ns-badge">{sub.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="ns-del-btn" onClick={() => deleteSubscriber(sub.id)} disabled={deleting === sub.id} title="Remove subscriber">
                      {deleting === sub.id
                        ? <Loader2 size={12} style={{ animation: 'ns-spin 0.6s linear infinite' }} />
                        : <Trash2 size={13} strokeWidth={1.5} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
