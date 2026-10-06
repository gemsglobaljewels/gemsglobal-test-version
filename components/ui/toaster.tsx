'use client'

import { useToast } from '@/hooks/use-toast'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, X, Sparkles, Check } from 'lucide-react'

const DURATION = 4600
const ANIM_OUT = 460

/* palette / keyframes / responsive rules — mounted once with the stack.
   Slim iOS-style banner: light frosted white surface with the storefront's
   warm gold-taupe accents so it reads as part of "Refined Atelier". */
const CSS = `
.ia-wrap{
  --ink:#3a2e22;--mut:rgba(58,46,34,.58);--bd:#e8e0d4;--cream:#f8f4ee;
  --spring:cubic-bezier(.34,1.56,.64,1);--ease:cubic-bezier(.22,1,.36,1);
  position:fixed;bottom:24px;right:24px;z-index:10000;
  display:flex;flex-direction:column;align-items:flex-end;
  width:auto;max-width:100vw;pointer-events:none;
  font-family:var(--font-dmsans),system-ui,sans-serif;
}
/* phones: full-width, lifted clear of the floating bottom-nav pill */
@media(max-width:560px){
  .ia-wrap{
    left:12px;right:12px;bottom:calc(86px + env(safe-area-inset-bottom,0px));
    align-items:stretch;
  }
}

.ia{
  position:relative;width:366px;max-width:calc(100vw - 24px);pointer-events:auto;
  background:rgba(255,255,255,.86);
  -webkit-backdrop-filter:saturate(180%) blur(14px);backdrop-filter:saturate(180%) blur(14px);
  border:1px solid var(--bd);border-radius:16px;overflow:hidden;
  box-shadow:0 18px 38px -16px rgba(58,46,34,.28),0 4px 12px -8px rgba(58,46,34,.16),
             inset 0 1px 0 rgba(255,255,255,.75);
  transform-origin:right center;will-change:transform,opacity;
  transition:transform .58s var(--spring),opacity .42s var(--ease),
             max-height .46s var(--ease),margin .46s var(--ease);
}
@supports not ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))){
  .ia{background:#fff;}
}
@media(max-width:560px){.ia{width:100%;max-width:100%;transform-origin:center bottom;}}

.ia-in{display:flex;gap:12px;align-items:center;padding:12px 14px;position:relative;z-index:1;}

.ia-ic{
  flex-shrink:0;width:34px;height:34px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;color:var(--acc);
  background:var(--acc-bg);border:1px solid var(--acc-bd);
  animation:iaPop .5s var(--spring) .08s both;
}
@keyframes iaPop{0%{transform:scale(0);opacity:0;}60%{transform:scale(1.16);opacity:1;}100%{transform:scale(1);}}

.ia-tx{flex:1;min-width:0;}
.ia-title{
  font-family:var(--font-dmsans),'DM Sans',system-ui,sans-serif;
  font-size:17px;font-weight:600;color:var(--ink);line-height:1.18;letter-spacing:.005em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.ia-desc{
  margin-top:1px;font-size:12px;color:var(--mut);line-height:1.35;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
@media(max-width:560px){.ia-title{font-size:16px;}.ia-desc{font-size:11.5px;}}

.ia-x{
  flex-shrink:0;width:24px;height:24px;margin:0 -2px 0 2px;border:none;background:transparent;
  border-radius:8px;cursor:pointer;color:var(--mut);display:inline-flex;align-items:center;justify-content:center;
  transition:color .2s ease,background .2s ease,transform .12s ease;-webkit-tap-highlight-color:transparent;
}
.ia-x:hover{color:var(--ink);background:var(--cream);}
.ia-x:active{transform:scale(.88);}

/* hairline progress with a faint track so it stays legible on white */
.ia-prog{position:absolute;left:0;right:0;bottom:0;height:1.5px;background:rgba(58,46,34,.05);z-index:3;}
.ia-prog-fill{
  height:100%;border-radius:0 2px 2px 0;
  background:linear-gradient(90deg,var(--acc-2),var(--acc));
  transition:width 60ms linear;opacity:.9;
}

@media(prefers-reduced-motion:reduce){
  .ia{transition:opacity .2s ease,max-height .2s ease,margin .2s ease;}
  .ia-ic{animation:none!important;}
}
`

type Tone = { acc: string; acc2: string; bg: string; bd: string }
const TONES: Record<'gold' | 'error' | 'warn', Tone> = {
  gold:  { acc: '#8c7456', acc2: '#c9b68f', bg: 'rgba(140,116,86,.10)', bd: 'rgba(140,116,86,.26)' },
  error: { acc: '#c0473b', acc2: '#e08379', bg: 'rgba(192,71,59,.10)',  bd: 'rgba(192,71,59,.26)' },
  warn:  { acc: '#b07d2f', acc2: '#dcb060', bg: 'rgba(176,125,47,.12)', bd: 'rgba(176,125,47,.26)' },
}

function ToastItem({ id, title, description, variant, onDismiss }: {
  id: string; title?: React.ReactNode; description?: React.ReactNode
  variant?: string; onDismiss: (id: string) => void
}) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const dismissed = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const dismiss = () => {
    if (dismissed.current) return
    dismissed.current = true
    if (intervalRef.current) clearInterval(intervalRef.current)
    setVisible(false)
    setLeaving(true)
    setTimeout(() => onDismiss(id), ANIM_OUT)
  }

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40)
    const start = Date.now()
    const interval = setInterval(() => {
      const remaining = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      setProgress(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 30)
    intervalRef.current = interval
    const t2 = setTimeout(dismiss, DURATION)
    return () => { clearTimeout(t1); clearTimeout(t2); clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const titleText = typeof title === 'string' ? title.toLowerCase() : ''
  const isError = variant === 'destructive' || titleText.includes('fail') || titleText.includes('error')
  const isWarn = titleText.includes('login') || titleText.includes('required') || titleText.includes('stock') || titleText.includes('remove')
  const isSuccess = titleText.includes('added') || titleText.includes('success') || titleText.includes('saved')

  const tone: Tone = isError ? TONES.error : isWarn ? TONES.warn : TONES.gold
  const Icon = isError ? AlertCircle : isWarn ? AlertTriangle : isSuccess ? Check : Sparkles

  const style = {
    '--acc': tone.acc,
    '--acc-2': tone.acc2,
    '--acc-bg': tone.bg,
    '--acc-bd': tone.bd,
    transform: visible ? 'translate3d(0,0,0) scale(1)' : 'translate3d(110%,0,0) scale(.94)',
    opacity: visible ? 1 : 0,
    maxHeight: leaving ? 0 : 140,
    marginBottom: leaving ? 0 : 10,
  } as React.CSSProperties

  return (
    <div
      className="ia"
      style={style}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <div className="ia-in">
        <div className="ia-ic"><Icon size={17} strokeWidth={2.2} /></div>
        <div className="ia-tx">
          {title && <div className="ia-title">{title}</div>}
          {description && <div className="ia-desc">{description}</div>}
        </div>
        <button className="ia-x" onClick={dismiss} aria-label="Dismiss notification">
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>
      <div className="ia-prog">
        <div className="ia-prog-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="ia-wrap">
      <style>{CSS}</style>
      {toasts.map(({ id, title, description, variant }) => (
        <ToastItem
          key={id}
          id={id}
          title={title}
          description={description}
          variant={variant ?? undefined}
          onDismiss={(tid) => dismiss(tid)}
        />
      ))}
    </div>
  )
}
