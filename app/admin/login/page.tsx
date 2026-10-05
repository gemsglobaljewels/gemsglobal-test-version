'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Diamond, ArrowLeft, ShieldCheck } from 'lucide-react'
import { signIn, signOut } from '@/lib/auth'

const CSS = `
.lg-root{
  min-height:100vh; width:100%;
  display:grid; grid-template-columns:1.05fr .95fr;
  background:var(--c-bg); color:var(--c-text); font-family:var(--font-dmsans);
}
@media (max-width:900px){ .lg-root{ grid-template-columns:1fr; } }

/* ── brand panel ── */
.lg-aside{
  position:relative; overflow:hidden;
  background:linear-gradient(150deg,#2C231E 0%,#3a2f28 48%,#5a4b42 100%);
  color:#fff; padding:56px 56px 48px;
  display:flex; flex-direction:column; justify-content:space-between;
}
@media (max-width:900px){ .lg-aside{ display:none; } }
.lg-aside::before{
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(ellipse 600px 420px at 78% 18%, rgba(143,122,112,.36) 0%, transparent 65%),
    radial-gradient(ellipse 480px 360px at 12% 92%, rgba(143,122,112,.20) 0%, transparent 60%);
}
.lg-aside::after{
  content:''; position:absolute; inset:0; opacity:.5; pointer-events:none;
  background-image:
    linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
  background-size:56px 56px;
  mask-image:radial-gradient(ellipse 75% 75% at 50% 40%, black 20%, transparent 100%);
}
.lg-brand{ position:relative; z-index:1; display:flex; align-items:center; gap:13px; }
.lg-brand-mark{
  width:46px; height:46px; border-radius:13px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.16);
}
.lg-brand-name{ font-family:var(--font-main); font-size:19px; letter-spacing:.24em; text-transform:uppercase; }
.lg-brand-name em{ font-style:italic; color:#D8C7BC; padding-right:.06em; }
.lg-brand-sub{ font-size:9.5px; letter-spacing:.32em; text-transform:uppercase; color:rgba(255,255,255,.55); margin-top:3px; }

.lg-hero{ position:relative; z-index:1; }
.lg-hero-eyebrow{ display:inline-flex; align-items:center; gap:9px; font-size:10px; font-weight:600; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.6); margin-bottom:20px; }
.lg-hero-eyebrow::before{ content:''; width:22px; height:1px; background:rgba(255,255,255,.4); }
.lg-hero-title{ font-family:var(--font-main); font-weight:300; font-size:clamp(30px,3.4vw,42px); line-height:1.12; letter-spacing:.01em; }
.lg-hero-title em{ font-style:italic; color:#E4D7CD; padding-right:.06em; }
.lg-hero-text{ margin-top:18px; max-width:380px; font-size:13.5px; line-height:1.7; color:rgba(255,255,255,.68); }

.lg-foot{ position:relative; z-index:1; display:flex; align-items:center; gap:9px; font-size:11px; letter-spacing:.04em; color:rgba(255,255,255,.5); }

/* ── form panel ── */
.lg-main{ display:flex; align-items:center; justify-content:center; padding:clamp(28px,5vw,56px) 24px; }
.lg-card{ width:100%; max-width:404px; animation:lgIn .55s cubic-bezier(.22,1,.36,1) both; }
@keyframes lgIn{ from{ opacity:0; transform:translateY(16px); } to{ opacity:1; transform:none; } }

.lg-mobile-brand{ display:none; }
@media (max-width:900px){
  .lg-mobile-brand{ display:flex; align-items:center; justify-content:center; gap:11px; margin-bottom:30px; }
  .lg-mobile-brand .lg-brand-mark{ background:var(--c-accent-soft); border-color:var(--c-border); }
  .lg-mobile-brand .lg-brand-name{ color:var(--c-text); }
  .lg-mobile-brand .lg-brand-name em{ color:var(--c-accent); }
  .lg-mobile-brand .lg-brand-sub{ color:var(--c-text-muted); }
}

.lg-eyebrow{ display:flex; align-items:center; gap:9px; font-size:10px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:var(--c-text-muted); margin-bottom:12px; }
.lg-eyebrow::before{ content:''; width:18px; height:1px; background:var(--c-border-strong); }
.lg-title{ font-family:var(--font-main); font-weight:300; font-size:30px; letter-spacing:.01em; color:var(--c-text); line-height:1.1; }
.lg-title em{ font-style:italic; color:var(--c-accent); padding-right:.06em; }
.lg-sub{ font-size:13px; color:var(--c-text-muted); margin-top:8px; }

.lg-form{ margin-top:30px; }
.lg-error{ display:flex; align-items:flex-start; gap:10px; padding:12px 14px; margin-bottom:20px; border-radius:10px; background:var(--c-danger-bg); border:1px solid color-mix(in srgb, var(--c-danger) 24%, transparent); }
.lg-error svg{ color:var(--c-danger); flex-shrink:0; margin-top:1px; }
.lg-error p{ font-size:12.5px; line-height:1.5; color:var(--c-danger); }

.lg-group{ margin-bottom:17px; }
.lg-label-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.lg-label{ font-size:10.5px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:var(--c-text-muted); }
.lg-forgot{ font-size:11.5px; color:var(--c-text-muted); text-decoration:none; transition:color .18s; }
.lg-forgot:hover{ color:var(--c-accent); }

.lg-input-wrap{ position:relative; border:1px solid var(--c-border); border-radius:10px; background:#fff; transition:border-color .18s, box-shadow .18s; }
.lg-input-wrap:focus-within{ border-color:var(--c-accent); box-shadow:0 0 0 3px var(--c-accent-soft); }
.lg-input-ico{ position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--c-text-faint); pointer-events:none; transition:color .18s; }
.lg-input-wrap:focus-within .lg-input-ico{ color:var(--c-accent); }
.lg-input{ width:100%; height:46px; padding:0 44px; background:transparent; border:none; outline:none; font-family:var(--font-dmsans); font-size:14px; color:var(--c-text); }
.lg-input::placeholder{ color:var(--c-text-faint); }
.lg-eye{ position:absolute; right:11px; top:50%; transform:translateY(-50%); background:transparent; border:none; cursor:pointer; color:var(--c-text-faint); padding:5px; transition:color .18s; }
.lg-eye:hover{ color:var(--c-accent); }

.lg-submit{
  width:100%; height:48px; margin-top:6px; border:none; cursor:pointer; border-radius:10px;
  background:var(--c-accent); color:#fff;
  font-family:var(--font-dmsans); font-size:11.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
  display:flex; align-items:center; justify-content:center; gap:10px;
  transition:background .2s, box-shadow .2s, transform .2s;
}
.lg-submit:hover{ background:var(--c-text); box-shadow:var(--shadow-md); transform:translateY(-1px); }
.lg-submit:active{ transform:scale(.99); }
.lg-submit:disabled{ opacity:.55; pointer-events:none; }
.lg-dots{ display:flex; gap:4px; }
.lg-dots span{ width:5px; height:5px; border-radius:50%; background:#fff; opacity:.7; animation:lgDot 1.1s ease-in-out infinite; }
.lg-dots span:nth-child(2){ animation-delay:.18s; }
.lg-dots span:nth-child(3){ animation-delay:.36s; }
@keyframes lgDot{ 0%,80%,100%{ transform:scale(.7); opacity:.4; } 40%{ transform:scale(1); opacity:1; } }

.lg-back{ display:inline-flex; align-items:center; gap:7px; margin-top:26px; font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--c-text-muted); text-decoration:none; transition:color .18s, gap .18s; }
.lg-back:hover{ color:var(--c-accent); gap:10px; }

@media (prefers-reduced-motion: reduce){ .lg-card,.lg-dots span{ animation:none; } }
`

export default function AdminLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data   = await signIn(formData.email, formData.password)
      const userId = data.user?.id
      if (!userId) throw new Error('Sign in failed')
      const res = await fetch('/api/admin/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) {
        await signOut().catch(() => {})
        throw new Error((await res.json().catch(() => ({})))?.error || 'Not authorized as admin')
      }

      // Set admin flag in localStorage
      try { localStorage.setItem('isAdmin', 'true') } catch { }

      // Wait for the session to be fully persisted before navigating
      const { supabase } = await import('@/lib/supabase')
      for (let i = 0; i < 10; i++) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) break
        await new Promise(r => setTimeout(r, 100))
      }

      router.replace('/admin')
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg-root">
      <style>{CSS}</style>

      {/* Brand panel */}
      <aside className="lg-aside">
        <div className="lg-brand">
          <div className="lg-brand-mark"><Diamond size={20} strokeWidth={1.3} color="#E4D7CD" /></div>
          <div>
            <div className="lg-brand-name">Gems Global <em>Jewels</em></div>
            <div className="lg-brand-sub">Admin Panel</div>
          </div>
        </div>

        <div className="lg-hero">
          <div className="lg-hero-eyebrow">Restricted Access</div>
          <h2 className="lg-hero-title">Your atelier,<br /><em>beautifully</em> managed.</h2>
          <p className="lg-hero-text">
            Manage collections, orders, appointments and your storefront — all from one calm,
            considered workspace.
          </p>
        </div>

        <div className="lg-foot">
          <ShieldCheck size={14} strokeWidth={1.6} /> Secured · Authorised personnel only
        </div>
      </aside>

      {/* Form panel */}
      <main className="lg-main">
        <div className="lg-card">
          <div className="lg-mobile-brand">
            <div className="lg-brand-mark"><Diamond size={20} strokeWidth={1.3} style={{ color: 'var(--c-accent)' }} /></div>
            <div>
              <div className="lg-brand-name">Gems Global <em>Jewels</em></div>
              <div className="lg-brand-sub">Admin Panel</div>
            </div>
          </div>

          <div className="lg-eyebrow">Sign In</div>
          <h1 className="lg-title">Welcome <em>back</em></h1>
          <p className="lg-sub">Enter your credentials to access the dashboard.</p>

          <form className="lg-form" onSubmit={handleSubmit}>
            {error && (
              <div className="lg-error">
                <AlertCircle size={15} strokeWidth={1.5} />
                <p>{error}</p>
              </div>
            )}

            <div className="lg-group">
              <div className="lg-label-row">
                <label className="lg-label">Email Address</label>
              </div>
              <div className="lg-input-wrap">
                <Mail size={15} strokeWidth={1.5} className="lg-input-ico" />
                <input
                  type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  placeholder="admin@yourstore.com"
                  className="lg-input" autoComplete="email" required
                />
              </div>
            </div>

            <div className="lg-group">
              <div className="lg-input-wrap">
                <Lock size={15} strokeWidth={1.5} className="lg-input-ico" />
                <input
                  type={showPw ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange}
                  placeholder="••••••••"
                  className="lg-input" autoComplete="current-password" required
                />
                <button type="button" className="lg-eye" onClick={() => setShowPw(p => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            <button type="submit" className="lg-submit" disabled={loading}>
              {loading
                ? <span className="lg-dots"><span /><span /><span /></span>
                : 'Sign In to Dashboard'}
            </button>
          </form>

          <Link href="/" className="lg-back">
            <ArrowLeft size={14} strokeWidth={1.8} /> Return to Store
          </Link>
        </div>
      </main>
    </div>
  )
}
