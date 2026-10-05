'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Calendar, User, Phone, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CSS = `


.na-page {
  min-height: 100vh;
  background: #0a0806;
  padding: 40px 48px;
  font-family: var(--font-main);
}

/* ── Back button ── */
.na-back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 36px;
  background: transparent;
  border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: var(--font-main);
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
.na-back:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}
.na-back svg { width: 13px; height: 13px; }

/* ── Alerts ── */
.na-alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  margin-bottom: 24px;
  border: 1px solid;
  font-family: var(--font-main);
  font-size: 12px;
  font-weight: 300;
  letter-spacing: 0.03em;
}
.na-alert svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }
.na-alert-close {
  margin-left: auto;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}
.na-alert--error {
  background: rgba(180,50,40,0.08);
  border-color: rgba(180,50,40,0.22);
  color: rgba(220,100,90,0.9);
}
.na-alert--error .na-alert-close { color: rgba(220,100,90,0.6); }
.na-alert--success {
  background: rgba(74,222,128,0.05);
  border-color: rgba(74,222,128,0.20);
  color: rgba(74,222,128,0.85);
}
.na-alert--success .na-alert-close { color: rgba(74,222,128,0.6); }

/* ── Page Header ── */
.na-header { margin-bottom: 32px; }
.na-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.na-eyebrow-line { width: 20px; height: 1px; background: #D4AF37; flex-shrink: 0; }
.na-eyebrow-tag {
  font-size: 8px; font-weight: 400; letter-spacing: 0.44em;
  text-transform: uppercase; color: rgba(212,175,55,0.65);
}
.na-page-title {
  font-family: var(--font-heading);
  font-size: 34px; font-weight: 300; color: #F0EBE0;
  line-height: 1.1; margin: 0 0 6px 0;
}
.na-page-title em { font-style: italic; color: #D4AF37; }
.na-page-subtitle {
  font-size: 11px; font-weight: 300;
  color: rgba(235,229,216,0.38); letter-spacing: 0.06em;
}

/* ── Cards ── */
.na-card {
  background: #13100c;
  border: 1px solid rgba(212,175,55,0.10);
  position: relative;
  margin-bottom: 20px;
}
.na-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(212,175,55,0.40), transparent);
  pointer-events: none;
}
.na-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(212,175,55,0.07);
}
.na-card-header svg { width: 14px; height: 14px; color: rgba(212,175,55,0.45); flex-shrink: 0; }
.na-card-title {
  font-family: var(--font-heading);
  font-size: 18px; font-weight: 300; color: #F0EBE0; margin: 0;
}
.na-card-title em { font-style: italic; color: #D4AF37; }
.na-card-body { padding: 24px 22px; }

/* ── Form Grid ── */
.na-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
.na-form-grid--full { grid-column: 1 / -1; }
.na-field { display: flex; flex-direction: column; }

.na-label {
  font-size: 8px; font-weight: 400; letter-spacing: 0.40em;
  text-transform: uppercase; color: rgba(212,175,55,0.55);
  margin-bottom: 8px; display: block;
}
.na-label span { color: rgba(248,113,113,0.6); margin-left: 3px; }

.na-input,
.na-select,
.na-textarea {
  background: rgba(235,229,216,0.04);
  border: 1px solid rgba(212,175,55,0.14);
  font-family: var(--font-main);
  font-size: 12px; font-weight: 300; color: #EBE5D8;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  width: 100%;
}
.na-input::placeholder, .na-textarea::placeholder { color: rgba(235,229,216,0.2); }
.na-input:focus, .na-select:focus, .na-textarea:focus {
  border-color: rgba(212,175,55,0.40);
  background: rgba(235,229,216,0.06);
}
.na-input { height: 40px; padding: 0 12px; }
.na-input[type="date"],
.na-input[type="time"] { color-scheme: dark; }

.na-select {
  height: 40px; padding: 0 12px;
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23D4AF37' stroke-width='1.2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
}
.na-select option { background: #13100c; color: #EBE5D8; }

.na-textarea { padding: 10px 12px; line-height: 1.6; resize: none; }

/* ── Form Actions ── */
.na-form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid rgba(212,175,55,0.07);
}
.na-btn-primary {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; justify-content: center;
  background: #D4AF37; color: #0a0806; border: none;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; flex: 1;
  transition: background 0.2s, box-shadow 0.2s;
}
.na-btn-primary:hover { background: #E8D48B; box-shadow: 0 6px 24px rgba(212,175,55,0.28); }
.na-btn-primary::before {
  content: ''; position: absolute; top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transform: skewX(-20deg); transition: left 0.5s;
}
.na-btn-primary:hover::before { left: 160%; }
.na-btn-primary:disabled { opacity: 0.40; cursor: not-allowed; }
.na-btn-primary:disabled::before { display: none; }

.na-btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid rgba(212,175,55,0.18);
  color: rgba(212,175,55,0.55);
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: 0.28em; text-transform: uppercase;
  height: 44px; padding: 0 28px; cursor: pointer; flex: 1;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.na-btn-ghost:hover {
  border-color: rgba(212,175,55,0.4);
  color: #D4AF37;
  background: rgba(212,175,55,0.04);
}
`

export default function NewAppointmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: '',
    time: '',
    service: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    if (!formData.customerName || !formData.date || !formData.time || !formData.service) {
      setError('Please fill in all required fields')
      setSaving(false)
      return
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Appointment created successfully')
        setTimeout(() => router.push('/admin/appointments'), 1500)
      } else {
        setError('Failed to create appointment')
      }
    } catch {
      setError('Error creating appointment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="na-page">

        {/* Back */}
        <Link href="/admin/appointments" className="na-back">
          <ArrowLeft />
          Back to Appointments
        </Link>

        {/* Alerts */}
        {error && (
          <div className="na-alert na-alert--error">
            <AlertCircle />
            <span>{error}</span>
            <button className="na-alert-close" onClick={() => setError('')}>×</button>
          </div>
        )}
        {success && (
          <div className="na-alert na-alert--success">
            <CheckCircle />
            <span>{success}</span>
            <button className="na-alert-close" onClick={() => setSuccess('')}>×</button>
          </div>
        )}

        {/* Page Header */}
        <div className="na-header">
          <div className="na-eyebrow">
            <span className="na-eyebrow-line" />
            <span className="na-eyebrow-tag">Bookings</span>
          </div>
          <h1 className="na-page-title">New <em>Appointment</em></h1>
          <p className="na-page-subtitle">Schedule a consultation, fitting or bespoke session</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Customer Details Card */}
          <div className="na-card">
            <div className="na-card-header">
              <User size={14} />
              <h2 className="na-card-title">Customer <em>Details</em></h2>
            </div>
            <div className="na-card-body">
              <div className="na-form-grid">

                <div className="na-field">
                  <label className="na-label">Customer Name <span>*</span></label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    className="na-input"
                    placeholder="e.g. Priya Mehta"
                  />
                </div>

                <div className="na-field">
                  <label className="na-label">Phone Number</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    className="na-input"
                    placeholder="+44 7700 900123"
                  />
                </div>

                <div className="na-field na-form-grid--full">
                  <label className="na-label">Email Address</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    className="na-input"
                    placeholder="priya@example.com"
                  />
                </div>

              </div>
            </div>
          </div>

          {/* Booking Details Card */}
          <div className="na-card">
            <div className="na-card-header">
              <Calendar size={14} />
              <h2 className="na-card-title">Booking <em>Details</em></h2>
            </div>
            <div className="na-card-body">
              <div className="na-form-grid">

                <div className="na-field">
                  <label className="na-label">Date <span>*</span></label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="na-input"
                  />
                </div>

                <div className="na-field">
                  <label className="na-label">Time <span>*</span></label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="na-input"
                  />
                </div>

                <div className="na-field na-form-grid--full">
                  <label className="na-label">Service <span>*</span></label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="na-select"
                  >
                    <option value="">Select a service…</option>
                    <option value="consultation">Consultation</option>
                    <option value="fitting">Fitting</option>
                    <option value="custom-design">Custom Design</option>
                    <option value="repair">Repair &amp; Restoration</option>
                  </select>
                </div>

                <div className="na-field na-form-grid--full">
                  <label className="na-label">Internal Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className="na-textarea"
                    rows={4}
                    placeholder="Customer preferences, previous visits, special requirements…"
                  />
                </div>

              </div>

              <div className="na-form-actions">
                <Link href="/admin/appointments" className="na-btn-ghost">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="na-btn-primary"
                >
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
