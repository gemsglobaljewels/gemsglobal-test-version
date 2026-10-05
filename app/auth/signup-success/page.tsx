"use client";

import Link from "next/link";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from "@/components/footer";
import {
  CheckCircle2,
  Mail,
  ArrowRight,
  Package,
  Heart,
  Sparkles,
} from "lucide-react";

const GemMark = () => (
  <svg viewBox="0 0 40 34" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="axgem" x1="0" y1="0" x2="40" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E7D9B8" /><stop offset=".5" stopColor="#C9B68F" /><stop offset="1" stopColor="#A8916F" />
      </linearGradient>
    </defs>
    <g stroke="url(#axgem)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
      <path d="M8 4h24l6 8-18 18L2 12Z" fill="rgba(231,217,184,.12)" />
      <path d="M15 4l-7 8 12 18 12-18-7-8" />
      <path d="M2 12h36" />
      <path d="M20 4 15 12l5 18 5-18-5-8" />
    </g>
  </svg>
);

export default function SignUpSuccessPage() {
  return (
    <>
      <style>{`

.ax-page{
  --w:#FFFFFF;--iv:#FDFCF9;--cr:#F8F4EE;--wa:#EFE9DF;--bd:#ECE5DA;--bd2:#E2D9CB;
  --a:#8C7456;--a2:#A8916F;--a3:#C9B68F;
  --al:rgba(140,116,86,.10);--am:rgba(140,116,86,.22);
  --ink:#3A2E22;--mu:rgba(58,46,34,.56);--fa:rgba(58,46,34,.40);--li:rgba(58,46,34,.07);
  --err:#B94040;--ok:#2D6A4F;
  --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
  --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
  --e:cubic-bezier(.22,1,.36,1);--spring:cubic-bezier(.34,1.56,.64,1);
  min-height:100vh;display:flex;flex-direction:column;
  background:var(--iv);color:var(--ink);
}
.ax-page *{box-sizing:border-box;}
.ax-page a:focus-visible,.ax-page button:focus-visible{outline:2px solid var(--a);outline-offset:2px;border-radius:8px;}

/* MAIN */
.ax-main{flex:1;display:flex;align-items:center;justify-content:center;padding:clamp(22px,4vw,60px) clamp(14px,4vw,48px);}

/* SPLIT CARD */
.ax-card{
  width:100%;max-width:1000px;display:grid;grid-template-columns:1.05fr 1fr;
  background:var(--w);border:1px solid var(--bd);border-radius:22px;overflow:hidden;
  box-shadow:0 40px 90px -50px rgba(58,46,34,.5),0 10px 36px -24px rgba(58,46,34,.22);
  animation:axCard .85s var(--e) both;
}
@keyframes axCard{from{opacity:0;transform:translateY(26px);}to{opacity:1;transform:none;}}
@media(max-width:880px){.ax-card{grid-template-columns:1fr;max-width:480px;}}

/* VISUAL ASIDE */
.ax-aside{position:relative;overflow:hidden;min-height:610px;display:flex;flex-direction:column;justify-content:space-between;gap:24px;padding:42px 38px;isolation:isolate;}
.ax-aside-img{position:absolute;inset:0;z-index:-2;}
.ax-aside-img img{width:100%;height:100%;object-fit:cover;}
.ax-aside::after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(155deg,rgba(58,46,34,.82) 0%,rgba(46,35,24,.58) 46%,rgba(20,14,8,.78) 100%);}
.ax-aside::before{content:'';position:absolute;inset:0;z-index:-1;opacity:.5;background:radial-gradient(120% 80% at 18% 12%,rgba(201,182,143,.22),transparent 55%);}
@media(max-width:880px){.ax-aside{min-height:190px;padding:24px 26px;}}

.ax-aside-top{display:flex;align-items:center;gap:11px;}
.ax-aside-mark{display:inline-flex;}
.ax-aside-mark svg{height:34px;width:auto;}
.ax-aside-brand{font-family:var(--serif);font-size:18px;font-weight:300;letter-spacing:.3em;text-transform:uppercase;color:var(--iv);line-height:1;}
.ax-aside-brand em{font-style:italic;font-weight:500;color:var(--a3);padding-right:.12em;}

.ax-aside-quote{font-family:var(--serif);font-size:clamp(26px,2.9vw,33px);font-weight:300;line-height:1.2;color:#F7F1E8;letter-spacing:.005em;}
.ax-aside-quote em{font-style:italic;color:var(--a3);padding-right:.12em;}
.ax-aside-sub{margin-top:14px;font-family:var(--sans);font-size:11.5px;font-weight:300;letter-spacing:.05em;line-height:1.75;color:rgba(247,241,232,.66);max-width:36ch;}

.ax-trust{display:flex;flex-direction:column;gap:12px;}
.ax-trust-i{display:flex;align-items:center;gap:11px;font-family:var(--sans);font-size:10.5px;font-weight:400;letter-spacing:.05em;color:rgba(247,241,232,.82);}
.ax-trust-i svg{color:var(--a3);flex-shrink:0;}
@media(max-width:880px){.ax-aside-mid,.ax-trust{display:none;}}

/* FORM SIDE */
.ax-form-side{padding:clamp(34px,3.4vw,52px) clamp(24px,3vw,48px);display:flex;flex-direction:column;justify-content:center;background:var(--w);}
.ax-form-side.center{text-align:center;align-items:center;}

.ax-head{margin-bottom:26px;}
.ax-form-side.center .ax-head{margin-bottom:8px;}
.ax-eyebrow{display:inline-flex;align-items:center;gap:10px;margin-bottom:14px;}
.ax-eyebrow .ln{width:24px;height:1px;background:linear-gradient(90deg,var(--a3),transparent);}
.ax-eyebrow .tag{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.30em;text-transform:uppercase;color:var(--a);}
.ax-title{font-family:var(--serif);font-size:clamp(29px,3.3vw,39px);font-weight:300;line-height:1.04;color:var(--ink);}
.ax-title em{font-style:italic;font-weight:500;color:transparent;background:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));-webkit-background-clip:text;background-clip:text;padding-right:.12em;}
.ax-sub{margin-top:10px;font-family:var(--sans);font-size:11.5px;font-weight:300;letter-spacing:.04em;color:var(--mu);line-height:1.6;}

/* MESSAGES */
.ax-msg{display:flex;align-items:flex-start;gap:9px;padding:12px 14px;border-radius:11px;margin-bottom:18px;font-family:var(--sans);font-size:11.5px;font-weight:400;line-height:1.5;text-align:left;animation:axCard .4s ease both;}
.ax-msg.err{background:rgba(185,64,64,.07);border:1px solid rgba(185,64,64,.22);color:#9c3636;}
.ax-msg.ok{background:var(--al);border:1px solid var(--am);color:var(--a);}
.ax-msg svg{flex-shrink:0;margin-top:1px;}

/* FORM */
.ax-form{display:flex;flex-direction:column;gap:15px;width:100%;text-align:left;}
.ax-field{display:flex;flex-direction:column;gap:6px;}
.ax-label-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.ax-label{font-family:var(--sans);font-size:8.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--mu);}
.ax-wrap{position:relative;display:flex;align-items:center;background:var(--w);border:1px solid var(--bd2);border-radius:11px;transition:border-color .25s,box-shadow .25s,background .25s;}
.ax-wrap:focus-within{border-color:var(--a2);box-shadow:0 0 0 3px var(--al);}
.ax-ico{position:absolute;left:14px;display:flex;color:var(--fa);pointer-events:none;transition:color .25s;}
.ax-wrap:focus-within .ax-ico{color:var(--a);}
.ax-input{flex:1;width:100%;min-width:0;background:transparent;border:none;outline:none;font-family:var(--sans);font-size:13px;font-weight:400;color:var(--ink);padding:13px 14px 13px 42px;border-radius:11px;}
.ax-input::placeholder{color:var(--fa);font-weight:300;}
.ax-input:-webkit-autofill,.ax-input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px var(--w) inset!important;-webkit-text-fill-color:var(--ink)!important;}
.ax-eye{position:absolute;right:10px;background:none;border:none;cursor:pointer;color:var(--fa);padding:5px;display:flex;transition:color .2s;}
.ax-eye:hover{color:var(--a);}

/* PHONE / SELECT */
.ax-phone{display:grid;grid-template-columns:108px 1fr;gap:9px;}
.ax-select-wrap{position:relative;display:flex;align-items:center;background:var(--w);border:1px solid var(--bd2);border-radius:11px;transition:border-color .25s,box-shadow .25s;}
.ax-select-wrap:focus-within{border-color:var(--a2);box-shadow:0 0 0 3px var(--al);}
.ax-select{width:100%;appearance:none;-webkit-appearance:none;background:transparent;border:none;outline:none;font-family:var(--sans);font-size:12.5px;color:var(--ink);padding:13px 26px 13px 13px;border-radius:11px;cursor:pointer;}
.ax-select option{color:var(--ink);}
.ax-select-ico{position:absolute;right:9px;color:var(--fa);pointer-events:none;}
.ax-hint{font-family:var(--sans);font-size:9px;letter-spacing:.02em;color:var(--fa);margin-top:2px;}

/* STRENGTH */
.ax-strength{margin-top:7px;}
.ax-strength-bars{display:flex;gap:4px;margin-bottom:4px;}
.ax-strength-bar{flex:1;height:2.5px;border-radius:2px;background:var(--li);transition:background .35s;}
.ax-strength-lbl{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--fa);}

/* ROW / CHECK / SMALL LINK */
.ax-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.ax-check{display:inline-flex;align-items:center;gap:9px;cursor:pointer;user-select:none;}
.ax-check-box{width:17px;height:17px;flex-shrink:0;border:1px solid var(--bd2);border-radius:5px;background:var(--w);display:flex;align-items:center;justify-content:center;position:relative;transition:border-color .2s,background .2s;}
.ax-check:hover .ax-check-box{border-color:var(--a2);}
.ax-check-box.on{border-color:var(--a);background:linear-gradient(135deg,var(--a),var(--a2));}
.ax-check-box::after{content:'';width:8px;height:4px;border-left:1.6px solid #fff;border-bottom:1.6px solid #fff;transform:rotate(-45deg) translateY(-1px) scale(0);transition:transform .2s var(--spring);}
.ax-check-box.on::after{transform:rotate(-45deg) translateY(-1px) scale(1);}
.ax-check-txt{font-family:var(--sans);font-size:10.5px;font-weight:400;letter-spacing:.03em;color:var(--mu);}
.ax-link-sm{font-family:var(--sans);font-size:10.5px;font-weight:500;letter-spacing:.02em;color:var(--a);text-decoration:none;transition:color .2s;white-space:nowrap;}
.ax-link-sm:hover{color:var(--ink);text-decoration:underline;text-underline-offset:3px;}
.ax-saved{font-family:var(--sans);font-size:8px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--a);background:var(--al);border:1px solid var(--am);padding:2px 7px;border-radius:5px;}

/* SUBMIT */
.ax-btn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:9px;margin-top:6px;padding:15px 22px;border:none;border-radius:12px;cursor:pointer;font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,var(--a),var(--a2));position:relative;overflow:hidden;box-shadow:0 14px 28px -14px rgba(140,116,86,.8);transition:transform .25s var(--e),box-shadow .3s var(--e),filter .25s,opacity .25s;}
.ax-btn:hover:not(:disabled){transform:translateY(-2px);filter:brightness(1.06);box-shadow:0 20px 38px -14px rgba(140,116,86,.9);}
.ax-btn:active:not(:disabled){transform:translateY(0);}
.ax-btn:disabled{opacity:.6;cursor:not-allowed;}
.ax-dots{display:inline-flex;gap:4px;}
.ax-dot{width:5px;height:5px;border-radius:50%;background:#fff;animation:axDot 1s ease-in-out infinite;}
.ax-dot:nth-child(2){animation-delay:.16s;}
.ax-dot:nth-child(3){animation-delay:.32s;}
@keyframes axDot{0%,80%,100%{transform:scale(.3);opacity:.4;}40%{transform:scale(1);opacity:1;}}

/* DIVIDER */
.ax-div{display:flex;align-items:center;gap:13px;margin:22px 0;}
.ax-div .ln{flex:1;height:1px;background:var(--bd);}
.ax-div span{font-family:var(--sans);font-size:9.5px;font-weight:400;letter-spacing:.04em;color:var(--fa);white-space:nowrap;}

/* GHOST BUTTON */
.ax-btn-ghost{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 22px;border:1px solid var(--bd2);border-radius:12px;cursor:pointer;text-decoration:none;font-family:var(--sans);font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--a);background:var(--w);transition:border-color .25s,color .2s,background .25s,box-shadow .25s,transform .2s;}
.ax-btn-ghost:hover{border-color:var(--a2);background:var(--cr);transform:translateY(-1px);box-shadow:0 8px 20px -12px rgba(58,46,34,.3);}

/* INFO CARD + SUCCESS BADGE */
.ax-info{display:flex;gap:11px;padding:14px 16px;border-radius:13px;background:var(--cr);border:1px solid var(--bd);text-align:left;margin:6px 0 20px;width:100%;}
.ax-info svg{color:var(--a);flex-shrink:0;margin-top:2px;}
.ax-info b{display:block;font-family:var(--sans);font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--ink);margin-bottom:3px;}
.ax-info p{font-family:var(--sans);font-size:10.5px;font-weight:300;line-height:1.6;color:var(--mu);margin:0;}
.ax-badge{width:66px;height:66px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;background:var(--al);border:1px solid var(--am);color:var(--a);animation:axPop .65s var(--spring) both;}
@keyframes axPop{0%{transform:scale(0);opacity:0;}60%{transform:scale(1.12);}100%{transform:scale(1);opacity:1;}}

/* FINE PRINT / BACK */
.ax-fine{margin-top:18px;text-align:center;font-family:var(--sans);font-size:10px;font-weight:300;line-height:1.7;color:var(--fa);}
.ax-fine a{color:var(--a);text-decoration:none;}
.ax-fine a:hover{text-decoration:underline;text-underline-offset:2px;}
.ax-back{display:inline-flex;align-items:center;gap:6px;font-family:var(--sans);font-size:10px;font-weight:500;letter-spacing:.04em;color:var(--mu);background:none;border:none;cursor:pointer;text-decoration:none;margin-top:6px;transition:color .2s,gap .2s;align-self:center;}
.ax-back:hover{color:var(--a);gap:9px;}
.ax-stack{display:flex;flex-direction:column;gap:11px;width:100%;}

@media(prefers-reduced-motion:reduce){.ax-page *,.ax-card,.ax-badge{animation:none!important;transition-duration:.01ms!important;}}

`}</style>
      <div className="ax-page">
        <HeaderMegaMenu />
        <main className="ax-main">
          <div className="ax-card">
            {/* LEFT visual aside */}
            <div className="ax-aside">
              <div className="ax-aside-img">
                <img
                  src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&q=80&auto=format&fit=crop"
                  alt=""
                />
              </div>
              <div className="ax-aside-top">
                <span className="ax-aside-mark">
                  <GemMark />
                </span>
                <span className="ax-aside-brand">
                  Gems<em>Global</em>
                </span>
              </div>
              <div className="ax-aside-mid">
                <h2 className="ax-aside-quote">
                  Welcome to a world<br />of <em>fine jewellery</em>.
                </h2>
                <p className="ax-aside-sub">
                  Your account is ready. Verify your email to unlock everything.
                </p>
              </div>
              <div className="ax-trust">
                <div className="ax-trust-i">
                  <Package size={15} strokeWidth={1.6} />
                  <span>Track every order</span>
                </div>
                <div className="ax-trust-i">
                  <Heart size={15} strokeWidth={1.6} />
                  <span>Sync your wishlist</span>
                </div>
                <div className="ax-trust-i">
                  <Sparkles size={15} strokeWidth={1.6} />
                  <span>Members-only drops</span>
                </div>
              </div>
            </div>

            {/* RIGHT form side */}
            <div className="ax-form-side center">
              <div className="ax-badge">
                <CheckCircle2 size={30} strokeWidth={1.6} />
              </div>
              <div className="ax-head">
                <div className="ax-eyebrow">
                  <span className="ln" />
                  <span className="tag">All Set</span>
                </div>
                <h1 className="ax-title">
                  Welcome to <em>Gems Global</em>
                </h1>
                <p className="ax-sub">
                  Your account has been created successfully. Please verify your
                  email to activate it.
                </p>
              </div>
              <div className="ax-info">
                <Mail size={17} strokeWidth={1.6} />
                <div>
                  <b>Verify your email</b>
                  <p>
                    We've sent a verification link to your inbox. Click it to
                    activate your account and start shopping.
                  </p>
                </div>
              </div>
              <div className="ax-stack">
                <Link href="/collection" className="ax-btn">
                  <span>Start Shopping</span>
                  <ArrowRight size={14} strokeWidth={1.8} />
                </Link>
                <Link href="/auth/signin" className="ax-btn-ghost">
                  <span>Back to Sign In</span>
                </Link>
              </div>
              <p className="ax-fine">
                Didn't receive the email? <a href="#">Request a new link</a>
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
