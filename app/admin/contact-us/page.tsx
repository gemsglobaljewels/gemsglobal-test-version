'use client'

import { useEffect, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles,
  LayoutTemplate, Clock, FileText, Send,
  ArrowUp, ArrowDown, Eye, EyeOff, Link2,
} from 'lucide-react'
import {
  DEFAULT_CONTACT_US,
  normalizeContactUs,
  newChannelId,
  newSectionId,
  newPointId,
  newHourId,
  CONTACT_ICONS,
  ContactUsConfig,
  ContactChannel,
  ContactSection,
  ContactPoint,
  ContactHourRow,
} from '@/lib/contactUs'

const CSS = `
.ctu-a-sec{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:18px; }
.ctu-a-sec-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
.ctu-a-sec-badge{
  display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700;
  letter-spacing:.04em; color:var(--c-accent); text-transform:uppercase;
}
.ctu-a-sec-num{
  display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px;
  border-radius:50%; background:var(--c-accent-soft); border:1px solid var(--c-border);
  color:var(--c-accent); font-size:12px; font-weight:700; flex-shrink:0;
}
.ctu-a-sec-actions{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ctu-a-row{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ctu-a-row > .a-input{ min-width:120px; }
.ctu-a-pts{ display:flex; flex-direction:column; gap:10px; }
.ctu-a-pts-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:4px; flex-wrap:wrap; }
.ctu-a-pt{
  display:flex; align-items:flex-start; gap:8px; padding:12px;
  border:1px solid var(--c-border); border-radius:var(--radius-sm); background:#fff;
}
.ctu-a-pt-fields{ flex:1; min-width:0; display:flex; flex-direction:column; gap:8px; }
.ctu-a-pt-row{ display:flex; gap:8px; flex-wrap:wrap; }
.ctu-a-pt-row > .a-input{ flex:1; min-width:140px; }
.ctu-a-pt-actions{ display:flex; flex-direction:column; gap:6px; flex-shrink:0; }
.ctu-a-subj{ display:flex; align-items:center; gap:8px; }
.ctu-a-hint-link{ display:inline-flex; align-items:center; gap:6px; }
@media (max-width:560px){
  .ctu-a-pt{ flex-direction:column; }
  .ctu-a-pt-actions{ flex-direction:row; }
}
`

export default function AdminContactUsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<ContactUsConfig>(DEFAULT_CONTACT_US)

  useEffect(() => {
    fetch('/api/admin/contact-us')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizeContactUs(d.config)) })
      .finally(() => setLoading(false))
  }, [])

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/contact-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizeContactUs(d.config))
        showToast('Contact Us page updated')
      } else throw new Error(d.error || 'Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  // ── typed setters ──
  const setHero = (k: keyof ContactUsConfig['hero'], v: string) =>
    setCfg((p) => ({ ...p, hero: { ...p.hero, [k]: v } }))
  const setForm = (k: keyof ContactUsConfig['form'], v: any) =>
    setCfg((p) => ({ ...p, form: { ...p.form, [k]: v } }))
  const setHours = (k: keyof ContactUsConfig['hours'], v: any) =>
    setCfg((p) => ({ ...p, hours: { ...p.hours, [k]: v } }))

  // ── channels CRUD / reorder ──
  const updChannel = (i: number, patch: Partial<ContactChannel>) =>
    setCfg((p) => {
      const arr = [...p.channels]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, channels: arr }
    })

  const addChannel = () =>
    setCfg((p) => ({
      ...p,
      channels: [
        ...p.channels,
        { id: newChannelId(), icon: 'Mail', label: '', value: '', href: '', note: '' },
      ],
    }))

  const removeChannel = (i: number) =>
    setCfg((p) => ({ ...p, channels: p.channels.filter((_, x) => x !== i) }))

  const moveChannel = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.channels.length) return p
      const arr = [...p.channels]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, channels: arr }
    })

  // ── support-hour rows CRUD / reorder ──
  const updHour = (i: number, patch: Partial<ContactHourRow>) =>
    setCfg((p) => {
      const rows = [...p.hours.rows]
      rows[i] = { ...rows[i], ...patch }
      return { ...p, hours: { ...p.hours, rows } }
    })

  const addHour = () =>
    setCfg((p) => ({
      ...p,
      hours: { ...p.hours, rows: [...p.hours.rows, { id: newHourId(), days: '', hours: '' }] },
    }))

  const removeHour = (i: number) =>
    setCfg((p) => ({ ...p, hours: { ...p.hours, rows: p.hours.rows.filter((_, x) => x !== i) } }))

  const moveHour = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.hours.rows.length) return p
      const rows = [...p.hours.rows]
      ;[rows[i], rows[j]] = [rows[j], rows[i]]
      return { ...p, hours: { ...p.hours, rows } }
    })

  // ── form subject options CRUD / reorder ──
  const updSubject = (i: number, v: string) =>
    setCfg((p) => {
      const subjects = [...p.form.subjects]
      subjects[i] = v
      return { ...p, form: { ...p.form, subjects } }
    })

  const addSubject = () =>
    setCfg((p) => ({ ...p, form: { ...p.form, subjects: [...p.form.subjects, ''] } }))

  const removeSubject = (i: number) =>
    setCfg((p) => ({ ...p, form: { ...p.form, subjects: p.form.subjects.filter((_, x) => x !== i) } }))

  const moveSubject = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.form.subjects.length) return p
      const subjects = [...p.form.subjects]
      ;[subjects[i], subjects[j]] = [subjects[j], subjects[i]]
      return { ...p, form: { ...p.form, subjects } }
    })

  // ── section CRUD / reorder ──
  const updSection = (i: number, patch: Partial<ContactSection>) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[i] = { ...arr[i], ...patch }
      return { ...p, sections: arr }
    })

  const addSection = () =>
    setCfg((p) => ({
      ...p,
      sections: [
        ...p.sections,
        { id: newSectionId(), eyebrow: '', title: '', body: '', points: [], is_visible: true },
      ],
    }))

  const removeSection = (i: number) =>
    setCfg((p) => ({ ...p, sections: p.sections.filter((_, x) => x !== i) }))

  const moveSection = (i: number, dir: -1 | 1) =>
    setCfg((p) => {
      const j = i + dir
      if (j < 0 || j >= p.sections.length) return p
      const arr = [...p.sections]
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...p, sections: arr }
    })

  // ── point CRUD / reorder (scoped to a single section) ──
  const addPoint = (si: number) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[si] = {
        ...arr[si],
        points: [...arr[si].points, { id: newPointId(), icon: 'CircleCheck', title: '', text: '' }],
      }
      return { ...p, sections: arr }
    })

  const removePoint = (si: number, pi: number) =>
    setCfg((p) => {
      const arr = [...p.sections]
      arr[si] = { ...arr[si], points: arr[si].points.filter((_, x) => x !== pi) }
      return { ...p, sections: arr }
    })

  const movePoint = (si: number, pi: number, dir: -1 | 1) =>
    setCfg((p) => {
      const arr = [...p.sections]
      const pts = [...arr[si].points]
      const j = pi + dir
      if (j < 0 || j >= pts.length) return p
      ;[pts[pi], pts[j]] = [pts[j], pts[pi]]
      arr[si] = { ...arr[si], points: pts }
      return { ...p, sections: arr }
    })

  const updPoint = (si: number, pi: number, patch: Partial<ContactPoint>) =>
    setCfg((p) => {
      const arr = [...p.sections]
      const pts = [...arr[si].points]
      pts[pi] = { ...pts[pi], ...patch }
      arr[si] = { ...arr[si], points: pts }
      return { ...p, sections: arr }
    })

  if (loading) return null

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Marketing</div>
          <h1 className="a-title">Contact <em>Us Page</em></h1>
          <p className="a-subtitle">Manage the /contact-us page — hero, contact channels, the enquiry form, support hours and the reorderable info sections</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/contact-us" target="_blank" rel="noopener noreferrer">View Page</a>
          <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`a-badge ${toast.err ? 'a-badge--danger' : 'a-badge--accent'}`} style={{ marginBottom: 20 }}>
          {toast.err ? <AlertCircle size={14} /> : <Sparkles size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="a-stack">

        {/* ── HERO ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><LayoutTemplate size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Hero <em>Intro</em></div><div className="a-card-sub">Top of the page — title &amp; lead line (no image on this page)</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} placeholder="Contact Us" /></div>
              <div className="a-field"><label className="a-label">Accent (italic, after title)</label>
                <input className="a-input" value={cfg.hero.accent} onChange={(e) => setHero('accent', e.target.value)} placeholder="Hear From You" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.hero.title} onChange={(e) => setHero('title', e.target.value)} placeholder="We Would Love to" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle (short lead line)</label>
                <textarea className="a-textarea" value={cfg.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} rows={2} /></div>
            </div>
          </div>
        </div>

        {/* ── CONTACT CHANNELS (repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Link2 size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Contact <em>Channels</em></div><div className="a-card-sub">Clickable cards under the hero — email, appointments, custom orders…</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addChannel}><Plus size={14} /> Add Channel</button>
          </div>
          <div className="a-card-body">
            {cfg.channels.length === 0 ? (
              <p className="a-hint">No channels yet. Click <strong>Add Channel</strong> to create the card strip — or leave it empty to hide it.</p>
            ) : (
              <div className="a-stack">
                {cfg.channels.map((c, i) => (
                  <div className="ctu-a-sec" key={c.id}>
                    <div className="ctu-a-sec-head">
                      <span className="ctu-a-sec-badge">
                        <span className="ctu-a-sec-num">{i + 1}</span>
                        {c.label || 'Untitled channel'}
                      </span>
                      <div className="ctu-a-sec-actions">
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveChannel(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveChannel(i, 1)} disabled={i === cfg.channels.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeChannel(i)} title="Delete channel"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="a-form-grid">
                      <div className="a-field"><label className="a-label">Icon</label>
                        <select className="a-select" value={c.icon} onChange={(e) => updChannel(i, { icon: e.target.value })}>
                          {CONTACT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                        </select></div>
                      <div className="a-field"><label className="a-label">Label (small uppercase)</label>
                        <input className="a-input" value={c.label} onChange={(e) => updChannel(i, { label: e.target.value })} placeholder="Email Support" /></div>
                      <div className="a-field"><label className="a-label">Value (the big line)</label>
                        <input className="a-input" value={c.value} onChange={(e) => updChannel(i, { value: e.target.value })} placeholder="hello@gemsglobaljewels.com" /></div>
                      <div className="a-field"><label className="a-label">Link <span className="a-hint" style={{ margin: 0 }}>(mailto:, tel:, /appointments, https:…)</span></label>
                        <input className="a-input" value={c.href} onChange={(e) => updChannel(i, { href: e.target.value })} placeholder="mailto:hello@gemsglobaljewels.com" /></div>
                      <div className="a-field a-col-span-2"><label className="a-label">Note (small reassurance line)</label>
                        <input className="a-input" value={c.note} onChange={(e) => updChannel(i, { note: e.target.value })} placeholder="Our primary contact method — replies within 24 hours" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── ENQUIRY FORM SETTINGS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Send size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Enquiry <em>Form</em></div><div className="a-card-sub">Headings, subject options, success message &amp; where notifications go</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.form.eyebrow} onChange={(e) => setForm('eyebrow', e.target.value)} placeholder="Send a Message" /></div>
              <div className="a-field"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.form.title} onChange={(e) => setForm('title', e.target.value)} placeholder="How Can We Help?" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle</label>
                <textarea className="a-textarea" value={cfg.form.subtitle} onChange={(e) => setForm('subtitle', e.target.value)} rows={2} /></div>
              <div className="a-field"><label className="a-label">Button Text</label>
                <input className="a-input" value={cfg.form.button_text} onChange={(e) => setForm('button_text', e.target.value)} placeholder="Send Message" /></div>
              <div className="a-field"><label className="a-label">Show Phone Field</label>
                <select className="a-select" value={cfg.form.show_phone ? 'yes' : 'no'} onChange={(e) => setForm('show_phone', e.target.value === 'yes')}>
                  <option value="yes">Yes — optional phone field</option>
                  <option value="no">No — hide it</option>
                </select></div>
              <div className="a-field"><label className="a-label">Success Title</label>
                <input className="a-input" value={cfg.form.success_title} onChange={(e) => setForm('success_title', e.target.value)} placeholder="Thank You — Message Received" /></div>
              <div className="a-field"><label className="a-label">Notification Email <span className="a-hint" style={{ margin: 0 }}>(blank = store default)</span></label>
                <input className="a-input" type="email" value={cfg.form.notify_email} onChange={(e) => setForm('notify_email', e.target.value)} placeholder="admin@example.com" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Success Message</label>
                <textarea className="a-textarea" value={cfg.form.success_text} onChange={(e) => setForm('success_text', e.target.value)} rows={2} /></div>

              {/* ── subject options ── */}
              <div className="a-field a-col-span-2">
                <div className="ctu-a-pts-head">
                  <label className="a-label" style={{ margin: 0 }}>Subject Options <span className="a-hint" style={{ margin: 0 }}>(the dropdown — remove all to hide it)</span></label>
                  <button className="a-btn a-btn--subtle a-btn--sm" onClick={addSubject}><Plus size={13} /> Add Subject</button>
                </div>
                {cfg.form.subjects.length === 0 ? (
                  <p className="a-hint">No subjects — the dropdown is hidden on the form.</p>
                ) : (
                  <div className="ctu-a-pts">
                    {cfg.form.subjects.map((s, i) => (
                      <div className="ctu-a-subj" key={i}>
                        <input className="a-input" value={s} onChange={(e) => updSubject(i, e.target.value)} placeholder="General Enquiry" style={{ flex: 1 }} />
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSubject(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSubject(i, 1)} disabled={i === cfg.form.subjects.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeSubject(i)} title="Delete subject"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SUPPORT HOURS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Clock size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Customer Support <em>Hours</em></div><div className="a-card-sub">The hours table beside the form</div></div>
            </div>
            <div className="ctu-a-sec-actions">
              <button className="a-icon-btn a-icon-btn--sm" onClick={() => setHours('is_visible', !cfg.hours.is_visible)} title={cfg.hours.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
                {cfg.hours.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button className="a-btn a-btn--ghost a-btn--sm" onClick={addHour}><Plus size={14} /> Add Row</button>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid" style={{ marginBottom: 16 }}>
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.hours.eyebrow} onChange={(e) => setHours('eyebrow', e.target.value)} placeholder="When We Are Available" /></div>
              <div className="a-field"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.hours.title} onChange={(e) => setHours('title', e.target.value)} placeholder="Customer Support Hours" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Note (under the table)</label>
                <textarea className="a-textarea" value={cfg.hours.note} onChange={(e) => setHours('note', e.target.value)} rows={2} /></div>
            </div>

            {cfg.hours.rows.length === 0 ? (
              <p className="a-hint">No rows yet. Click <strong>Add Row</strong> to build the hours table.</p>
            ) : (
              <div className="ctu-a-pts">
                {cfg.hours.rows.map((r, i) => (
                  <div className="ctu-a-subj" key={r.id}>
                    <input className="a-input" value={r.days} onChange={(e) => updHour(i, { days: e.target.value })} placeholder="Monday – Friday" style={{ flex: 1 }} />
                    <input className="a-input" value={r.hours} onChange={(e) => updHour(i, { hours: e.target.value })} placeholder="9:30 AM – 6:30 PM" style={{ flex: 1 }} />
                    <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveHour(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                    <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveHour(i, 1)} disabled={i === cfg.hours.rows.length - 1} title="Move down"><ArrowDown size={14} /></button>
                    <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeHour(i)} title="Delete row"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── INFO SECTIONS (repeatable, reorderable) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><FileText size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Info <em>Sections</em></div><div className="a-card-sub">Our Commitment, Email Support, Custom Orders… — add as many as you need</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addSection}><Plus size={14} /> Add Section</button>
          </div>
          <div className="a-card-body">
            <div className="a-row" style={{ gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div className="a-field" style={{ flex: 1, minWidth: 200 }}><label className="a-label">Sections Eyebrow</label>
                <input className="a-input" value={cfg.sections_eyebrow} onChange={(e) => setCfg((p) => ({ ...p, sections_eyebrow: e.target.value }))} placeholder="Good to Know" /></div>
              <div className="a-field" style={{ flex: 1, minWidth: 200 }}><label className="a-label">Sections Heading</label>
                <input className="a-input" value={cfg.sections_title} onChange={(e) => setCfg((p) => ({ ...p, sections_title: e.target.value }))} placeholder="Contact Us & Information" /></div>
            </div>
            <p className="a-hint ctu-a-hint-link" style={{ marginBottom: 16 }}>
              <Link2 size={13} /> Tip: write <strong>[book an appointment](/appointments)</strong> in a body to create an underlined link — bare emails, URLs and +phone numbers link automatically.
            </p>

            {cfg.sections.length === 0 ? (
              <p className="a-hint">No sections yet. Click <strong>Add Section</strong> to create your first info block.</p>
            ) : (
              <div className="a-stack">
                {cfg.sections.map((s, i) => (
                  <div className="ctu-a-sec" key={s.id}>
                    <div className="ctu-a-sec-head">
                      <span className="ctu-a-sec-badge">
                        <span className="ctu-a-sec-num">{i + 1}</span>
                        {s.title || 'Untitled section'}
                      </span>
                      <div className="ctu-a-sec-actions">
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => updSection(i, { is_visible: !s.is_visible })} title={s.is_visible ? 'Visible — click to hide' : 'Hidden — click to show'}>
                          {s.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--sm" onClick={() => moveSection(i, 1)} disabled={i === cfg.sections.length - 1} title="Move down"><ArrowDown size={14} /></button>
                        <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeSection(i)} title="Delete section"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="a-form-grid">
                      <div className="a-field"><label className="a-label">Eyebrow (small kicker)</label>
                        <input className="a-input" value={s.eyebrow} onChange={(e) => updSection(i, { eyebrow: e.target.value })} placeholder="Our Promise" /></div>
                      <div className="a-field"><label className="a-label">Heading</label>
                        <input className="a-input" value={s.title} onChange={(e) => updSection(i, { title: e.target.value })} placeholder="Our Commitment to You" /></div>
                      <div className="a-field a-col-span-2"><label className="a-label">Body <span className="a-hint" style={{ margin: 0 }}>(blank line = new paragraph · [label](link) = underlined link)</span></label>
                        <textarea className="a-textarea" value={s.body} onChange={(e) => updSection(i, { body: e.target.value })} rows={5} /></div>

                      {/* ── nested points editor ── */}
                      <div className="a-field a-col-span-2">
                        <div className="ctu-a-pts-head">
                          <label className="a-label" style={{ margin: 0 }}>Points <span className="a-hint" style={{ margin: 0 }}>(icon + title + short text checklist)</span></label>
                          <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => addPoint(i)}><Plus size={13} /> Add Point</button>
                        </div>
                        {s.points.length === 0 ? (
                          <p className="a-hint">No points yet. Click <strong>Add Point</strong> to add an icon + title + short text.</p>
                        ) : (
                          <div className="ctu-a-pts">
                            {s.points.map((pt, pi) => (
                              <div className="ctu-a-pt" key={pt.id}>
                                <div className="ctu-a-pt-fields">
                                  <div className="ctu-a-pt-row">
                                    <select className="a-select" style={{ maxWidth: 180 }} value={pt.icon}
                                      onChange={(e) => updPoint(i, pi, { icon: e.target.value })} title="Icon">
                                      {CONTACT_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
                                    </select>
                                    <input className="a-input" value={pt.title} onChange={(e) => updPoint(i, pi, { title: e.target.value })} placeholder="Point title" />
                                  </div>
                                  <textarea className="a-textarea" value={pt.text} onChange={(e) => updPoint(i, pi, { text: e.target.value })} rows={2} placeholder="Short description" />
                                </div>
                                <div className="ctu-a-pt-actions">
                                  <button className="a-icon-btn a-icon-btn--sm" onClick={() => movePoint(i, pi, -1)} disabled={pi === 0} title="Move up"><ArrowUp size={14} /></button>
                                  <button className="a-icon-btn a-icon-btn--sm" onClick={() => movePoint(i, pi, 1)} disabled={pi === s.points.length - 1} title="Move down"><ArrowDown size={14} /></button>
                                  <button className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removePoint(i, pi)} title="Delete point"><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
