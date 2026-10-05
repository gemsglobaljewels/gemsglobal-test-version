'use client'

// ─────────────────────────────────────────────
// AdminAppointmentsPage
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Plus, Edit, Trash2, AlertCircle, Calendar } from 'lucide-react'

const APPOINTMENTS_CSS = `


.ap-page {
  min-height: 100vh;
  background: var(--c-bg);
  padding: 40px 48px;
  font-family: var(--font-main);
}
.ap-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 36px;
}
.ap-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.ap-eyebrow-line { width: 20px; height: 1px; background: var(--c-accent); flex-shrink: 0; }
.ap-eyebrow-tag {
  font-size: 8px; font-weight: 400; letter-spacing: 0.44em;
  text-transform: uppercase; color: var(--c-text-muted);
}
.ap-page-title {
  font-family: var(--font-main);
  font-size: 36px; font-weight: 300; color: var(--c-text);
  line-height: 1.1; margin: 0 0 6px 0;
}
.ap-page-title em { font-style: italic; color: var(--c-accent); }
.ap-page-subtitle { font-size: 11px; font-weight: 300; color: var(--c-text-muted); letter-spacing: 0.06em; }

/* Primary button */
.ap-btn-primary {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--c-accent); color: #fff; border: none;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 42px; padding: 0 22px; cursor: pointer; text-decoration: none;
  transition: background 0.2s, box-shadow 0.2s;
  border-radius: var(--radius);
}
.ap-btn-primary:hover { background: var(--c-text); box-shadow: var(--shadow-md); }
.ap-btn-primary::before {
  content: ''; position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg); transition: left 0.5s;
}
.ap-btn-primary:hover::before { left: 160%; }
.ap-btn-primary svg { width: 13px; height: 13px; }

/* Alert */
.ap-alert {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 18px; margin-bottom: 24px;
  border: 1px solid rgba(180,50,40,0.22); background: rgba(180,50,40,0.08);
  font-size: 12px; font-weight: 300; color: rgba(220,100,90,0.9); letter-spacing: 0.03em;
}
.ap-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.ap-alert-close {
  margin-left: auto; background: transparent; border: none;
  cursor: pointer; color: rgba(220,100,90,0.6); font-size: 16px; line-height: 1; padding: 0;
}
.ap-alert-close:hover { color: rgba(220,100,90,1); }

/* Search card */
.ap-search-card {
  background: var(--c-surface); border: 1px solid var(--c-border);
  position: relative; padding: 16px 20px; margin-bottom: 20px;
}
.ap-search-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.30), transparent);
}
.ap-search-wrap { position: relative; display: flex; align-items: center; }
.ap-search-icon { position: absolute; left: 12px; color: var(--c-text-muted); pointer-events: none; display: flex; }
.ap-search-icon svg { width: 14px; height: 14px; }
.ap-search-input {
  width: 100%; height: 40px; padding: 0 12px 0 38px;
  background: rgba(var(--c-text-rgb), 0.04); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 12px; font-weight: 300; color: var(--c-text);
  outline: none; transition: border-color 0.2s, background 0.2s; box-sizing: border-box;
}
.ap-search-input::placeholder { color: var(--c-text-muted); }
.ap-search-input:focus { border-color: var(--c-accent); background: rgba(var(--c-text-rgb), 0.06); }
.ap-search-meta { margin-top: 10px; font-size: 9px; font-weight: 300; letter-spacing: 0.12em; color: var(--c-text-muted); }
.ap-search-meta strong { font-weight: 400; color: var(--c-accent); }

/* Table card */
.ap-table-card {
  background: var(--c-surface); border: 1px solid var(--c-border);
  position: relative; overflow: hidden;
}
.ap-table-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.45), transparent);
  pointer-events: none; z-index: 1;
}
.ap-table-scroll {
  overflow-x: auto; scrollbar-width: thin;
  scrollbar-color: rgba(var(--c-accent-rgb), 0.2) transparent;
}
.ap-table-scroll::-webkit-scrollbar { height: 4px; }
.ap-table-scroll::-webkit-scrollbar-thumb { background: rgba(var(--c-accent-rgb), 0.2); }
.ap-table { width: 100%; border-collapse: collapse; min-width: 760px; }
.ap-table thead { background: rgba(var(--c-accent-rgb), 0.04); border-bottom: 1px solid var(--c-border); }
.ap-table th {
  padding: 14px 20px; text-align: left;
  font-size: 7.5px; font-weight: 500; letter-spacing: 0.38em;
  text-transform: uppercase; color: var(--c-text-muted); white-space: nowrap;
}
.ap-table th.ap-th-center { text-align: center; }
.ap-table tbody tr { border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.05); transition: background 0.15s; }
.ap-table tbody tr:last-child { border-bottom: none; }
.ap-table tbody tr:hover { background: rgba(var(--c-accent-rgb), 0.03); }
.ap-table td {
  padding: 16px 20px; font-size: 12px; font-weight: 300;
  color: var(--c-text-muted); letter-spacing: 0.04em; vertical-align: middle;
}
.ap-table td.ap-td-center { text-align: center; }

/* Cell types */
.ap-id-val { font-family: 'Courier New', monospace; font-size: 10px; color: var(--c-text-muted); }
.ap-customer-name { font-size: 12px; font-weight: 400; color: var(--c-text); }
.ap-service-val { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.06em; }
.ap-date-val { font-size: 11px; color: var(--c-text-muted); }
.ap-time-val { font-size: 10px; color: var(--c-text-muted); letter-spacing: 0.06em; margin-top: 2px; }

/* Status badges */
.ap-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 9px; border: 1px solid;
  font-size: 8px; font-weight: 400; letter-spacing: 0.17em; text-transform: uppercase;
}
.ap-badge-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.ap-badge--pending { background: rgba(251,191,36,0.07); border-color: rgba(251,191,36,0.25); color: rgba(251,191,36,0.85); }
.ap-badge--pending .ap-badge-dot { background: rgba(251,191,36,0.8); }
.ap-badge--confirmed { background: rgba(74,222,128,0.07); border-color: rgba(74,222,128,0.25); color: rgba(74,222,128,0.85); }
.ap-badge--confirmed .ap-badge-dot { background: rgba(74,222,128,0.8); }
.ap-badge--completed { background: rgba(96,165,250,0.07); border-color: rgba(96,165,250,0.25); color: rgba(96,165,250,0.85); }
.ap-badge--completed .ap-badge-dot { background: rgba(96,165,250,0.8); }
.ap-badge--cancelled { background: rgba(248,113,113,0.07); border-color: rgba(248,113,113,0.25); color: rgba(248,113,113,0.85); }
.ap-badge--cancelled .ap-badge-dot { background: rgba(248,113,113,0.8); }

/* Action buttons */
.ap-actions { display: flex; align-items: center; justify-content: center; gap: 6px; }
.ap-action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; background: transparent;
  border: 1px solid var(--c-border); color: var(--c-accent);
  cursor: pointer; text-decoration: none;
  transition: border-color 0.18s, color 0.18s, background 0.18s;
}
.ap-action-btn svg { width: 13px; height: 13px; }
.ap-action-btn:hover { border-color: var(--c-accent); color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.06); }
.ap-action-btn--delete { border-color: rgba(248,113,113,0.12); color: rgba(248,113,113,0.45); }
.ap-action-btn--delete:hover { border-color: rgba(248,113,113,0.38); background: rgba(248,113,113,0.07); color: rgba(248,113,113,0.9); }

/* Empty / Loading */
.ap-state-row td { padding: 60px 20px; text-align: center; }
.ap-state-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.ap-state-icon {
  width: 40px; height: 40px; border: 1px solid var(--c-border);
  display: flex; align-items: center; justify-content: center; color: var(--c-text-muted);
}
.ap-state-icon svg { width: 18px; height: 18px; }
.ap-state-label {
  font-size: 10px; font-weight: 300; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--c-text-muted);
}
.ap-loading-ring {
  width: 28px; height: 28px;
  border: 1px solid var(--c-border); border-top-color: var(--c-accent);
  border-radius: 50%; animation: ap-spin 1s linear infinite;
}
@keyframes ap-spin { to { transform: rotate(360deg); } }
`

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

  return (
    <>
      <style>{APPOINTMENTS_CSS}</style>
      <div className="ap-page">
        {error && (
          <div className="ap-alert">
            <AlertCircle />
            <span>{error}</span>
            <button className="ap-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="ap-header">
          <div>
            <div className="ap-eyebrow">
              <span className="ap-eyebrow-line" />
              <span className="ap-eyebrow-tag">Bookings</span>
            </div>
            <h1 className="ap-page-title">Client <em>Appointments</em></h1>
            <p className="ap-page-subtitle">Manage consultations, fittings &amp; bespoke sessions</p>
          </div>
          <Link href="/admin/appointments/new" className="ap-btn-primary">
            <Plus />
            New Appointment
          </Link>
        </div>

        <div className="ap-search-card">
          <div className="ap-search-wrap">
            <span className="ap-search-icon"><Search /></span>
            <input
              type="text"
              placeholder="Search by customer name or appointment ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ap-search-input"
            />
          </div>
          {searchQuery && (
            <div className="ap-search-meta">
              Showing <strong>{filtered.length}</strong> of {appointments.length} appointments
            </div>
          )}
        </div>

        <div className="ap-table-card">
          <div className="ap-table-scroll">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th className="ap-th-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr className="ap-state-row">
                    <td colSpan={6}>
                      <div className="ap-state-inner">
                        <div className="ap-loading-ring" />
                        <span className="ap-state-label">Loading appointments</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr className="ap-state-row">
                    <td colSpan={6}>
                      <div className="ap-state-inner">
                        <div className="ap-state-icon"><Calendar /></div>
                        <span className="ap-state-label">{searchQuery ? 'No results match your search' : 'No appointments found'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((apt) => (
                    <tr key={apt.id}>
                      <td><span className="ap-id-val">{String(apt.id).slice(0, 8)}…</span></td>
                      <td><span className="ap-customer-name">{apt.customerName || '—'}</span></td>
                      <td><span className="ap-service-val">{apt.service || '—'}</span></td>
                      <td>
                        <div className="ap-date-val">{apt.date || '—'}</div>
                        {apt.time && <div className="ap-time-val">{apt.time}</div>}
                      </td>
                      <td>
                        <span className={`ap-badge ap-badge--${statusKey(apt.status)}`}>
                          <span className="ap-badge-dot" />
                          {apt.status || 'pending'}
                        </span>
                      </td>
                      <td className="ap-td-center">
                        <div className="ap-actions">
                          <Link href={`/admin/appointments/${apt.id}/edit`} className="ap-action-btn">
                            <Edit />
                          </Link>
                          <button className="ap-action-btn ap-action-btn--delete" onClick={() => deleteAppointment(apt.id)}>
                            <Trash2 />
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
    </>
  )
}

export default AdminAppointmentsPage


// ─────────────────────────────────────────────────────────────────────────────
// Shared form CSS (used by New + Edit pages)
// ─────────────────────────────────────────────────────────────────────────────

const FORM_CSS = `


.af-page { min-height: 100vh; background: var(--c-bg); padding: 40px 48px; font-family: var(--font-main); }

/* back btn */
.af-back {
  display: inline-flex; align-items: center; gap: 8px; margin-bottom: 36px;
  background: transparent; border: 1px solid var(--c-border);
  color: var(--c-text-muted); font-family: var(--font-main); font-size: 9px;
  font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
  padding: 0 18px; height: 36px; cursor: pointer; text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
  border-radius: var(--radius);
}
.af-back:hover { border-color: var(--c-accent); color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.04); }
.af-back svg { width: 13px; height: 13px; }

/* alerts */
.af-alert {
  display: flex; align-items: flex-start; gap: 12px; padding: 14px 18px;
  margin-bottom: 24px; border: 1px solid; font-size: 12px; font-weight: 300; letter-spacing: 0.03em;
}
.af-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.af-alert-close { margin-left: auto; background: transparent; border: none; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
.af-alert--error { background: rgba(180,50,40,0.08); border-color: rgba(180,50,40,0.22); color: rgba(220,100,90,0.9); }
.af-alert--error .af-alert-close { color: rgba(220,100,90,0.6); }
.af-alert--success { background: rgba(74,222,128,0.05); border-color: rgba(74,222,128,0.20); color: rgba(74,222,128,0.85); }
.af-alert--success .af-alert-close { color: rgba(74,222,128,0.6); }

/* header */
.af-header { margin-bottom: 32px; }
.af-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.af-eyebrow-line { width: 20px; height: 1px; background: var(--c-accent); flex-shrink: 0; }
.af-eyebrow-tag { font-size: 8px; font-weight: 400; letter-spacing: 0.44em; text-transform: uppercase; color: var(--c-text-muted); }
.af-page-title { font-family: var(--font-main); font-size: 34px; font-weight: 300; color: var(--c-text); line-height: 1.1; margin: 0 0 6px 0; }
.af-page-title em { font-style: italic; color: var(--c-accent); }
.af-page-subtitle { font-size: 11px; font-weight: 300; color: var(--c-text-muted); letter-spacing: 0.06em; }

/* loading */
.af-loading { display: flex; flex-direction: column; align-items: center; padding: 80px 0; gap: 14px; }
.af-loading-ring { width: 32px; height: 32px; border: 1px solid var(--c-border); border-top-color: var(--c-accent); border-radius: 50%; animation: af-spin 1s linear infinite; }
@keyframes af-spin { to { transform: rotate(360deg); } }
.af-loading-label { font-size: 9px; font-weight: 300; letter-spacing: 0.30em; text-transform: uppercase; color: var(--c-text-muted); }

/* cards */
.af-card { background: var(--c-surface); border: 1px solid var(--c-border); position: relative; margin-bottom: 20px; }
.af-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(var(--c-accent-rgb), 0.40), transparent); pointer-events: none; }
.af-card-header { display: flex; align-items: center; gap: 10px; padding: 18px 22px; border-bottom: 1px solid rgba(var(--c-accent-rgb), 0.07); }
.af-card-header svg { width: 14px; height: 14px; color: var(--c-text-muted); flex-shrink: 0; }
.af-card-title { font-family: var(--font-main); font-size: 18px; font-weight: 300; color: var(--c-text); margin: 0; }
.af-card-title em { font-style: italic; color: var(--c-accent); }
.af-card-body { padding: 24px 22px; }

/* readonly info zone */
.af-readonly-zone { background: rgba(var(--c-text-rgb), 0.02); border: 1px solid rgba(var(--c-accent-rgb), 0.07); padding: 18px 20px; margin-bottom: 20px; }
.af-readonly-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
.af-readonly-field {}
.af-readonly-label { font-size: 7.5px; font-weight: 400; letter-spacing: 0.40em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 5px; display: block; }
.af-readonly-val { font-size: 12px; font-weight: 300; color: var(--c-text-muted); letter-spacing: 0.04em; font-style: italic; }
.af-readonly-val--empty { color: var(--c-text-muted); }

/* form grid */
.af-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
.af-form-grid--full { grid-column: 1 / -1; }
.af-field { display: flex; flex-direction: column; }
.af-label { font-size: 8px; font-weight: 400; letter-spacing: 0.40em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 8px; display: block; }
.af-label span { color: rgba(248,113,113,0.6); margin-left: 4px; }
.af-input, .af-select, .af-textarea {
  background: rgba(var(--c-text-rgb), 0.04); border: 1px solid var(--c-border);
  font-family: var(--font-main); font-size: 12px; font-weight: 300; color: var(--c-text);
  outline: none; transition: border-color 0.2s, background 0.2s; box-sizing: border-box; width: 100%;
}
.af-input::placeholder, .af-textarea::placeholder { color: var(--c-text-muted); }
.af-input:focus, .af-select:focus, .af-textarea:focus { border-color: var(--c-accent); background: rgba(var(--c-text-rgb), 0.06); }
.af-input { height: 40px; padding: 0 12px; }
.af-select {
  height: 40px; padding: 0 12px; appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238F7A70' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; cursor: pointer;
}
.af-select option { background: var(--c-surface); color: var(--c-text); }
.af-textarea { padding: 10px 12px; line-height: 1.6; resize: none; }

/* form actions */
.af-form-actions { display: flex; gap: 12px; margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(var(--c-accent-rgb), 0.07); }
.af-btn-primary {
  position: relative; overflow: hidden; display: inline-flex;
  align-items: center; justify-content: center; gap: 8px;
  background: var(--c-accent); color: #fff; border: none;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s; flex: 1;
  border-radius: var(--radius);
}
.af-btn-primary:hover { background: var(--c-text); box-shadow: var(--shadow-md); }
.af-btn-primary::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg); transition: left 0.5s;
}
.af-btn-primary:hover::before { left: 160%; }
.af-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; }
.af-btn-primary:disabled::before { display: none; }
.af-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid var(--c-border);
  color: var(--c-text-muted); font-family: var(--font-main); font-size: 9px;
  font-weight: 500; letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s; flex: 1;
  border-radius: var(--radius);
}
.af-btn-ghost:hover { border-color: var(--c-accent); color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.04); }
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
                        <span style={{ fontSize: '9px', color: 'rgba(96,165,250,0.6)', marginTop: '6px', letterSpacing: '0.10em' }}>✦ Completed appointments cannot be changed</span>
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
