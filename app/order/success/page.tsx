'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'
import { CheckCircle, Package, Truck, Diamond, Mail, ArrowRight, X, Check, RotateCcw } from 'lucide-react'
import { clearCart } from '@/lib/authStore'
import { Price, PriceFrom } from '@/components/Price'

const CSS = `
/* ══ ROOT (light · on-brand) ═════════════════════════════════════ */
.os-root {
  min-height: 100vh; background: var(--c-bg, #FAF9F6);
  font-family: var(--font-main); color: var(--c-text, #2C231E);
  display: flex; flex-direction: column;
}

/* ══ LOADING ═════════════════════════════════════════════════════ */
.os-loading {
  flex: 1; display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 16px; padding: 120px 20px;
}
.os-loading-gem { color: var(--c-accent, #8F7A70); opacity: .5; animation: osSpin 2.4s linear infinite; }
@keyframes osSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.os-loading-txt {
  font-size: 9px; font-weight: 400; letter-spacing: .4em; text-transform: uppercase;
  color: var(--c-accent, #8F7A70); opacity: .6;
}

/* ══ MAIN ════════════════════════════════════════════════════════ */
.os-main {
  flex: 1; display: flex; align-items: flex-start; justify-content: center;
  padding: 64px 20px 96px;
}
.os-wrap { width: 100%; max-width: 680px; }

/* ══ ALERT ═══════════════════════════════════════════════════════ */
.os-alert {
  border: 1px solid rgba(185,64,64,.28); background: rgba(185,64,64,.05);
  padding: 16px 18px; margin-bottom: 22px;
}
.os-alert-label {
  font-size: 9px; letter-spacing: .24em; text-transform: uppercase;
  color: #B94040; margin-bottom: 6px; font-weight: 600;
}
.os-alert-msg { font-size: 12.5px; font-weight: 400; letter-spacing: .01em; line-height: 1.65; color: #6B5D54; }

/* ══ HERO ════════════════════════════════════════════════════════ */
.os-hero { text-align: center; margin-bottom: 44px; position: relative; }

.os-emblem {
  width: 76px; height: 76px; margin: 0 auto 26px;
  border-radius: 50%;
  border: 1px solid rgba(143,122,112,.28);
  background: #FFFFFF;
  box-shadow: 0 6px 26px rgba(44,35,30,.08);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  animation: osPop .55s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes osPop { from { opacity:0; transform: scale(.6); } to { opacity:1; transform: scale(1); } }
.os-emblem::before {
  content: ''; position: absolute; inset: -7px; border-radius: 50%;
  border: 1px solid rgba(143,122,112,.14); pointer-events: none;
}
.os-emblem-ok  { color: var(--c-accent, #8F7A70); }
.os-emblem-err { color: #B94040; }

.os-eyebrow {
  display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 14px;
}
.os-eyebrow-line { width: 22px; height: 1px; background: var(--c-accent, #8F7A70); opacity: .6; }
.os-eyebrow-tag {
  font-size: 8.5px; font-weight: 500; letter-spacing: .42em; text-transform: uppercase;
  color: var(--c-accent, #8F7A70);
}

.os-title {
  font-family: var(--font-playfair, Georgia), serif;
  font-size: 46px; font-weight: 400; letter-spacing: .01em; color: var(--c-text, #2C231E);
  line-height: 1.08; margin-bottom: 14px;
  animation: osFadeUp .5s .15s cubic-bezier(.23,1,.32,1) both;
}
.os-title em { font-style: italic; color: var(--c-accent, #8F7A70); }
.os-title-err { color: #B94040; font-style: italic; }
@keyframes osFadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }

.os-subtitle {
  font-size: 13px; font-weight: 400; letter-spacing: .01em; line-height: 1.8;
  color: #6B5D54; margin: 0 auto 26px; max-width: 460px;
  animation: osFadeUp .5s .25s cubic-bezier(.23,1,.32,1) both;
}

/* order reference chip */
.os-order-block {
  display: inline-flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 15px 32px; background: #FFFFFF;
  border: 1px solid var(--c-border, #E2DAD1);
  box-shadow: 0 2px 12px rgba(44,35,30,.05);
  animation: osFadeUp .5s .35s cubic-bezier(.23,1,.32,1) both;
}
.os-order-label {
  font-size: 8px; font-weight: 500; letter-spacing: .42em; text-transform: uppercase;
  color: var(--c-accent, #8F7A70);
}
.os-order-id {
  font-family: var(--font-playfair, Georgia), serif;
  font-size: 22px; font-weight: 500; letter-spacing: .06em; color: var(--c-text, #2C231E);
}
.os-payment-id {
  font-size: 9.5px; font-weight: 400; letter-spacing: .1em;
  color: #9A8F86; margin-top: 2px;
}
.os-pay-tag {
  font-size: 9.5px; font-weight: 500; letter-spacing: .16em; text-transform: uppercase;
  color: var(--c-accent, #8F7A70); margin-top: 2px;
}

/* ══ CARD ════════════════════════════════════════════════════════ */
.os-card {
  background: #FFFFFF; border: 1px solid var(--c-border, #E2DAD1);
  box-shadow: 0 2px 14px rgba(44,35,30,.05);
  margin-bottom: 18px; position: relative; overflow: hidden;
  animation: osFadeUp .5s .4s cubic-bezier(.23,1,.32,1) both;
}
.os-card-hdr {
  display: flex; align-items: center; gap: 11px;
  padding: 18px 26px 15px; border-bottom: 1px solid var(--c-border, #EDE6DD);
}
.os-card-hdr svg { color: var(--c-accent, #8F7A70); }
.os-card-hdr-title {
  font-family: var(--font-playfair, Georgia), serif;
  font-size: 19px; font-weight: 500; letter-spacing: .02em; color: var(--c-text, #2C231E);
}
.os-card-hdr-title em { font-style: italic; color: var(--c-accent, #8F7A70); }

/* ── items ── */
.os-item {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 0; border-bottom: 1px solid var(--c-border, #F0EAE2);
}
.os-item:last-of-type { border-bottom: none; }
.os-item-img {
  width: 58px; height: 58px; object-fit: cover; flex-shrink: 0;
  background: #FAF7F2; border: 1px solid var(--c-border, #EDE6DD);
}
.os-item-name { font-size: 13.5px; color: var(--c-text, #2C231E); font-weight: 500; }
.os-item-meta { font-size: 11.5px; color: var(--c-accent, #8F7A70); margin-top: 4px; letter-spacing: .02em; }
.os-item-total { font-size: 14px; color: var(--c-text, #2C231E); font-weight: 600; font-family: var(--font-playfair, Georgia), serif; }

.os-total-row {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--c-border, #E2DAD1);
}
.os-total-label { font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: #9A8F86; font-weight: 500; }
.os-total-val { font-size: 24px; font-family: var(--font-playfair, Georgia), serif; color: var(--c-text, #2C231E); }

/* ── tracking ── */
.os-track {
  padding: 18px 26px 22px; display: flex; align-items: center; justify-content: space-between;
  gap: 16px; flex-wrap: wrap;
}
.os-track-num {
  font-family: var(--font-playfair, Georgia), serif;
  font-size: 19px; letter-spacing: .08em; color: var(--c-text, #2C231E);
}
.os-track-btn {
  display: inline-flex; align-items: center; gap: 7px; height: 42px; padding: 0 22px;
  background: var(--c-accent, #8F7A70); color: #FFFFFF; text-decoration: none;
  font-family: var(--font-main); font-size: 9px; font-weight: 500;
  letter-spacing: .22em; text-transform: uppercase; transition: all .22s;
}
.os-track-btn:hover { background: #7C6A60; box-shadow: 0 6px 20px rgba(143,122,112,.28); }

/* ── notes ── */
.os-notes {
  padding: 18px 26px 22px; font-size: 13px; line-height: 1.8;
  color: #6B5D54; white-space: pre-line; letter-spacing: .01em;
}

/* ══ TIMELINE ════════════════════════════════════════════════════ */
.os-timeline { padding: 26px 30px; display: flex; flex-direction: column; }

.os-step { display: flex; gap: 20px; }
.os-step-left { display: flex; flex-direction: column; align-items: center; width: 38px; flex-shrink: 0; }

.os-step-node {
  width: 38px; height: 38px; flex-shrink: 0; border-radius: 50%;
  border: 1px solid; display: flex; align-items: center; justify-content: center;
  transition: all .35s;
}
.os-step-node.done    { border-color: var(--c-accent, #8F7A70); background: rgba(143,122,112,.10); }
.os-step-node.pending { border-color: var(--c-border, #E2DAD1); background: #FBF9F6; }
.os-step-node.done    svg { color: var(--c-accent, #8F7A70); }
.os-step-node.pending svg { color: #C7BCB1; }

.os-step-line {
  width: 1px; flex: 1; min-height: 30px; margin: 5px 0;
  background: var(--c-accent, #8F7A70); opacity: .35;
}
.os-step-line.dim { background: var(--c-border, #E2DAD1); opacity: 1; }

.os-step-body { padding-bottom: 26px; padding-top: 8px; flex: 1; }
.os-step:last-child .os-step-body { padding-bottom: 4px; }

.os-step-title {
  font-size: 11px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
  margin-bottom: 5px; transition: color .3s;
}
.os-step-title.done    { color: var(--c-text, #2C231E); }
.os-step-title.pending { color: #B7ADA3; }

.os-step-desc {
  font-size: 12px; font-weight: 400; letter-spacing: .01em; line-height: 1.75;
  color: #7A6E64;
}

/* ══ CTA BUTTONS ═════════════════════════════════════════════════ */
.os-ctas {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  margin: 6px 0 26px;
  animation: osFadeUp .5s .5s cubic-bezier(.23,1,.32,1) both;
}
@media (max-width: 480px) { .os-ctas { grid-template-columns: 1fr; } }

.os-btn-ghost {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 50px; padding: 0 22px;
  background: #FFFFFF; border: 1px solid var(--c-accent, #8F7A70); cursor: pointer;
  font-family: var(--font-main); font-size: 9.5px; font-weight: 500;
  letter-spacing: .24em; text-transform: uppercase; color: var(--c-accent, #8F7A70);
  text-decoration: none; transition: all .22s;
}
.os-btn-ghost:hover { background: rgba(143,122,112,.06); color: #6E5C52; }

.os-btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  height: 50px; padding: 0 22px;
  background: var(--c-accent, #8F7A70); border: 1px solid var(--c-accent, #8F7A70); cursor: pointer;
  font-family: var(--font-main); font-size: 9.5px; font-weight: 500;
  letter-spacing: .24em; text-transform: uppercase; color: #FFFFFF;
  text-decoration: none; transition: all .22s;
}
.os-btn-primary:hover { background: #7C6A60; box-shadow: 0 6px 20px rgba(143,122,112,.28); }

/* ══ SUPPORT ═════════════════════════════════════════════════════ */
.os-support {
  padding: 18px 22px; background: #FFFFFF;
  border: 1px solid var(--c-border, #E2DAD1);
  display: flex; align-items: center; gap: 15px;
  animation: osFadeUp .5s .55s cubic-bezier(.23,1,.32,1) both;
}
.os-support-ico {
  width: 40px; height: 40px; flex-shrink: 0;
  border: 1px solid var(--c-border, #E2DAD1); background: #FAF7F2;
  display: flex; align-items: center; justify-content: center;
}
.os-support-ico svg { color: var(--c-accent, #8F7A70); }
.os-support-txt { flex: 1; }
.os-support-label {
  font-size: 9px; font-weight: 500; letter-spacing: .3em; text-transform: uppercase;
  color: #9A8F86; margin-bottom: 4px;
}
.os-support-link {
  font-size: 12.5px; font-weight: 400; letter-spacing: .02em;
  color: var(--c-accent, #8F7A70); text-decoration: none; transition: color .2s;
}
.os-support-link:hover { color: #6E5C52; }
`

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [orderLoadError, setOrderLoadError] = useState<string | null>(null)

  const viewMode = searchParams.get('view') === 'account'

  useEffect(() => {
    const qOrder = searchParams.get('order_id')
    const qPayment = searchParams.get('payment_id')
    const qStripePi = searchParams.get('payment_intent')
    const qStripeSession = searchParams.get('session_id')

    // Check if this is likely a Stripe payment
    const isStripe = !!qStripePi || !!qStripeSession || (qPayment && qPayment.startsWith('pi_'))
    const qStripePiCompat = qStripePi || (isStripe ? qPayment : null)

    if (qOrder) setOrderId(qOrder)
    if (qPayment) setPaymentId(qPayment)
    if (qStripePi) setPaymentId(qStripePi)
    if (qStripeSession) setPaymentId(qStripeSession)

    const handleVerification = async () => {
      if (qOrder) {
        // Clear cart only if we're NOT just viewing from account
        if (!viewMode) clearCart()

        // ONLY verify with Stripe API if it's actually a Stripe payment and NOT just viewing.
        if (isStripe && !viewMode) {
          try {
            setVerifyError(null)
            const vr = await fetch('/api/checkout/stripe-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: qStripePiCompat,
                session_id: qStripeSession,
                orderId: qOrder
              })
            })
            if (!vr.ok) {
              const d = await vr.json().catch(() => ({} as any))
              setVerifyError(d?.error || 'Stripe payment verification failed. Please contact support with your Order Reference.')
            }
          } catch (e) {
            console.error('Stripe verification failed on success page:', e)
            setVerifyError('Stripe verification failed due to a network/server error. Please refresh once, or contact support.')
          }
        }

        try {
          setOrderLoadError(null)
          const r = await fetch(`/api/orders/${qOrder}`)
          const data = await r.json().catch(() => ({} as any))
          if (!r.ok || data?.error) {
            setOrder(null)
            setOrderLoadError(data?.error || 'Failed to load your order details. Please refresh once.')
          } else {
            setOrder(data)
            if (!qStripePiCompat) {
              const pid = data?.paymentId || data?.payment_id
              if (pid) setPaymentId(String(pid))
            }
          }
        } catch {
          setOrder(null)
          setOrderLoadError('Failed to load your order details due to a network error. Please refresh once.')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    handleVerification()
  }, [searchParams])

  if (loading || !orderId) return (
    <div className="os-loading">
      <Diamond size={28} strokeWidth={1.2} className="os-loading-gem" />
      <p className="os-loading-txt">Loading your order…</p>
    </div>
  )

  const status = order?.status || 'pending'
  const isCancelled = ['cancelled', 'failed', 'payment_failed'].includes(status.toLowerCase())

  // 'confirmed' = payment done, order confirmed (step 1 only)
  // Admin changes status: confirmed → processing → shipped → delivered → completed
  // return_requested / returned / refunded only occur after delivery, so the journey is complete
  const s = status.toLowerCase()
  const isConfirmed = ['confirmed', 'completed', 'processing', 'shipped', 'delivered', 'return_requested', 'returned', 'refunded'].includes(s)
  const isProcessing = ['processing', 'shipped', 'delivered', 'return_requested', 'returned', 'refunded'].includes(s)
  const isShipped = ['shipped', 'delivered', 'return_requested', 'returned', 'refunded'].includes(s)
  const isDelivered = ['delivered', 'return_requested', 'returned', 'refunded'].includes(s)
  const isReturnState = ['return_requested', 'returned', 'refunded'].includes(s)

  const stepState = (done: boolean) =>
    done ? 'done' : 'pending'

  const steps = [
    {
      icon: <Check size={16} strokeWidth={1.8} />,
      title: 'Thank You',
      desc: 'Your order has been received and a confirmation has been sent to your email.',
      state: stepState(isConfirmed),
      last: false,
      lineActive: isProcessing,
    },
    {
      icon: <Package size={15} strokeWidth={1.6} />,
      title: 'Processing',
      desc: 'Your jewellery is being carefully prepared and inspected. This typically takes 1–2 business days.',
      state: stepState(isProcessing),
      last: false,
      lineActive: isShipped,
    },
    {
      icon: <Truck size={15} strokeWidth={1.6} />,
      title: 'Shipped',
      desc: 'Your package will be securely dispatched with tracking. You will receive updates via email.',
      state: stepState(isShipped),
      last: false,
      lineActive: isDelivered,
    },
    {
      icon: <CheckCircle size={15} strokeWidth={1.6} />,
      title: 'Delivered',
      desc: 'Your package has been delivered. Enjoy your jewellery!',
      state: stepState(isDelivered),
      last: true,
      lineActive: false,
    },
  ]

  return (
    <div className="os-main">
      <div className="os-wrap">

        {(verifyError || orderLoadError) && (
          <div className="os-alert">
            <div className="os-alert-label">Payment / Order Issue</div>
            <div className="os-alert-msg">{verifyError || orderLoadError}</div>
          </div>
        )}

        {/* Hero */}
        <div className="os-hero" style={viewMode ? { marginBottom: 36 } : {}}>
          {!viewMode && (
            <div className="os-emblem">
              {isCancelled
                ? <X size={30} strokeWidth={1.5} className="os-emblem-err" />
                : <Check size={32} strokeWidth={1.5} className="os-emblem-ok" />
              }
            </div>
          )}
          <div className="os-eyebrow">
            <div className="os-eyebrow-line" />
            <span className="os-eyebrow-tag">
              {viewMode ? 'Order Details' : isCancelled ? 'Order Cancelled' : 'Thank You'}
            </span>
            <div className="os-eyebrow-line" />
          </div>
          <h1 className="os-title">
            {viewMode
              ? <>Order <em>Details</em></>
              : isCancelled
                ? <><em className="os-title-err">Cancelled</em></>
                : <>Thank <em>You</em></>
            }
          </h1>
          {!viewMode && (
            <p className="os-subtitle">
              {isCancelled
                ? 'Your order has been cancelled. If you have any questions, please contact our support team.'
                : 'Your order has been received and will be processed shortly. We will keep you updated at every step.'
              }
            </p>
          )}
          <div className="os-order-block">
            <span className="os-order-label">Order Reference</span>
            <span className="os-order-id">#{orderId}</span>
            {paymentId
              ? <span className="os-payment-id">Payment: {paymentId}</span>
              : order?.payment_method === 'cod'
                ? <span className="os-pay-tag">Cash on Delivery</span>
                : order?.payment_method === 'stripe'
                  ? <span className="os-pay-tag">Paid via Stripe</span>
                  : <span className="os-pay-tag">Paid via Razorpay</span>
            }
          </div>
        </div>

        {/* Order Items */}
        <div className="os-card">
          <div className="os-card-hdr">
            <Package size={16} strokeWidth={1.6} />
            <h2 className="os-card-hdr-title">Items in <em>Order</em></h2>
          </div>
          <div style={{ padding: '18px 26px 22px' }}>
            {(order?.items || []).map((item: any) => (
              <div key={item.id} className="os-item">
                <img src={item.image || "/placeholder.jpg"} alt="" className="os-item-img" />
                <div style={{ flex: 1 }}>
                  <div className="os-item-name">{item.productName}</div>
                  <div className="os-item-meta">
                    {item.quantity} × <PriceFrom value={item.price} from={(order?.currency || 'INR')} />
                  </div>
                </div>
                <div className="os-item-total">
                  <PriceFrom value={item.price * item.quantity} from={(order?.currency || 'INR')} />
                </div>
              </div>
            ))}
            <div className="os-total-row">
              <span className="os-total-label">Order Total</span>
              <span className="os-total-val">
                <PriceFrom value={order?.total || 0} from={(order?.currency || 'INR')} />
              </span>
            </div>
          </div>
        </div>

        {/* Tracking number */}
        {order?.trackingNumber && (
          <div className="os-card">
            <div className="os-card-hdr">
              <Truck size={16} strokeWidth={1.6} />
              <h2 className="os-card-hdr-title">Tracking <em>Number</em></h2>
            </div>
            <div className="os-track">
              <span className="os-track-num">{order.trackingNumber}</span>
              <a
                href={`https://www.delhivery.com/track/package/${order.trackingNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="os-track-btn"
              >
                Track Package <ArrowRight size={12} strokeWidth={1.6} />
              </a>
            </div>
          </div>
        )}

        {/* Order notes */}
        {order?.notes && String(order.notes).trim() && (
          <div className="os-card">
            <div className="os-card-hdr">
              <Mail size={16} strokeWidth={1.6} />
              <h2 className="os-card-hdr-title">Order <em>Notes</em></h2>
            </div>
            <div className="os-notes">{order.notes}</div>
          </div>
        )}

        {/* Return / refund status */}
        {isReturnState && (
          <div className="os-card">
            <div className="os-card-hdr">
              <RotateCcw size={16} strokeWidth={1.6} />
              <h2 className="os-card-hdr-title">Return <em>Status</em></h2>
            </div>
            <div className="os-notes">
              {s === 'return_requested'
                ? 'Your return request has been received. Our team will contact you shortly.'
                : s === 'returned'
                  ? 'Your return has been received.'
                  : 'A refund has been processed for this order.'
              }
              {order?.returnReason && String(order.returnReason).trim() && (
                <div style={{ fontSize: 12, color: '#9A8F86', marginTop: 6 }}>
                  Reason: {order.returnReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status timeline */}
        {!isCancelled && (
          <div className="os-card">
            <div className="os-card-hdr">
              <Truck size={16} strokeWidth={1.6} />
              <h2 className="os-card-hdr-title">Order <em>Journey</em></h2>
            </div>
            <div className="os-timeline">
              {steps.map((step, idx) => (
                <div key={idx} className="os-step">
                  <div className="os-step-left">
                    <div className={`os-step-node ${step.state}`}>
                      {step.icon}
                    </div>
                    {!step.last && (
                      <div className={`os-step-line${step.lineActive ? '' : ' dim'}`} />
                    )}
                  </div>
                  <div className="os-step-body">
                    <div className={`os-step-title ${step.state}`}>{step.title}</div>
                    <div className="os-step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="os-ctas">
          <Link href="/account" className="os-btn-ghost">View My Account</Link>
          <Link href="/collection" className="os-btn-primary">
            Continue Shopping <ArrowRight size={12} strokeWidth={1.6} />
          </Link>
        </div>

        {/* Support */}
        <div className="os-support">
          <div className="os-support-ico">
            <Mail size={15} strokeWidth={1.6} />
          </div>
          <div className="os-support-txt">
            <div className="os-support-label">Need Help?</div>
            <a href={`mailto:${order?.contact_email || 'support@gemglobal.com'}`} className="os-support-link">{order?.contact_email || 'support@gemglobal.com'}</a>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <div className="os-root">
      <style>{CSS}</style>
      <HeaderMegaMenu />
      <Suspense fallback={
        <div className="os-loading">
          <Diamond size={28} strokeWidth={1.2} className="os-loading-gem" />
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </div>
  )
}
