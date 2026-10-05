'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Calendar, User, Video, Store, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NewAppointmentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    appointmentType: 'visit',
    date: '',
    time: '',
    service: '',
    preferredPlatform: '',
    meetingLink: '',
    notes: '',
  })
  const isOnline = formData.appointmentType === 'online'

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
    <div className="a-page">

      {/* Back */}
      <Link href="/admin/appointments" className="a-back">
        <ArrowLeft size={14} />
        Back to Appointments
      </Link>

      {/* Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Bookings</div>
          <h1 className="a-title">New <em>Appointment</em></h1>
          <p className="a-subtitle">Schedule a consultation, fitting or bespoke session</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/appointments" className="a-btn a-btn--ghost">
            Cancel
          </Link>
          <button
            type="submit"
            form="new-appointment-form"
            disabled={saving}
            className="a-btn a-btn--primary"
          >
            {saving ? 'Creating…' : 'Create Appointment'}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="a-badge a-badge--danger" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            className="a-icon-btn a-icon-btn--sm"
            onClick={() => setError('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {success && (
        <div className="a-badge a-badge--success" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16 }}>
          <CheckCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{success}</span>
          <button
            type="button"
            className="a-icon-btn a-icon-btn--sm"
            onClick={() => setSuccess('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <form id="new-appointment-form" onSubmit={handleSubmit}>

        {/* Customer Details Card */}
        <div className="a-card" style={{ marginBottom: 20 }}>
          <div className="a-card-head">
            <h2 className="a-card-title">
              <User size={15} style={{ color: 'var(--c-accent)', verticalAlign: 'middle', marginRight: 8 }} />
              Customer <em>Details</em>
            </h2>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">

              <div className="a-field">
                <label className="a-label">Customer Name <span className="a-req">*</span></label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="a-input"
                  placeholder="e.g. Priya Mehta"
                />
              </div>

              <div className="a-field">
                <label className="a-label">Phone Number</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="a-input"
                  placeholder="+44 7700 900123"
                />
              </div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Email Address</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="a-input"
                  placeholder="priya@example.com"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="a-card">
          <div className="a-card-head">
            <h2 className="a-card-title">
              <Calendar size={15} style={{ color: 'var(--c-accent)', verticalAlign: 'middle', marginRight: 8 }} />
              Booking <em>Details</em>
            </h2>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">

              <div className="a-field a-col-span-2">
                <label className="a-label">Mode</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, appointmentType: 'visit' }))}
                    className={`a-btn ${!isOnline ? 'a-btn--primary' : 'a-btn--ghost'}`}>
                    <Store size={15} /> In-Person Visit
                  </button>
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, appointmentType: 'online' }))}
                    className={`a-btn ${isOnline ? 'a-btn--primary' : 'a-btn--ghost'}`}>
                    <Video size={15} /> Online Consultation
                  </button>
                </div>
              </div>

              <div className="a-field">
                <label className="a-label">Date <span className="a-req">*</span></label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="a-input"
                />
              </div>

              <div className="a-field">
                <label className="a-label">Time <span className="a-req">*</span></label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="a-input"
                />
              </div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Service <span className="a-req">*</span></label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="a-select"
                >
                  <option value="">Select a service…</option>
                  <option value="consultation">Consultation</option>
                  <option value="fitting">Fitting</option>
                  <option value="custom-design">Custom Design</option>
                  <option value="repair">Repair &amp; Restoration</option>
                </select>
              </div>

              {isOnline && (
                <>
                  <div className="a-field">
                    <label className="a-label">Preferred Platform</label>
                    <input
                      type="text"
                      name="preferredPlatform"
                      value={formData.preferredPlatform}
                      onChange={handleChange}
                      className="a-input"
                      placeholder="e.g. Zoom, Google Meet, FaceTime…"
                    />
                  </div>
                  <div className="a-field">
                    <label className="a-label">Meeting Link</label>
                    <div className="a-input-wrap">
                      <span className="a-input-ico"><Link2 size={15} /></span>
                      <input
                        type="url"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleChange}
                        className="a-input"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="a-field a-col-span-2">
                <label className="a-label">Internal Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="a-textarea"
                  rows={4}
                  placeholder="Customer preferences, previous visits, special requirements…"
                />
              </div>

            </div>
          </div>
          <div className="a-card-foot">
            <Link href="/admin/appointments" className="a-btn a-btn--ghost">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="a-btn a-btn--primary"
            >
              {saving ? 'Creating…' : 'Create Appointment'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
