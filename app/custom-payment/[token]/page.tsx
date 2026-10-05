'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import {
  Diamond, ShieldCheck, Lock, CheckCircle, XCircle, Clock, AlertCircle,
  Loader2, ArrowRight, User, Mail, Phone, FileText, CreditCard,
} from 'lucide-react'

declare global { interface Window { Razorpay: any } }

type CPRequest = {
  token: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  title: string
  description?: string
  amount: number
  currency: 'INR' | 'USD'
  status: 'pending' | 'paid' | 'failed' | 'archived'
  expired?: boolean
  paidAt?: string | null
  paymentId?: string | null
}

const CSS = `
.cp-root { min-height:100vh; background:var(--c-bg,#FAF9F6); font-family:var(--font-main); color:var(--c-text,#2C231E); display:flex; flex-direction:column; }
.cp-main { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:56px 20px 96px; }
.cp-wrap { width:100%; max-width:560px; }

/* loading */
.cp-loading { flex:1; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:16px; padding:140px 20px; }
.cp-loading-gem { color:var(--c-accent,#8F7A70); opacity:.55; animation:cpSpin 2.4s linear infinite; }
@keyframes cpSpin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
.cp-loading-txt { font-size:9px; letter-spacing:.4em; text-transform:uppercase; color:var(--c-accent,#8F7A70); opacity:.6; }

/* eyebrow / hero */
.cp-hero { text-align:center; margin-bottom:32px; }
.cp-emblem {
  width:72px; height:72px; margin:0 auto 22px; border-radius:50%;
  border:1px solid rgba(143,122,112,.28); background:#fff;
  box-shadow:0 6px 26px rgba(44,35,30,.08); display:flex; align-items:center; justify-content:center;
  animation:cpPop .55s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes cpPop { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
.cp-emblem-ok  { color:var(--c-accent,#8F7A70); }
.cp-emblem-err { color:#B94040; }
.cp-emblem-warn{ color:#9A6C3C; }
.cp-eyebrow { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:14px; }
.cp-eyebrow-line { width:22px; height:1px; background:var(--c-accent,#8F7A70); opacity:.6; }
.cp-eyebrow-tag { font-size:8.5px; font-weight:500; letter-spacing:.42em; text-transform:uppercase; color:var(--c-accent,#8F7A70); }
.cp-title { font-family:var(--font-playfair,Georgia),serif; font-size:38px; font-weight:400; letter-spacing:.01em; line-height:1.1; margin-bottom:12px; }
.cp-title em { font-style:italic; color:var(--c-accent,#8F7A70); }
.cp-title-err em { color:#B94040; }
.cp-subtitle { font-size:13px; line-height:1.8; color:#6B5D54; margin:0 auto; max-width:420px; }

/* card */
.cp-card { background:#fff; border:1px solid var(--c-border,#E2DAD1); box-shadow:0 2px 14px rgba(44,35,30,.05); margin-bottom:18px; overflow:hidden; animation:cpFadeUp .5s .1s cubic-bezier(.23,1,.32,1) both; }
@keyframes cpFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
.cp-card-hdr { display:flex; align-items:center; gap:11px; padding:16px 24px 14px; border-bottom:1px solid var(--c-border,#EDE6DD); }
.cp-card-hdr svg { color:var(--c-accent,#8F7A70); }
.cp-card-hdr-title { font-family:var(--font-playfair,Georgia),serif; font-size:17px; font-weight:500; letter-spacing:.02em; }
.cp-card-hdr-title em { font-style:italic; color:var(--c-accent,#8F7A70); }
.cp-card-body { padding:20px 24px 24px; }

/* order title / desc */
.cp-order-title { font-family:var(--font-playfair,Georgia),serif; font-size:22px; font-weight:500; line-height:1.3; margin-bottom:8px; }
.cp-order-desc { font-size:13px; line-height:1.75; color:#6B5D54; white-space:pre-line; }

/* amount block */
.cp-amount-block { text-align:center; padding:26px 20px; background:rgba(143,122,112,.05); border:1px solid var(--c-border,#EDE6DD); margin-top:18px; }
.cp-amount-label { font-size:9px; letter-spacing:.3em; text-transform:uppercase; color:#9A8F86; margin-bottom:8px; }
.cp-amount-val { font-family:var(--font-playfair,Georgia),serif; font-size:40px; line-height:1; color:var(--c-text,#2C231E); }

/* detail rows */
.cp-rows { display:flex; flex-direction:column; }
.cp-row { display:flex; align-items:center; gap:12px; padding:11px 0; border-bottom:1px solid var(--c-border,#F0EAE2); }
.cp-row:last-child { border-bottom:none; }
.cp-row-ico { width:32px; height:32px; flex-shrink:0; border:1px solid var(--c-border,#EDE6DD); background:#FAF7F2; display:flex; align-items:center; justify-content:center; }
.cp-row-ico svg { color:var(--c-accent,#8F7A70); }
.cp-row-label { font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:#9A8F86; margin-bottom:2px; }
.cp-row-val { font-size:13.5px; color:var(--c-text,#2C231E); word-break:break-word; }

/* pay button */
.cp-pay-btn {
  width:100%; height:56px; display:flex; align-items:center; justify-content:center; gap:10px;
  background:var(--c-accent,#8F7A70); color:#fff; border:none; cursor:pointer;
  font-family:var(--font-main); font-size:12px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
  transition:all .22s;
}
.cp-pay-btn:hover:not(:disabled) { background:#7C6A60; box-shadow:0 10px 26px rgba(143,122,112,.28); transform:translateY(-1px); }
.cp-pay-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; box-shadow:none; }

/* status pill */
.cp-pill { display:inline-flex; align-items:center; gap:7px; padding:6px 16px; border:1px solid; font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
.cp-pill-ok { color:#5E7355; border-color:#5E7355; }
.cp-pill-err { color:#B94040; border-color:#B94040; }
.cp-pill-warn { color:#9A6C3C; border-color:#9A6C3C; }

/* alert */
.cp-alert { border:1px solid rgba(185,64,64,.28); background:rgba(185,64,64,.05); padding:14px 16px; margin-bottom:20px; display:flex; gap:11px; align-items:flex-start; }
.cp-alert svg { color:#B94040; flex-shrink:0; margin-top:1px; }
.cp-alert-msg { font-size:12.5px; line-height:1.6; color:#6B5D54; }

/* trust */
.cp-trust { display:flex; align-items:center; justify-content:center; gap:22px; margin-top:18px; font-size:10.5px; letter-spacing:.05em; color:#9A8F86; flex-wrap:wrap; }
.cp-trust span { display:inline-flex; align-items:center; gap:6px; }

/* paid payment id */
.cp-payid { text-align:center; margin-top:14px; font-size:10.5px; letter-spacing:.04em; color:#9A8F86; }
.cp-payid strong { color:#6B5D54; font-weight:500; }
`

function money(amount: number, currency: 'INR' | 'USD') {
  const symbol = currency === 'INR' ? '₹' : '$'
  return `${symbol}${Number(amount || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  })}`
}

export default function CustomPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [request, setRequest] = useState<CPRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [razorpayReady, setRazorpayReady] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/custom-payments/token/${token}`, { cache: 'no-store' })
      if (res.status === 404) { setNotFound(true); return }
      const data = await res.json()
      if (!res.ok) { setNotFound(true); return }
      setRequest(data)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial load + handle Stripe return (?status=success&session_id=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) setRazorpayReady(true)

    const status = searchParams.get('status')
    const sessionId = searchParams.get('session_id')

    const run = async () => {
      // Stripe redirect back → verify the session, then load fresh state.
      if (status === 'success' && sessionId) {
        setVerifying(true)
        try {
          await fetch(`/api/custom-payments/token/${token}/stripe-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          })
        } catch { /* fall through to fetch */ }
        // Clean the URL so a refresh doesn't re-trigger.
        router.replace(`/custom-payment/${token}`)
        setVerifying(false)
      } else if (status === 'cancelled') {
        setError('Payment was cancelled. You can try again below.')
        router.replace(`/custom-payment/${token}`)
      }
      await fetchRequest()
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // ── Razorpay flow (INR) ──
  const payWithRazorpay = async (init: any) => {
    const RZP = (window as any).Razorpay
    const Ctor = typeof RZP === 'function' ? RZP : RZP?.default
    if (typeof Ctor !== 'function') {
      setError('Payment gateway failed to load. Please refresh and try again.')
      setPaying(false)
      return
    }

    const rz = new Ctor({
      key: init.keyId,
      order_id: init.orderId,
      amount: init.amount,
      currency: init.currency || 'INR',
      name: init.name || 'Secure Payment',
      description: init.title || 'Custom Payment',
      prefill: {
        name: init.name || '',
        email: init.email || '',
        contact: init.phone || '',
      },
      theme: { color: '#8F7A70' },
      handler: async (response: any) => {
        setVerifying(true)
        try {
          const vr = await fetch(`/api/custom-payments/token/${token}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          })
          const vd = await vr.json().catch(() => ({}))
          if (vr.ok && vd.success) {
            await fetchRequest()
          } else {
            setError(vd.error || 'Payment verification failed. If you were charged, please contact us.')
          }
        } catch {
          setError('Payment verification failed due to a network error. Please contact us if charged.')
        } finally {
          setVerifying(false)
          setPaying(false)
        }
      },
      modal: {
        ondismiss: async () => {
          setPaying(false)
          try {
            await fetch(`/api/custom-payments/token/${token}/fail`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: 'Customer dismissed the Razorpay checkout' }),
            })
          } catch { /* ignore */ }
        },
      },
    })
    rz.open()
  }

  const handlePay = async () => {
    if (!request) return
    setError('')
    setPaying(true)
    try {
      const res = await fetch(`/api/custom-payments/token/${token}/init`, { method: 'POST' })
      const init = await res.json()
      if (!res.ok) {
        setError(init.error || 'Could not start payment. Please try again.')
        setPaying(false)
        return
      }

      if (init.gateway === 'stripe') {
        if (init.url) { window.location.href = init.url; return }
        setError('Could not open the payment page. Please try again.')
        setPaying(false)
      } else {
        // Razorpay
        if (!(window as any).Razorpay && !razorpayReady) {
          setError('Payment gateway is still loading. Please try again in a moment.')
          setPaying(false)
          return
        }
        await payWithRazorpay(init)
      }
    } catch {
      setError('Something went wrong starting your payment. Please try again.')
      setPaying(false)
    }
  }

  // ── Render ──
  if (loading || verifying) {
    return (
      <div className="cp-root">
        <style>{CSS}</style>
        <HeaderMegaMenu />
        <div className="cp-loading">
          <Diamond size={28} strokeWidth={1.2} className="cp-loading-gem" />
          <p className="cp-loading-txt">{verifying ? 'Confirming your payment…' : 'Loading payment…'}</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (notFound || !request) {
    return (
      <div className="cp-root">
        <style>{CSS}</style>
        <HeaderMegaMenu />
        <div className="cp-main">
          <div className="cp-wrap">
            <div className="cp-hero">
              <div className="cp-emblem"><XCircle size={30} strokeWidth={1.5} className="cp-emblem-err" /></div>
              <div className="cp-eyebrow"><div className="cp-eyebrow-line" /><span className="cp-eyebrow-tag">Not Found</span><div className="cp-eyebrow-line" /></div>
              <h1 className="cp-title cp-title-err">Link <em>Unavailable</em></h1>
              <p className="cp-subtitle">This payment link is invalid or no longer exists. Please check the link, or contact us for a new one.</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Link href="/" className="cp-pay-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 32px', textDecoration: 'none' }}>
                Return Home <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const isPaid = request.status === 'paid'
  const isArchived = request.status === 'archived'
  const isExpired = !!request.expired && !isPaid
  const canPay = request.status !== 'paid' && !isArchived && !isExpired

  // Terminal / non-payable states
  let stateHero: React.ReactNode = null
  if (isPaid) {
    stateHero = (
      <div className="cp-hero">
        <div className="cp-emblem"><CheckCircle size={32} strokeWidth={1.5} className="cp-emblem-ok" /></div>
        <div className="cp-eyebrow"><div className="cp-eyebrow-line" /><span className="cp-eyebrow-tag">Payment Complete</span><div className="cp-eyebrow-line" /></div>
        <h1 className="cp-title">Thank <em>You</em></h1>
        <p className="cp-subtitle">Your payment of {money(request.amount, request.currency)} has been received and confirmed. A receipt has been sent to your email.</p>
      </div>
    )
  } else if (isArchived) {
    stateHero = (
      <div className="cp-hero">
        <div className="cp-emblem"><AlertCircle size={30} strokeWidth={1.5} className="cp-emblem-warn" /></div>
        <div className="cp-eyebrow"><div className="cp-eyebrow-line" /><span className="cp-eyebrow-tag">Unavailable</span><div className="cp-eyebrow-line" /></div>
        <h1 className="cp-title cp-title-err">Link <em>Closed</em></h1>
        <p className="cp-subtitle">This payment link is no longer active. Please contact us if you still need to complete this payment.</p>
      </div>
    )
  } else if (isExpired) {
    stateHero = (
      <div className="cp-hero">
        <div className="cp-emblem"><Clock size={28} strokeWidth={1.5} className="cp-emblem-warn" /></div>
        <div className="cp-eyebrow"><div className="cp-eyebrow-line" /><span className="cp-eyebrow-tag">Expired</span><div className="cp-eyebrow-line" /></div>
        <h1 className="cp-title cp-title-err">Link <em>Expired</em></h1>
        <p className="cp-subtitle">This payment link has expired. Please contact us to request a new link.</p>
      </div>
    )
  }

  return (
    <div className="cp-root">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayReady(true)}
      />
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <div className="cp-main">
        <div className="cp-wrap">
          {error && (
            <div className="cp-alert">
              <AlertCircle size={16} />
              <div className="cp-alert-msg">{error}</div>
            </div>
          )}

          {stateHero || (
            <div className="cp-hero">
              <div className="cp-emblem"><ShieldCheck size={30} strokeWidth={1.4} className="cp-emblem-ok" /></div>
              <div className="cp-eyebrow"><div className="cp-eyebrow-line" /><span className="cp-eyebrow-tag">Secure Payment</span><div className="cp-eyebrow-line" /></div>
              <h1 className="cp-title">Complete Your <em>Payment</em></h1>
              <p className="cp-subtitle">Please review the details below and pay securely. Your payment is encrypted and processed on our website.</p>
            </div>
          )}

          {/* Order summary */}
          <div className="cp-card">
            <div className="cp-card-hdr">
              <FileText size={16} strokeWidth={1.6} />
              <h2 className="cp-card-hdr-title">Order <em>Summary</em></h2>
              {(isPaid || isExpired || isArchived) && (
                <span style={{ marginLeft: 'auto' }}
                  className={`cp-pill ${isPaid ? 'cp-pill-ok' : 'cp-pill-warn'}`}>
                  {isPaid ? <><CheckCircle size={11} /> Paid</> : isExpired ? <><Clock size={11} /> Expired</> : <>Closed</>}
                </span>
              )}
            </div>
            <div className="cp-card-body">
              <div className="cp-order-title">{request.title}</div>
              {request.description && <div className="cp-order-desc">{request.description}</div>}

              <div className="cp-amount-block">
                <div className="cp-amount-label">{isPaid ? 'Amount Paid' : 'Amount Due'}</div>
                <div className="cp-amount-val">{money(request.amount, request.currency)}</div>
              </div>

              {isPaid && request.paymentId && (
                <div className="cp-payid">Payment ID · <strong>{request.paymentId}</strong></div>
              )}
            </div>
          </div>

          {/* Customer details */}
          <div className="cp-card">
            <div className="cp-card-hdr">
              <User size={16} strokeWidth={1.6} />
              <h2 className="cp-card-hdr-title">Billed <em>To</em></h2>
            </div>
            <div className="cp-card-body" style={{ paddingTop: 6, paddingBottom: 10 }}>
              <div className="cp-rows">
                <div className="cp-row">
                  <div className="cp-row-ico"><User size={14} /></div>
                  <div>
                    <div className="cp-row-label">Name</div>
                    <div className="cp-row-val">{request.customerName}</div>
                  </div>
                </div>
                {request.customerEmail && (
                  <div className="cp-row">
                    <div className="cp-row-ico"><Mail size={14} /></div>
                    <div>
                      <div className="cp-row-label">Email</div>
                      <div className="cp-row-val">{request.customerEmail}</div>
                    </div>
                  </div>
                )}
                {request.customerPhone && (
                  <div className="cp-row">
                    <div className="cp-row-ico"><Phone size={14} /></div>
                    <div>
                      <div className="cp-row-label">Phone</div>
                      <div className="cp-row-val">{request.customerPhone}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pay action */}
          {canPay && (
            <>
              <button className="cp-pay-btn" onClick={handlePay} disabled={paying}>
                {paying
                  ? <><Loader2 className="animate-spin" size={16} /> Processing…</>
                  : <><Lock size={15} /> Pay {money(request.amount, request.currency)} Now</>}
              </button>
              <div className="cp-trust">
                <span><Lock size={11} /> Secure Checkout</span>
                <span><ShieldCheck size={11} /> Encrypted</span>
                <span><CreditCard size={11} /> {request.currency === 'INR' ? 'Card · UPI · Netbanking' : 'Card'}</span>
              </div>
            </>
          )}

          {(isExpired || isArchived) && (
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <Link href="/" className="cp-pay-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 32px', textDecoration: 'none' }}>
                Return Home <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {isPaid && (
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <Link href="/collection" className="cp-pay-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0 32px', textDecoration: 'none' }}>
                Explore Collection <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
