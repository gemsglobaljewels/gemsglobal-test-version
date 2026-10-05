'use client'

// ─────────────────────────────────────────────
// AdminAppointmentsPage
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, AlertCircle, Calendar, Video, Store, Settings2 } from 'lucide-react'

const SERVICE_LABELS: Record<string, string> = {
  consultation: 'Personal Consultation',
  fitting: 'Jewellery Fitting',
  'custom-design': 'Custom Design Session',
  repair: 'Repair & Restoration',
  styling: 'Styling Advice',
}
function serviceLabel(slug: string): string {
  if (!slug) return '—'
  if (SERVICE_LABELS[slug]) return SERVICE_LABELS[slug]
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchAppointments() }, [])

  async function fetchAppointments() {
    try {
      const response = await fetch('/api/appointments')
      const data = await response.json()
      setAppointments(data)
    } catch {
      setError('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  async function deleteAppointment(id: string) {
    try {
      await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      setAppointments(appointments.filter(a => a.id !== id))
    } catch {}
  }

  const filtered = appointments.filter((apt) =>
    apt.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusKey = (s: string) =>
    ['pending','confirmed','completed','cancelled'].includes(s) ? s : 'pending'

  const STATUS_VARIANT: Record<string, string> = {
    pending: 'warning',
    confirmed: 'success',
    completed: 'info',
    cancelled: 'danger',
  }

  return (
    <div className="a-page">
      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-row a-row--between" style={{ padding: '14px 18px', gap: 12 }}>
            <div className="a-row" style={{ gap: 10, color: 'var(--c-danger)' }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: 13, color: 'var(--c-danger)' }}>{error}</span>
            </div>
            <button
              type="button"
              className="a-icon-btn a-icon-btn--sm a-icon-btn--danger"
              onClick={() => setError('')}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Bookings</div>
          <h1 className="a-title">Client <em>Appointments</em></h1>
          <p className="a-subtitle">Manage consultations, fittings &amp; bespoke sessions</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/appointments/services" className="a-btn a-btn--ghost">
            <Settings2 size={15} />
            Manage Services
          </Link>
          <Link href="/admin/appointments/new" className="a-btn a-btn--primary">
            <Plus size={15} />
            New Appointment
          </Link>
        </div>
      </div>

      <div className="a-toolbar">
        <div className="a-search">
          <span className="a-search-ico"><Search size={15} /></span>
          <input
            type="text"
            placeholder="Search by customer name or appointment ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="a-search-input"
          />
        </div>
        {searchQuery && (
          <span className="a-muted" style={{ fontSize: 12 }}>
            Showing <strong style={{ color: 'var(--c-accent)' }}>{filtered.length}</strong> of {appointments.length} appointments
          </span>
        )}
      </div>

      <div className="a-table-wrap">
        <div className="a-table-scroll">
          <table className="a-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Mode</th>
                <th>Service</th>
                <th>Date &amp; Time</th>
                <th>Status</th>
                <th className="a-td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-loader-row">
                      <span className="a-loader" />
                      <span className="a-loader-label">Loading appointments</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="a-empty">
                      <div className="a-empty-ico"><Calendar size={20} /></div>
                      <div className="a-empty-title">{searchQuery ? 'No results match your search' : 'No appointments found'}</div>
                      <div className="a-empty-text">
                        {searchQuery ? 'Try a different name or appointment ID.' : 'New bookings will appear here as they come in.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id}>
                    <td><span className="a-mono">{String(apt.id).slice(0, 8)}…</span></td>
                    <td><span className="a-cell-name">{apt.customerName || '—'}</span></td>
                    <td>
                      {apt.appointmentType === 'online' ? (
                        <span className="a-badge a-badge--info" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Video size={12} /> Online
                        </span>
                      ) : (
                        <span className="a-badge a-badge--accent" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Store size={12} /> In-Person
                        </span>
                      )}
                      {apt.appointmentType === 'online' && apt.preferredPlatform && (
                        <div className="a-cell-meta" style={{ marginTop: 4 }}>via {apt.preferredPlatform}</div>
                      )}
                    </td>
                    <td>{serviceLabel(apt.service)}</td>
                    <td>
                      <div className="a-cell-name" style={{ fontWeight: 500 }}>{apt.date || '—'}</div>
                      {apt.time && <div className="a-cell-meta">{apt.time}</div>}
                    </td>
                    <td>
                      <span className={`a-badge a-badge--${STATUS_VARIANT[statusKey(apt.status)]}`}>
                        <span className={`a-dot a-dot--${STATUS_VARIANT[statusKey(apt.status)]}`} />
                        {apt.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div className="a-cell-actions">
                        <Link href={`/admin/appointments/${apt.id}/edit`} className="a-icon-btn" aria-label="Edit appointment">
                          <Edit size={14} />
                        </Link>
                        <button
                          type="button"
                          className="a-icon-btn a-icon-btn--danger"
                          onClick={() => deleteAppointment(apt.id)}
                          aria-label="Delete appointment"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminAppointmentsPage


// ─────────────────────────────────────────────────────────────────────────────
// Shared form CSS (used by New + Edit pages)
// ─────────────────────────────────────────────────────────────────────────────

const FORM_CSS = `


.af-page { min-height: 100vh; background: var(--c-bg); padding: clamp(24px, 3vw, 40px) clamp(24px, 3vw, 40px) 88px; font-family: var(--font-main); color: var(--c-text); }

/* back btn */
.af-back {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 28px;
  background: #fff; border: 1px solid var(--c-border);
  color: var(--c-text-muted); font-family: var(--font-main); font-size: 9px;
  font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
  padding: 0 18px; height: 38px; cursor: pointer; text-decoration: none;
  transition: border-color 0.2s cubic-bezier(.4,0,.2,1), color 0.2s cubic-bezier(.4,0,.2,1), background 0.2s cubic-bezier(.4,0,.2,1);
  border-radius: var(--radius);
}
.af-back:hover { border-color: var(--c-accent); color: var(--c-accent); background: var(--c-surface); }
.af-back svg { width: 13px; height: 13px; }

/* alerts */
.af-alert {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px;
  margin-bottom: 24px; border: 1px solid; border-radius: var(--radius);
  font-size: 13px; font-weight: 300; letter-spacing: 0.01em;
}
.af-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.af-alert-close { margin-left: auto; background: transparent; border: none; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; opacity: 0.6; transition: opacity 0.2s; }
.af-alert-close:hover { opacity: 1; }
.af-alert--error { background: var(--c-danger-bg); border-color: var(--c-danger); color: var(--c-danger); }
.af-alert--error .af-alert-close { color: var(--c-danger); }
.af-alert--success { background: var(--c-success-bg); border-color: var(--c-success); color: var(--c-success); }
.af-alert--success .af-alert-close { color: var(--c-success); }

/* header */
.af-header { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--c-border); }
.af-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.af-eyebrow-line { width: 20px; height: 1px; background: var(--c-accent); flex-shrink: 0; }
.af-eyebrow-tag { font-size: 9px; font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase; color: var(--c-text-muted); }
.af-page-title { font-family: var(--font-main); font-size: 32px; font-weight: 300; color: var(--c-text); line-height: 1.1; margin: 0 0 8px 0; }
.af-page-title em { font-style: italic; color: var(--c-accent); }
.af-page-subtitle { font-size: 13px; font-weight: 300; color: var(--c-text-muted); letter-spacing: 0.02em; }

/* loading */
.af-loading { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 14px; }
.af-loading-ring { width: 32px; height: 32px; border: 1px solid var(--c-border); border-top-color: var(--c-accent); border-radius: 50%; animation: af-spin 1s linear infinite; }
@keyframes af-spin { to { transform: rotate(360deg); } }
.af-loading-label { font-size: 9px; font-weight: 300; letter-spacing: 0.30em; text-transform: uppercase; color: var(--c-text-muted); }

/* cards */
.af-card { background: #FFFFFF; border: 1px solid var(--c-border); border-radius: 14px; box-shadow: var(--shadow-sm); position: relative; margin-bottom: 20px; overflow: hidden; }
.af-card-header { display: flex; align-items: center; gap: 10px; padding: 18px 24px; border-bottom: 1px solid var(--c-border); background: var(--c-surface); }
.af-card-header svg { width: 15px; height: 15px; color: var(--c-accent); flex-shrink: 0; }
.af-card-title { font-family: var(--font-main); font-size: 19px; font-weight: 300; color: var(--c-text); margin: 0; }
.af-card-title em { font-style: italic; color: var(--c-accent); }
.af-card-body { padding: 26px 24px; }

/* readonly info zone */
.af-readonly-zone { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius); padding: 20px 22px; margin-bottom: 20px; }
.af-readonly-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
.af-readonly-field {}
.af-readonly-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 6px; display: block; }
.af-readonly-val { font-size: 14px; font-weight: 300; color: var(--c-text); letter-spacing: 0.01em; }
.af-readonly-val--empty { color: var(--c-text-faint); font-style: italic; }

/* form grid */
.af-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px; }
.af-form-grid--full { grid-column: 1 / -1; }
.af-field { display: flex; flex-direction: column; }
.af-label { font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 8px; display: block; }
.af-label span { color: var(--c-danger); margin-left: 4px; }
.af-input, .af-select, .af-textarea {
  background: #fff; border: 1px solid var(--c-border); border-radius: var(--radius);
  font-family: var(--font-main); font-size: 14px; font-weight: 300; color: var(--c-text);
  outline: none; transition: border-color 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1); box-sizing: border-box; width: 100%;
}
.af-input::placeholder, .af-textarea::placeholder { color: var(--c-text-faint); }
.af-input:focus, .af-select:focus, .af-textarea:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(143,122,112,.12); }
.af-input { height: 44px; padding: 0 14px; }
.af-select {
  height: 44px; padding: 0 14px; appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238F7A70' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; cursor: pointer;
}
.af-select option { background: #fff; color: var(--c-text); }
.af-textarea { padding: 12px 14px; line-height: 1.6; resize: none; }

/* form actions */
.af-form-actions { display: flex; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--c-border); }
.af-btn-primary {
  position: relative; overflow: hidden; display: inline-flex;
  align-items: center; justify-content: center; gap: 8px;
  background: var(--c-accent); color: #fff; border: none;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer;
  transition: background 0.2s cubic-bezier(.4,0,.2,1), box-shadow 0.2s cubic-bezier(.4,0,.2,1), transform 0.2s cubic-bezier(.4,0,.2,1); flex: 1;
  border-radius: var(--radius);
}
.af-btn-primary:hover { background: var(--c-text); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.af-btn-primary::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg); transition: left 0.5s;
}
.af-btn-primary:hover::before { left: 160%; }
.af-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; transform: none; }
.af-btn-primary:disabled::before { display: none; }
.af-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  background: #fff; border: 1px solid var(--c-border);
  color: var(--c-text); font-family: var(--font-main); font-size: 9px;
  font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; text-decoration: none;
  transition: border-color 0.2s cubic-bezier(.4,0,.2,1), color 0.2s cubic-bezier(.4,0,.2,1), background 0.2s cubic-bezier(.4,0,.2,1); flex: 1;
  border-radius: var(--radius);
}
.af-btn-ghost:hover { border-color: var(--c-accent); color: var(--c-accent); background: var(--c-surface); }
`

// ─────────────────────────────────────────────
// NewAppointmentPage
// ─────────────────────────────────────────────
import { ArrowLeft, AlertCircle as AC, CheckCircle, Calendar as Cal, User as Usr, Phone as Ph } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function NewAppointmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    date: '', time: '', service: '', notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    if (!formData.customerName || !formData.date || !formData.time || !formData.service) {
      setError('Please fill in all required fields'); setSaving(false); return
    }
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSuccess('Appointment created successfully')
        setTimeout(() => router.push('/admin/appointments'), 1500)
      } else { setError('Failed to create appointment') }
    } catch { setError('Error creating appointment') } finally { setSaving(false) }
  }

  return (
    <>
      <style>{FORM_CSS}</style>
      <div className="af-page">
        <Link href="/admin/appointments" className="af-back">
          <ArrowLeft /> Back to Appointments
        </Link>

        {error && (
          <div className="af-alert af-alert--error">
            <AC /><span>{error}</span>
            <button className="af-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="af-alert af-alert--success">
            <CheckCircle size={14} /><span>{success}</span>
            <button className="af-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        <div className="af-header">
          <div className="af-eyebrow">
            <span className="af-eyebrow-line" />
            <span className="af-eyebrow-tag">Bookings</span>
          </div>
          <h1 className="af-page-title">New <em>Appointment</em></h1>
          <p className="af-page-subtitle">Schedule a consultation, fitting or bespoke session</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Customer */}
          <div className="af-card">
            <div className="af-card-header">
              <Usr size={14} />
              <h2 className="af-card-title">Customer <em>Details</em></h2>
            </div>
            <div className="af-card-body">
              <div className="af-form-grid">
                <div className="af-field">
                  <label className="af-label">Customer Name <span>*</span></label>
                  <input name="customerName" value={formData.customerName} onChange={handleChange}
                    className="af-input" placeholder="e.g. Priya Mehta" />
                </div>
                <div className="af-field">
                  <label className="af-label">Phone Number</label>
                  <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange}
                    className="af-input" placeholder="+44 7700 900123" />
                </div>
                <div className="af-field af-form-grid--full">
                  <label className="af-label">Email Address</label>
                  <input type="email" name="customerEmail" value={formData.customerEmail} onChange={handleChange}
                    className="af-input" placeholder="priya@example.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Booking */}
          <div className="af-card">
            <div className="af-card-header">
              <Cal size={14} />
              <h2 className="af-card-title">Booking <em>Details</em></h2>
            </div>
            <div className="af-card-body">
              <div className="af-form-grid">
                <div className="af-field">
                  <label className="af-label">Date <span>*</span></label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} className="af-input" />
                </div>
                <div className="af-field">
                  <label className="af-label">Time <span>*</span></label>
                  <input type="time" name="time" value={formData.time} onChange={handleChange} className="af-input" />
                </div>
                <div className="af-field af-form-grid--full">
                  <label className="af-label">Service <span>*</span></label>
                  <select name="service" value={formData.service} onChange={handleChange} className="af-select">
                    <option value="">Select a service…</option>
                    <option value="consultation">Consultation</option>
                    <option value="fitting">Fitting</option>
                    <option value="custom-design">Custom Design</option>
                    <option value="repair">Repair &amp; Restoration</option>
                  </select>
                </div>
                <div className="af-field af-form-grid--full">
                  <label className="af-label">Internal Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange}
                    className="af-textarea" rows={4}
                    placeholder="Customer preferences, previous visits, special requirements…" />
                </div>
              </div>

              <div className="af-form-actions">
                <Link href="/admin/appointments" className="af-btn-ghost">Cancel</Link>
                <button type="submit" disabled={saving} className="af-btn-primary">
                  {saving ? 'Creating…' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────
// EditAppointmentPage
// ─────────────────────────────────────────────
import { useParams } from 'next/navigation'
import { Mail } from 'lucide-react'

export function EditAppointmentPage() {
  const params = useParams()
  const appointmentId = params.id as string
  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    date: '', time: '', status: 'pending', notes: '', service: '',
  })

  useEffect(() => { fetchAppointment() }, [appointmentId])

  async function fetchAppointment() {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
        setFormData({ date: data.date || '', time: data.time || '', status: data.status || 'pending', notes: data.notes || '', service: data.service || '' })
      } else { setError('Failed to load appointment') }
    } catch { setError('Failed to load appointment') } finally { setLoading(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSuccess('Appointment updated successfully')
        setTimeout(() => window.history.back(), 1500)
      } else { setError('Failed to update appointment') }
    } catch { setError('Error updating appointment') } finally { setSaving(false) }
  }

  return (
    <>
      <style>{FORM_CSS}</style>
      <div className="af-page">
        <Link href="/admin/appointments" className="af-back">
          <ArrowLeft /> Back to Appointments
        </Link>

        {error && (
          <div className="af-alert af-alert--error">
            <AC /><span>{error}</span>
            <button className="af-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="af-alert af-alert--success">
            <CheckCircle size={14} /><span>{success}</span>
            <button className="af-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        <div className="af-header">
          <div className="af-eyebrow">
            <span className="af-eyebrow-line" />
            <span className="af-eyebrow-tag">Bookings</span>
          </div>
          <h1 className="af-page-title">Edit <em>Appointment</em></h1>
          <p className="af-page-subtitle">
            {appointment?.customerName ? `${appointment.customerName} · ` : ''}#{appointmentId?.slice(0, 8)}
          </p>
        </div>

        {loading ? (
          <div className="af-loading">
            <div className="af-loading-ring" />
            <span className="af-loading-label">Loading appointment</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Read-only customer info */}
            <div className="af-card">
              <div className="af-card-header">
                <Usr size={14} />
                <h2 className="af-card-title">Customer <em>Information</em></h2>
              </div>
              <div className="af-card-body">
                <div className="af-readonly-zone">
                  <div className="af-readonly-grid">
                    <div className="af-readonly-field">
                      <span className="af-readonly-label">Full Name</span>
                      <span className={`af-readonly-val${!appointment?.customerName ? ' af-readonly-val--empty' : ''}`}>
                        {appointment?.customerName || 'Not on record'}
                      </span>
                    </div>
                    <div className="af-readonly-field">
                      <span className="af-readonly-label">Email Address</span>
                      <span className={`af-readonly-val${!appointment?.customerEmail ? ' af-readonly-val--empty' : ''}`}>
                        {appointment?.customerEmail || 'Not on record'}
                      </span>
                    </div>
                    <div className="af-readonly-field">
                      <span className="af-readonly-label">Phone Number</span>
                      <span className={`af-readonly-val${!appointment?.customerPhone ? ' af-readonly-val--empty' : ''}`}>
                        {appointment?.customerPhone || 'Not on record'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable booking fields */}
            <div className="af-card">
              <div className="af-card-header">
                <Cal size={14} />
                <h2 className="af-card-title">Booking <em>Details</em></h2>
              </div>
              <div className="af-card-body">
                <div className="af-form-grid">

                  <div className="af-field">
                    <label className="af-label">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="af-input" />
                  </div>
                  <div className="af-field">
                    <label className="af-label">Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="af-input" />
                  </div>

                  <div className="af-field">
                    <label className="af-label">Service</label>
                    <select name="service" value={formData.service} onChange={handleChange} className="af-select">
                      <option value="">Select a service…</option>
                      <option value="consultation">Consultation</option>
                      <option value="fitting">Fitting</option>
                      <option value="custom-design">Custom Design</option>
                      <option value="repair">Repair &amp; Restoration</option>
                    </select>
                  </div>

                  <div className="af-field">
                    <label className="af-label">Status</label>
                    {appointment?.status === 'completed' ? (
                      <>
                        <select name="status" value="completed" disabled className="af-select" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                          <option value="completed">Completed</option>
                        </select>
                        <span style={{ fontSize: '11px', color: 'var(--c-info)', marginTop: '8px', letterSpacing: '0.02em' }}>✦ Completed appointments cannot be changed</span>
                      </>
                    ) : appointment?.status === 'cancelled' || appointment?.status === 'confirmed' ? (
                      <select name="status" value={formData.status} onChange={handleChange} className="af-select">
                        {appointment?.status === 'cancelled' && <option value="cancelled">Cancelled</option>}
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        {appointment?.status !== 'cancelled' && <option value="cancelled">Cancelled</option>}
                      </select>
                    ) : (
                      <select name="status" value={formData.status} onChange={handleChange} className="af-select">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>

                  <div className="af-field af-form-grid--full">
                    <label className="af-label">Internal Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange}
                      className="af-textarea" rows={4}
                      placeholder="Add notes about this appointment…" />
                  </div>

                </div>

                <div className="af-form-actions">
                  <Link href="/admin/appointments" className="af-btn-ghost">Cancel</Link>
                  <button type="submit" disabled={saving} className="af-btn-primary">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

          </form>
        )}
      </div>
    </>
  )
}
