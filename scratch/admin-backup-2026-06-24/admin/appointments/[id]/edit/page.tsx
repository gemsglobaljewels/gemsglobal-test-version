'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Calendar, User, Phone, Mail } from 'lucide-react'
import { useParams } from 'next/navigation'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@200;300;400;500&display=swap');

.ea-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: 'Jost', sans-serif;
}

/* ── Back ── */
.ea-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 36px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  padding: 0 18px;
  height: 36px;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.ea-back:hover { border-color: rgba(212,175,55,0.4); color: #D4AF37; background: rgba(212,175,55,0.04); }
.ea-back svg { width: 13px; height: 13px; }

/* ── Alerts ── */
.ea-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid;
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.03em;
}
.ea-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.ea-alert-close { margin-left: auto; background: transparent; border: none; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; }
.ea-alert--error { background: rgba(180,50,40,0.08); border-color: rgba(180,50,40,0.22); color: rgba(220,100,90,0.9); }
.ea-alert--error .ea-alert-close { color: rgba(220,100,90,0.6); }
.ea-alert--success { background: rgba(74,222,128,0.05); border-color: rgba(74,222,128,0.20); color: rgba(74,222,128,0.85); }
.ea-alert--success .ea-alert-close { color: rgba(74,222,128,0.6); }

/* ── Page Header ── */
.ea-header { margin-bottom: 32px; }
.ea-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.ea-eyebrow-line { width: 20px; height: 1px; background: #D4AF37; flex-shrink: 0; }
.ea-eyebrow-tag { font-size: 8px; font-weight: 400; letter-spacing: 0.44em; text-transform: uppercase; color: rgba(212,175,55,0.65); }
.ea-page-title { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 300; color: #F0EBE0; line-height: 1.1; margin: 0 0 6px 0; }
.ea-page-title em { font-style: italic; color: #D4AF37; }
.ea-page-subtitle { font-size: 11px; font-weight: 300; color: rgba(235,229,216,0.38); letter-spacing: 0.06em; }

/* ── Loading ── */
.ea-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 14px;
}
.ea-loading-ring {
  width: 32px; height: 32px;
  border: 1px solid rgba(212,175,55,0.12);
  border-top-color: rgba(212,175,55,0.55);
  border-radius: 50%;
  animation: ea-spin 1s linear infinite;
}
@keyframes ea-spin { to { transform: rotate(360deg); } }
.ea-loading-label { font-size: 9px; font-weight: 300; letter-spacing: 0.30em; text-transform: uppercase; color: rgba(235,229,216,0.25); }

/* ── Cards ── */
.ea-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  margin-bottom: 20px;
}
.ea-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.40), transparent);
  pointer-events: none;
}
.ea-card-header {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.ea-card-header svg { width: 14px; height: 14px; color: rgba(212,175,55,0.45); flex-shrink: 0; }
.ea-card-title { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; color: #F0EBE0; margin: 0; }
.ea-card-title em { font-style: italic; color: #D4AF37; }
.ea-card-body { padding: 24px 22px; }

/* ── Read-only zone ── */
.ea-readonly-zone {
  background: rgba(235,229,216,0.02);
  border: 1px solid rgba(212,175,55,0.07);
  padding: 18px 20px;
  margin-bottom: 4px;
}
.ea-readonly-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
.ea-readonly-label {
  font-size: 7.5px; font-weight: 400; letter-spacing: 0.40em;
  text-transform: uppercase; color: rgba(212,175,55,0.40);
  margin-bottom: 5px; display: block;
}
.ea-readonly-val { font-size: 12px; font-weight: 300; color: rgba(235,229,216,0.48); letter-spacing: 0.04em; font-style: italic; }
.ea-readonly-val--empty { color: rgba(235,229,216,0.20); }

/* ── Form grid ── */
.ea-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 24px; }
.ea-form-grid--full { grid-column: 1 / -1; }
.ea-field { display: flex; flex-direction: column; }
.ea-label {
  font-size: 8px; font-weight: 400; letter-spacing: 0.40em;
  text-transform: uppercase; color: rgba(212,175,55,0.55);
  margin-bottom: 8px; display: block;
}
.ea-input, .ea-select, .ea-textarea {
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: 'Jost', sans-serif;
  font-size: 12px; font-weight: 300; color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box; width: 100%;
}
.ea-input::placeholder, .ea-textarea::placeholder { color: rgba(235,229,216,0.2); }
.ea-input:focus, .ea-select:focus, .ea-textarea:focus {
  border-color: rgba(212,175,55,0.40);
  background: rgba(235,229,216,0.06);
}
.ea-input { height: 40px; padding: 0 12px; }
.ea-input[type="date"], .ea-input[type="time"] { color-scheme: dark; }
.ea-select {
  height: 40px; padding: 0 12px;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center; cursor: pointer;
}
.ea-select option { background: #13100c; color: #EBE5D8; }
.ea-textarea { padding: 10px 12px; line-height: 1.6; resize: none; }

/* ── Form Actions ── */
.ea-form-actions {
  display: flex; gap: 12px;
  margin-top: 28px; padding-top: 24px;
  border-top: 1px solid rgba(212,175,55,0.07);
}
.ea-btn-primary {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; justify-content: center;
  background: #D4AF37; color: #0a0806; border: none;
  font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; flex: 1;
  transition: background 0.2s, box-shadow 0.2s;
}
.ea-btn-primary:hover { background: #E8D48B; box-shadow: 0 6px 24px rgba(212,175,55,0.28); }
.ea-btn-primary::before {
  content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg); transition: left 0.5s;
}
.ea-btn-primary:hover::before { left: 160%; }
.ea-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; }
.ea-btn-primary:disabled::before { display: none; }
.ea-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: 'Jost', sans-serif; font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; flex: 1; text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.ea-btn-ghost:hover { border-color: rgba(212,175,55,0.4); color: #D4AF37; background: rgba(212,175,55,0.04); }
`

export default function EditAppointmentPage() {
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
        setFormData({
          date: data.date || '',
          time: data.time || '',
          status: data.status || 'pending',
          notes: data.notes || '',
          service: data.service || '',
        })
      } else {
        setError('Failed to load appointment')
      }
    } catch {
      setError('Failed to load appointment')
    } finally {
      setLoading(false)
    }
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setSuccess('Appointment updated successfully')
        setTimeout(() => window.history.back(), 1500)
      } else {
        setError('Failed to update appointment')
      }
    } catch {
      setError('Error updating appointment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="ea-page">

        <Link href="/admin/appointments" className="ea-back">
          <ArrowLeft />
          Back to Appointments
        </Link>

        {error && (
          <div className="ea-alert ea-alert--error">
            <AlertCircle /><span>{error}</span>
            <button className="ea-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="ea-alert ea-alert--success">
            <CheckCircle /><span>{success}</span>
            <button className="ea-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        <div className="ea-header">
          <div className="ea-eyebrow">
            <span className="ea-eyebrow-line" />
            <span className="ea-eyebrow-tag">Bookings</span>
          </div>
          <h1 className="ea-page-title">Edit <em>Appointment</em></h1>
          <p className="ea-page-subtitle">
            {appointment?.customerName ? `${appointment.customerName} · ` : ''}#{appointmentId?.slice(0, 8)}
          </p>
        </div>

        {loading ? (
          <div className="ea-loading">
            <div className="ea-loading-ring" />
            <span className="ea-loading-label">Loading appointment</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Customer Info — read only */}
            <div className="ea-card">
              <div className="ea-card-header">
                <User size={14} />
                <h2 className="ea-card-title">Customer <em>Information</em></h2>
              </div>
              <div className="ea-card-body">
                <div className="ea-readonly-zone">
                  <div className="ea-readonly-grid">
                    <div>
                      <span className="ea-readonly-label">Full Name</span>
                      <span className={`ea-readonly-val${!appointment?.customerName ? ' ea-readonly-val--empty' : ''}`}>
                        {appointment?.customerName || 'Not on record'}
                      </span>
                    </div>
                    <div>
                      <span className="ea-readonly-label">Email Address</span>
                      <span className={`ea-readonly-val${!appointment?.customerEmail ? ' ea-readonly-val--empty' : ''}`}>
                        {appointment?.customerEmail || 'Not on record'}
                      </span>
                    </div>
                    <div>
                      <span className="ea-readonly-label">Phone Number</span>
                      <span className={`ea-readonly-val${!appointment?.customerPhone ? ' ea-readonly-val--empty' : ''}`}>
                        {appointment?.customerPhone || 'Not on record'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Booking Details */}
            <div className="ea-card">
              <div className="ea-card-header">
                <Calendar size={14} />
                <h2 className="ea-card-title">Booking <em>Details</em></h2>
              </div>
              <div className="ea-card-body">
                <div className="ea-form-grid">

                  <div className="ea-field">
                    <label className="ea-label">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="ea-input" />
                  </div>

                  <div className="ea-field">
                    <label className="ea-label">Time</label>
                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="ea-input" />
                  </div>

                  <div className="ea-field">
                    <label className="ea-label">Service</label>
                    <select name="service" value={formData.service} onChange={handleChange} className="ea-select">
                      <option value="">Select a service…</option>
                      <option value="consultation">Consultation</option>
                      <option value="fitting">Fitting</option>
                      <option value="custom-design">Custom Design</option>
                      <option value="repair">Repair &amp; Restoration</option>
                    </select>
                  </div>

                  <div className="ea-field">
                    <label className="ea-label">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="ea-select">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="ea-field ea-form-grid--full">
                    <label className="ea-label">Internal Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange}
                      className="ea-textarea" rows={4}
                      placeholder="Add notes about this appointment…" />
                  </div>

                </div>

                <div className="ea-form-actions">
                  <Link href="/admin/appointments" className="ea-btn-ghost">Cancel</Link>
                  <button type="submit" disabled={saving} className="ea-btn-primary">
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