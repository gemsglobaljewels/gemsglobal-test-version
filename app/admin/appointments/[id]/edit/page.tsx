'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle, Calendar, User, Video, Store, Link2, Lock } from 'lucide-react'
import { useParams } from 'next/navigation'

// Human-friendly labels for the known service slugs; admin-defined slugs fall
// back to a Title-Cased version so nothing ever shows a raw "custom-design".
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

export default function EditAppointmentPage() {
  const params = useParams()
  const appointmentId = params.id as string

  const [appointment, setAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // Only status + meeting link + internal notes are editable. Booking details
  // (date / time / service / mode) are set by the customer and shown read-only.
  const [formData, setFormData] = useState({
    status: 'pending',
    meetingLink: '',
    notes: '',
  })

  useEffect(() => { fetchAppointment() }, [appointmentId])

  async function fetchAppointment() {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data)
        setFormData({
          status: data.status || 'pending',
          meetingLink: data.meetingLink || '',
          notes: data.notes || '',
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

  const isOnline = appointment?.appointmentType === 'online'
  // When an online appointment is being confirmed, a meeting link is required —
  // it's what gets emailed to the customer so they can join the video call.
  const needsMeetingLink = isOnline && formData.status === 'confirmed'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')

    if (needsMeetingLink && !formData.meetingLink.trim()) {
      setError('Please add a meeting link before confirming an online appointment — it is sent to the customer.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          meetingLink: formData.meetingLink,
          notes: formData.notes,
        }),
      })
      if (response.ok) {
        setSuccess('Appointment updated successfully')
        setTimeout(() => window.history.back(), 1400)
      } else {
        const d = await response.json().catch(() => ({}))
        setError(d?.error || 'Failed to update appointment')
      }
    } catch {
      setError('Error updating appointment')
    } finally {
      setSaving(false)
    }
  }

  const status = appointment?.status
  const isCompleted = status === 'completed'

  return (
    <div className="a-page">

      <Link href="/admin/appointments" className="a-back">
        <ArrowLeft size={14} />
        Back to Appointments
      </Link>

      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</span>
            <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}
      {success && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-success)', background: 'var(--c-success-bg)' }}>
          <div className="a-card-body a-row" style={{ gap: 12, color: 'var(--c-success)' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{success}</span>
            <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setSuccess('')} aria-label="Dismiss">×</button>
          </div>
        </div>
      )}

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Bookings</div>
          <h1 className="a-title">Edit <em>Appointment</em></h1>
          <p className="a-subtitle">
            {appointment?.customerName ? `${appointment.customerName} · ` : ''}#{appointmentId?.slice(0, 8)}
          </p>
        </div>
        {appointment && (
          <div className="a-head-actions">
            <span className={`a-badge a-badge--${isOnline ? 'info' : 'accent'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {isOnline ? <Video size={13} /> : <Store size={13} />}
              {isOnline ? 'Online Consultation' : 'In-Person Visit'}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="a-loader-row">
          <span className="a-loader" />
          <span className="a-loader-label">Loading appointment</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>

          {/* Customer Info — read only */}
          <div className="a-card" style={{ marginBottom: 20 }}>
            <div className="a-card-head">
              <h2 className="a-card-title"><User size={15} style={{ verticalAlign: '-2px', marginRight: 8, color: 'var(--c-accent)' }} />Customer <em>Information</em></h2>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid a-form-grid--3">
                <ReadField label="Full Name" value={appointment?.customerName} />
                <ReadField label="Email Address" value={appointment?.customerEmail} />
                <ReadField label="Phone Number" value={appointment?.customerPhone} />
              </div>
            </div>
          </div>

          {/* Booking Details — read only (customer-chosen, locked) */}
          <div className="a-card" style={{ marginBottom: 20 }}>
            <div className="a-card-head">
              <h2 className="a-card-title"><Calendar size={15} style={{ verticalAlign: '-2px', marginRight: 8, color: 'var(--c-accent)' }} />Booking <em>Details</em></h2>
              <span className="a-badge a-badge--neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Lock size={11} /> Read only
              </span>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid a-form-grid--3">
                <ReadField label="Mode" value={isOnline ? 'Online Consultation' : 'In-Person Visit'} />
                <ReadField label="Service" value={serviceLabel(appointment?.service)} />
                <ReadField label="Date" value={appointment?.date} />
                <ReadField label="Time" value={appointment?.time} />
                {isOnline
                  ? <ReadField label="Preferred Platform" value={appointment?.preferredPlatform} placeholder="Not specified" />
                  : <ReadField label="Location" value={appointment?.location} placeholder="—" />}
              </div>
              {appointment?.notes && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--c-border)' }}>
                  <span className="a-section-title" style={{ marginBottom: 6 }}>Customer Note</span>
                  <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: 13.5, color: 'var(--c-text)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Manage — editable */}
          <div className="a-card">
            <div className="a-card-head">
              <h2 className="a-card-title"><CheckCircle size={15} style={{ verticalAlign: '-2px', marginRight: 8, color: 'var(--c-accent)' }} />Manage <em>Appointment</em></h2>
            </div>
            <div className="a-card-body">
              <div className="a-form-grid">

                <div className="a-field">
                  <label className="a-label">Status</label>
                  {isCompleted ? (
                    <>
                      <select name="status" value="completed" disabled className="a-select">
                        <option value="completed">Completed</option>
                      </select>
                      <span style={{ fontSize: 11, color: 'var(--c-info)', marginTop: 8, letterSpacing: '0.02em' }}>✦ Completed appointments cannot be changed</span>
                    </>
                  ) : status === 'cancelled' ? (
                    <select name="status" value={formData.status} onChange={handleChange} className="a-select">
                      <option value="cancelled">Cancelled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                    </select>
                  ) : status === 'confirmed' ? (
                    <select name="status" value={formData.status} onChange={handleChange} className="a-select">
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <select name="status" value={formData.status} onChange={handleChange} className="a-select">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8, letterSpacing: '0.02em' }}>
                    Changing status emails the customer automatically.
                  </span>
                </div>

                {/* Meeting link — only meaningful for online consultations */}
                {isOnline && (
                  <div className="a-field">
                    <label className="a-label">
                      Meeting Link {needsMeetingLink && <span className="a-req">*</span>}
                    </label>
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
                    <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 8, letterSpacing: '0.02em' }}>
                      Sent to the customer in the confirmation email so they can join the call.
                    </span>
                  </div>
                )}

                <div className="a-field a-col-span-2">
                  <label className="a-label">Internal Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange}
                    className="a-textarea" rows={4}
                    placeholder="Private notes for your team about this appointment…" />
                </div>

              </div>
            </div>
            <div className="a-card-foot">
              <Link href="/admin/appointments" className="a-btn a-btn--ghost">Cancel</Link>
              <button type="submit" disabled={saving || isCompleted} className="a-btn a-btn--primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

        </form>
      )}

    </div>
  )
}

// Small read-only field used across the locked sections.
function ReadField({ label, value, placeholder = 'Not on record' }: { label: string; value?: string; placeholder?: string }) {
  const has = value != null && String(value).trim() !== ''
  return (
    <div className="a-field">
      <span className="a-section-title" style={{ marginBottom: 6 }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-dmsans)', fontSize: 14,
        color: has ? 'var(--c-text)' : 'var(--c-text-faint)',
        fontStyle: has ? 'normal' : 'italic',
      }}>
        {has ? value : placeholder}
      </span>
    </div>
  )
}
