'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trash2, Mail, Users, Loader2, Download, Search,
  Send, Image as ImageIcon, Bold, Italic, Link2, Minus,
  AlignLeft, Eye, X, CheckCircle2
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
  const thisMonthCount = subscribers.filter(s => {
    const d = new Date(s.subscribed_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const TOOLBAR = [
    { icon: Bold, title: 'Bold', action: () => exec('bold') },
    { icon: Italic, title: 'Italic', action: () => exec('italic') },
    { icon: Link2, title: 'Insert Link', action: insertLink },
    { icon: ImageIcon, title: 'Insert Image', action: insertImage },
    { icon: Minus, title: 'Divider', action: insertDivider },
  ]

  return (
    <div className="a-page">
      {/* Bespoke styles: rich-text editor + compose toolbar (contentEditable WYSIWYG) */}
      <style>{`
        @keyframes ns-spin { to { transform: rotate(360deg); } }
        .ns-toolbar { display:flex; gap:4px; padding:10px 12px; background:var(--c-surface); border:1px solid var(--c-border); border-bottom:none; flex-wrap:wrap; align-items:center; border-radius:var(--radius) var(--radius) 0 0; }
        .ns-tool-btn { width:30px; height:30px; display:flex; align-items:center; justify-content:center; background:transparent; border:1px solid transparent; color:var(--c-text-muted); cursor:pointer; transition:all .18s ease; border-radius:var(--radius-sm); }
        .ns-tool-btn:hover { background:#fff; color:var(--c-accent); border-color:var(--c-border); }
        .ns-tool-sep { width:1px; height:20px; background:var(--c-border); margin:0 4px; }
        .ns-font-select { background:#fff; border:1px solid var(--c-border); color:var(--c-text-muted); font-family:var(--font-dmsans); font-size:11px; padding:5px 8px; outline:none; cursor:pointer; border-radius:var(--radius-sm); }
        .ns-font-select option { background:#fff; }
        .ns-editor { min-height:300px; background:#fff; border:1px solid var(--c-border); padding:20px; color:var(--c-text); font-family:var(--font-dmsans); font-size:14px; line-height:1.8; outline:none; caret-color:var(--c-accent); border-radius:0 0 var(--radius) var(--radius); transition:border-color .18s ease, box-shadow .18s ease; }
        .ns-editor:focus { border-color:var(--c-accent); box-shadow:0 0 0 3px var(--c-accent-soft); }
        .ns-editor:empty::before { content:attr(data-placeholder); color:var(--c-text-faint); pointer-events:none; }
        .ns-editor a { color:var(--c-accent); }
        .ns-editor img { max-width:100%; margin:8px 0; display:block; }
        .ns-editor h1,.ns-editor h2,.ns-editor h3 { font-family:var(--font-main); font-weight:400; color:var(--c-text); margin:20px 0 10px; }
        .ns-editor blockquote { border-left:2px solid var(--c-accent); padding-left:20px; color:var(--c-text-muted); font-style:italic; margin:16px 0; }
        .ns-editor ul,.ns-editor ol { padding-left:24px; }
        .ns-preview { background:var(--c-surface); border:1px solid var(--c-border); padding:0; min-height:300px; overflow:hidden; border-radius:var(--radius); }
        .ns-preview-inner { max-width:560px; margin:0 auto; padding:24px; background:#fff; min-height:300px; }
      `}</style>

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Audience</div>
          <h1 className="a-title">Newsletter <em>Subscribers</em></h1>
          <p className="a-subtitle">{activeCount} active · {subscribers.length} total</p>
        </div>
        <div className="a-head-actions">
          <button className="a-btn a-btn--ghost" onClick={exportCSV} disabled={subscribers.length === 0}>
            <Download size={15} strokeWidth={1.6} /> Export CSV
          </button>
          <button className="a-btn a-btn--primary" onClick={() => { setComposeOpen(true); setSendResult(null); }}>
            <Send size={15} strokeWidth={1.6} /> Compose Newsletter
          </button>
        </div>
      </div>

      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)' }}>
          <div className="a-card-body" style={{ color: 'var(--c-danger)', fontSize: 13 }}>{error}</div>
        </div>
      )}

      {/* Stats */}
      <div className="a-stats" style={{ marginBottom: 24 }}>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Total Subscribers</span>
            <span className="a-stat-ico"><Users size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="a-stat-val">{subscribers.length}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">Active</span>
            <span className="a-stat-ico"><CheckCircle2 size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="a-stat-val">{activeCount}</div>
        </div>
        <div className="a-stat">
          <div className="a-stat-top">
            <span className="a-stat-label">This Month</span>
            <span className="a-stat-ico"><Mail size={16} strokeWidth={1.6} /></span>
          </div>
          <div className="a-stat-val">{thisMonthCount}</div>
        </div>
      </div>

      {/* ── Compose Panel ── */}
      {composeOpen && (
        <div className="a-card" style={{ marginBottom: 24 }}>
          <div className="a-card-head a-row a-row--between" style={{ cursor: 'pointer' }} onClick={() => setComposeOpen(v => !v)}>
            <div>
              <div className="a-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Send size={16} style={{ color: 'var(--c-accent)' }} />
                Compose <em>Newsletter</em>
              </div>
            </div>
            <button
              className="a-icon-btn"
              onClick={e => { e.stopPropagation(); setComposeOpen(false); }}
              title="Close"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </div>
          <div className="a-card-body">

            {/* Subject & preview */}
            <div className="a-form-grid a-form-grid--1">
              <div className="a-field">
                <label className="a-label">Email Subject <span className="a-req">*</span></label>
                <input
                  className="a-input"
                  placeholder="e.g. ✨ New Arrivals — Exclusive Preview"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div className="a-field">
                <label className="a-label">Preview Text <span className="a-muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(shown in inbox before opening)</span></label>
                <input
                  className="a-input"
                  placeholder="A short teaser that appears below the subject line…"
                  value={previewText}
                  onChange={e => setPreviewText(e.target.value)}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="a-tabs" style={{ margin: '20px 0' }}>
              <button className={`a-tab${composeTab === 'compose' ? ' is-active' : ''}`} onClick={() => setComposeTab('compose')}>
                Compose
              </button>
              <button className={`a-tab${composeTab === 'preview' ? ' is-active' : ''}`} onClick={() => { syncContent(); setComposeTab('preview'); }}>
                <Eye size={13} style={{ marginRight: 4 }} />Preview
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
                  {subject && <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: 8, fontFamily: 'var(--font-dmsans)' }}>Subject: {subject}</p>}
                  {previewText && <p style={{ fontSize: 12, color: 'var(--c-text-muted)', fontStyle: 'italic', marginBottom: 20, borderBottom: '1px solid var(--c-border)', paddingBottom: 12 }}>{previewText}</p>}
                  <div
                    style={{ color: 'var(--c-text)', fontSize: 14, lineHeight: 1.8, fontFamily: 'var(--font-dmsans)' }}
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<p style="color:var(--c-text-muted);font-style:italic;">Nothing to preview yet…</p>' }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* Send row */}
          <div className="a-card-foot a-row a-row--between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <p className="a-muted" style={{ fontSize: 13 }}>
              Will be sent to <strong style={{ color: 'var(--c-accent)' }}>{activeCount}</strong> active subscriber{activeCount !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {sendResult && (
                <span className="a-badge a-badge--success">
                  <CheckCircle2 size={13} />
                  &nbsp;Sent {sendResult.sent}/{sendResult.sent + sendResult.failed} successfully
                  {sendResult.failed > 0 && ` · ${sendResult.failed} failed`}
                </span>
              )}
              {sendError && <span className="a-badge a-badge--danger">{sendError}</span>}
              <button className="a-btn a-btn--primary" onClick={sendBroadcast} disabled={sending || activeCount === 0}>
                {sending
                  ? <><Loader2 size={15} style={{ animation: 'ns-spin 0.6s linear infinite' }} /> Sending…</>
                  : <><Send size={15} strokeWidth={1.6} /> Send to All</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search / Toolbar */}
      <div className="a-toolbar">
        <div className="a-search">
          <Search size={16} className="a-search-ico" />
          <input
            type="text"
            className="a-search-input"
            placeholder="Search by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="a-table-wrap">
        {loading ? (
          <div className="a-loader-row">
            <span className="a-loader" />
            <span className="a-loader-label">Loading subscribers…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="a-empty">
            <div className="a-empty-ico"><Users size={26} strokeWidth={1.2} /></div>
            <div className="a-empty-title">{search ? 'No results found' : 'No subscribers yet'}</div>
            <p className="a-empty-text">{search ? 'Try a different search term.' : 'Subscribers will appear here once people sign up.'}</p>
          </div>
        ) : (
          <div className="a-table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Email</th>
                  <th>Subscribed On</th>
                  <th>Status</th>
                  <th className="a-td-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <tr key={sub.id}>
                    <td className="a-mono" style={{ color: 'var(--c-text-muted)' }}>{i + 1}</td>
                    <td>
                      <div className="a-cell-lead">
                        <span className="a-media" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-accent)' }}>
                          <Mail size={16} strokeWidth={1.6} />
                        </span>
                        <span className="a-cell-name">{sub.email}</span>
                      </div>
                    </td>
                    <td>
                      <div>{new Date(sub.subscribed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="a-cell-meta">{new Date(sub.subscribed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td>
                      <span className={`a-badge ${sub.is_active ? 'a-badge--success' : 'a-badge--neutral'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="a-td-right">
                      <div className="a-cell-actions">
                        <button className="a-icon-btn a-icon-btn--danger" onClick={() => deleteSubscriber(sub.id)} disabled={deleting === sub.id} title="Remove subscriber">
                          {deleting === sub.id
                            ? <Loader2 size={14} style={{ animation: 'ns-spin 0.6s linear infinite' }} />
                            : <Trash2 size={15} strokeWidth={1.6} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
