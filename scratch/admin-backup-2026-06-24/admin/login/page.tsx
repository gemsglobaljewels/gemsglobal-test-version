'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header';
import { Footer } from '@/components/footer'
import { Mail, Lock, AlertCircle, Eye, EyeOff, Diamond } from 'lucide-react'
import { signIn, signOut } from '@/lib/auth'

const CSS = `


/* ══ PAGE ════════════════════════════════════════════════════════ */
.al-root {
  min-height: 100vh;
  background: #080604;
  display: flex; flex-direction: column;
  font-family: var(--font-main);
  position: relative;
}

/* ambient background */
.al-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background:
    radial-gradient(ellipse 700px 500px at 50% 40%, rgba(212,175,55,.035) 0%, transparent 70%),
    radial-gradient(ellipse 400px 300px at 20% 80%, rgba(212,175,55,.02) 0%, transparent 60%);
}

/* grid pattern */
.al-bg::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(212,175,55,.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212,175,55,.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}

/* ══ MAIN ════════════════════════════════════════════════════════ */
.al-main {
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 48px 20px;
  position: relative; z-index: 1;
}

/* ══ CARD ════════════════════════════════════════════════════════ */
.al-card {
  width: 100%; max-width: 420px;
  background: rgba(10,8,5,.92);
  border: 1px solid rgba(212,175,55,.13);
  box-shadow:
    0 32px 80px rgba(0,0,0,.65),
    0 0 0 .5px rgba(212,175,55,.06) inset;
  position: relative; overflow: hidden;
  animation: alCardIn .55s cubic-bezier(.23,1,.32,1) both;
}
@keyframes alCardIn {
  from { opacity: 0; transform: translateY(24px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* top gold line */
.al-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, #D4AF37 50%, transparent);
  opacity: .4;
}
/* ambient glow */
.al-card::after {
  content: '';
  position: absolute; top: -80px; left: 50%; transform: translateX(-50%);
  width: 300px; height: 200px;
  background: radial-gradient(ellipse, rgba(212,175,55,.05) 0%, transparent 70%);
  pointer-events: none;
}

/* corner ornaments */
.al-corner {
  position: absolute; width: 28px; height: 28px;
  border-color: rgba(212,175,55,.2); border-style: solid;
  pointer-events: none; z-index: 2;
}
.al-corner-tl { top: 14px; left: 14px; border-width: 1px 0 0 1px; }
.al-corner-tr { top: 14px; right: 14px; border-width: 1px 1px 0 0; }
.al-corner-bl { bottom: 14px; left: 14px; border-width: 0 0 1px 1px; }
.al-corner-br { bottom: 14px; right: 14px; border-width: 0 1px 1px 0; }

/* ══ CARD HEADER ═════════════════════════════════════════════════ */
.al-header {
  padding: 40px 40px 28px;
  text-align: center;
  border-bottom: 1px solid rgba(212,175,55,.07);
  position: relative; z-index: 1;
}
.al-gem-wrap {
  width: 48px; height: 48px; margin: 0 auto 20px;
  border: 1px solid rgba(212,175,55,.2);
  background: rgba(212,175,55,.06);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.al-gem-wrap::before {
  content: '';
  position: absolute; inset: -4px;
  border: 1px solid rgba(212,175,55,.08);
  pointer-events: none;
}
.al-gem { color: #D4AF37; filter: drop-shadow(0 0 8px rgba(212,175,55,.4)); }

.al-eyebrow {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 10px;
}
.al-eyebrow-line { width: 20px; height: .5px; background: rgba(212,175,55,.3); }
.al-eyebrow-txt {
  font-size: 7.5px; font-weight: 400; letter-spacing: .46em; text-transform: uppercase;
  color: rgba(212,175,55,.55);
}

.al-title {
  font-family: var(--font-heading);
  font-size: 30px; font-weight: 300; letter-spacing: .05em;
  color: #F5F0E8; line-height: 1.1; margin-bottom: 6px;
}
.al-title em { font-style: italic; font-weight: 400; color: #D4AF37; }

.al-sub {
  font-size: 10px; font-weight: 300; letter-spacing: .14em;
  color: rgba(245,240,232,.28);
}

/* ══ FORM BODY ═══════════════════════════════════════════════════ */
.al-body {
  padding: 32px 40px 36px;
  position: relative; z-index: 1;
}

/* error */
.al-error {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px; margin-bottom: 22px;
  background: rgba(180,50,40,.08);
  border: 1px solid rgba(180,50,40,.2);
}
.al-error-icon { color: rgba(220,80,70,.7); flex-shrink: 0; margin-top: 1px; }
.al-error-txt {
  font-size: 11px; font-weight: 300; letter-spacing: .04em; line-height: 1.5;
  color: rgba(220,100,90,.8);
}

/* form group */
.al-group { margin-bottom: 18px; }
.al-group:last-of-type { margin-bottom: 24px; }

.al-label-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.al-label {
  font-size: 8px; font-weight: 400; letter-spacing: .36em; text-transform: uppercase;
  color: rgba(212,175,55,.55);
}
.al-forgot {
  font-size: 9px; font-weight: 300; letter-spacing: .1em;
  color: rgba(245,240,232,.28); text-decoration: none;
  border-bottom: 1px solid rgba(245,240,232,.1);
  transition: color .2s, border-color .2s;
}
.al-forgot:hover { color: #D4AF37; border-color: rgba(212,175,55,.35); }

/* input wrapper */
.al-input-wrap {
  position: relative;
  border: 1px solid rgba(212,175,55,.14);
  background: rgba(245,240,232,.03);
  transition: border-color .25s, background .25s;
}
.al-input-wrap:focus-within {
  border-color: rgba(212,175,55,.45);
  background: rgba(245,240,232,.04);
}
.al-input-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: rgba(245,240,232,.22); pointer-events: none;
  transition: color .25s;
}
.al-input-wrap:focus-within .al-input-icon { color: rgba(212,175,55,.5); }

.al-input {
  width: 100%; height: 48px;
  padding: 0 44px;
  background: transparent; border: none; outline: none;
  font-family: var(--font-main); font-size: 12px; font-weight: 300;
  letter-spacing: .07em; color: #F5F0E8;
}
.al-input::placeholder { color: rgba(245,240,232,.2); letter-spacing: .07em; }
.al-input[type='password'] { letter-spacing: .15em; }
.al-input[type='password']::placeholder { letter-spacing: .07em; }

.al-eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: transparent; border: none; cursor: pointer;
  color: rgba(245,240,232,.2); padding: 4px;
  transition: color .22s;
}
.al-eye-btn:hover { color: rgba(245,240,232,.55); }

/* submit */
.al-submit {
  width: 100%; height: 50px;
  background: #D4AF37; border: none; cursor: pointer;
  font-family: var(--font-main); font-size: 9.5px; font-weight: 500;
  letter-spacing: .34em; text-transform: uppercase;
  color: #080604;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  position: relative; overflow: hidden;
  transition: background .25s, box-shadow .25s, transform .2s cubic-bezier(.34,1.56,.64,1), opacity .2s;
  margin-bottom: 18px;
}
.al-submit::before {
  content: '';
  position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  transition: left .55s;
}
.al-submit:hover { background: #E8D48B; box-shadow: 0 8px 28px rgba(212,175,55,.3); }
.al-submit:hover::before { left: 100%; }
.al-submit:active { transform: scale(.98); }
.al-submit:disabled { opacity: .5; pointer-events: none; }

/* loading dots */
.al-dots { display: flex; gap: 4px; align-items: center; }
.al-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #080604; opacity: .6;
  animation: alDot 1.1s ease-in-out infinite;
}
.al-dot:nth-child(2) { animation-delay: .18s; }
.al-dot:nth-child(3) { animation-delay: .36s; }
@keyframes alDot {
  0%, 80%, 100% { transform: scale(.7); opacity: .4; }
  40%           { transform: scale(1);  opacity: 1; }
}

/* back link */
.al-back {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 9px; font-weight: 300; letter-spacing: .2em; text-transform: uppercase;
  color: rgba(245,240,232,.2); text-decoration: none;
  transition: color .2s;
}
.al-back:hover { color: rgba(245,240,232,.45); }
.al-back-line { width: 16px; height: .5px; background: currentColor; }
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
    <div className="al-root">
      <style>{CSS}</style>
      <div className="al-bg" />
      <Header />

      <main className="al-main">
        <div className="al-card">
          {/* corner ornaments */}
          <div className="al-corner al-corner-tl" />
          <div className="al-corner al-corner-tr" />
          <div className="al-corner al-corner-bl" />
          <div className="al-corner al-corner-br" />

          {/* header */}
          <div className="al-header">
            <div className="al-gem-wrap">
              <Diamond size={20} strokeWidth={1.2} className="al-gem" />
            </div>
            <div className="al-eyebrow">
              <div className="al-eyebrow-line" />
              <span className="al-eyebrow-txt">Restricted Access</span>
              <div className="al-eyebrow-line" />
            </div>
            <h1 className="al-title">Admin <em>Sign In</em></h1>
            <p className="al-sub">Authorised personnel only</p>
          </div>

          {/* form */}
          <div className="al-body">
            {error && (
              <div className="al-error">
                <AlertCircle size={15} strokeWidth={1.5} className="al-error-icon" />
                <p className="al-error-txt">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* email */}
              <div className="al-group">
                <div className="al-label-row">
                  <label className="al-label">Email Address</label>
                </div>
                <div className="al-input-wrap">
                  <Mail size={15} strokeWidth={1.5} className="al-input-icon" />
                  <input
                    type="email" name="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="admin@yourstore.com"
                    className="al-input" autoComplete="email" required
                  />
                </div>
              </div>

              {/* password */}
              <div className="al-group">
                <div className="al-label-row">
                  <label className="al-label">Password</label>
                  <Link href="/auth/forgot-password" className="al-forgot">Forgot password?</Link>
                </div>
                <div className="al-input-wrap">
                  <Lock size={15} strokeWidth={1.5} className="al-input-icon" />
                  <input
                    type={showPw ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="al-input" autoComplete="current-password" required
                  />
                  <button type="button" className="al-eye-btn" onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw
                      ? <EyeOff size={15} strokeWidth={1.5} />
                      : <Eye size={15} strokeWidth={1.5} />
                    }
                  </button>
                </div>
              </div>

              <button type="submit" className="al-submit" disabled={loading}>
                {loading
                  ? <div className="al-dots"><div className="al-dot"/><div className="al-dot"/><div className="al-dot"/></div>
                  : 'Sign In to Dashboard'
                }
              </button>
            </form>

            <Link href="/" className="al-back">
              <div className="al-back-line" />
              Return to Store
              <div className="al-back-line" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
