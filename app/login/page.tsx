"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from "@/components/footer";
import { signIn } from "@/lib/auth";
import { saveUser } from "@/lib/authStore";
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import CTA from "@/components/ImgGallery";

const REMEMBER_KEY = "si_remember_email";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [focused, setFocused] = useState("");

  /* load saved email on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setFormData((p) => ({ ...p, email: saved }));
        setRemember(true);
      }
    } catch {}
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    /* persist / clear email based on remember toggle */
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, formData.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {}

    try {
      const data = await signIn(formData.email, formData.password);
      if (data?.user) {
        saveUser({
          id: data.user.id,
          email: data.user.email ?? "",
          name:
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0],
          createdAt: data.user.created_at,
        });
      }
      router.push("/account");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        /* ── PAGE ── */
        .si-page{
          min-height:100vh;
          background:#080604;
          font-family:var(--font-main);
          color:#F5F0E8;
          display:flex;flex-direction:column;
          position:relative;overflow:clip;
        }
        .si-page::before{
          content:'';position:absolute;inset:0;pointer-events:none;z-index:0;opacity:.025;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .si-page::after{
          content:'';position:absolute;
          top:40%;left:50%;transform:translate(-50%,-50%);
          width:700px;height:500px;border-radius:50%;
          background:radial-gradient(ellipse,rgba(212,175,55,.055) 0%,transparent 65%);
          pointer-events:none;z-index:0;
        }

        /* ── MAIN ── */
        .si-main{
          flex:1;display:flex;align-items:center;justify-content:center;
          padding:120px 20px 80px;
          position:relative;z-index:1;
        }

        /* ── CARD ── */
        .si-card{
          width:100%;max-width:440px;
          background:rgba(255,255,255,.028);
          border:1px solid rgba(212,175,55,.14);
          padding:48px 44px 44px;
          position:relative;overflow:hidden;
          animation:siFadeIn .7s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes siFadeIn{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:520px){.si-card{padding:36px 24px 32px;}}

        .si-card::before{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,#D4AF37 50%,transparent);
          opacity:.55;
        }
        .si-corner{position:absolute;width:16px;height:16px;border-color:rgba(212,175,55,.3);border-style:solid;}
        .si-corner-tl{top:10px;left:10px;border-width:1px 0 0 1px;}
        .si-corner-tr{top:10px;right:10px;border-width:1px 1px 0 0;}
        .si-corner-bl{bottom:10px;left:10px;border-width:0 0 1px 1px;}
        .si-corner-br{bottom:10px;right:10px;border-width:0 1px 1px 0;}

        /* ── HEADER ── */
        .si-hd{text-align:center;margin-bottom:36px;}
        .si-eyebrow{
          display:flex;align-items:center;justify-content:center;gap:12px;
          margin-bottom:14px;
        }
        .si-ey-l{width:24px;height:.5px;background:linear-gradient(90deg,transparent,#D4AF37);}
        .si-ey-r{width:24px;height:.5px;background:linear-gradient(90deg,#D4AF37,transparent);}
        .si-ey-txt{font-size:7.5px;font-weight:400;letter-spacing:.44em;text-transform:uppercase;color:#D4AF37;opacity:.8;}
        .si-title{
          font-family:var(--font-heading);
          font-size:clamp(28px,4vw,38px);font-weight:300;line-height:1;
          color:#F5F0E8;margin-bottom:10px;
        }
        .si-title em{
          font-style:italic;font-weight:400;
          color:transparent;
          background:linear-gradient(125deg,#E8D48B,#D4AF37 42%,#C49A0C 70%,#D4AF37);
          -webkit-background-clip:text;background-clip:text;
        }
        .si-sub{font-size:12px;font-weight:300;color:rgba(245,240,232,.38);letter-spacing:.04em;}

        /* ── ERROR ── */
        .si-err{
          display:flex;align-items:flex-start;gap:10px;
          padding:14px 16px;
          background:rgba(192,57,43,.08);
          border:1px solid rgba(192,57,43,.22);
          margin-bottom:24px;
          animation:siFadeIn .35s ease both;
        }
        .si-err-txt{font-size:12px;font-weight:300;color:rgba(255,160,140,.85);line-height:1.55;}

        /* ── FORM ── */
        .si-form{display:flex;flex-direction:column;gap:18px;}

        .si-field{display:flex;flex-direction:column;gap:7px;}
        .si-label{
          font-size:8px;font-weight:400;letter-spacing:.36em;text-transform:uppercase;
          color:rgba(212,175,55,.6);
        }
        .si-input-wrap{position:relative;}
        .si-ico{
          position:absolute;left:14px;top:50%;transform:translateY(-50%);
          color:rgba(245,240,232,.22);pointer-events:none;
          transition:color .25s;
        }
        .si-input-wrap.focused .si-ico{color:#D4AF37;}

        .si-input{
          width:100%;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(212,175,55,.14);
          color:#F5F0E8;
          font-family:var(--font-main);font-size:13px;font-weight:300;
          padding:13px 44px 13px 42px;
          outline:none;
          transition:border-color .28s,background .28s,box-shadow .28s;
          -webkit-appearance:none;
        }
        .si-input::placeholder{color:rgba(245,240,232,.2);}
        .si-input:focus{
          border-color:rgba(212,175,55,.5);
          background:rgba(212,175,55,.04);
          box-shadow:0 0 0 3px rgba(212,175,55,.06);
        }
        .si-input:-webkit-autofill,
        .si-input:-webkit-autofill:focus{
          -webkit-box-shadow:0 0 0 1000px #100e09 inset !important;
          -webkit-text-fill-color:#F5F0E8 !important;
          border-color:rgba(212,175,55,.3);
        }

        .si-eye{
          position:absolute;right:13px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;
          color:rgba(245,240,232,.22);padding:4px;
          transition:color .22s;
        }
        .si-eye:hover{color:rgba(212,175,55,.65);}

        /* ── REMEMBER ROW ── */
        .si-remember-row{
          display:flex;align-items:center;justify-content:space-between;
          gap:12px;
        }

        /* custom checkbox */
        .si-check-label{
          display:flex;align-items:center;gap:10px;
          cursor:pointer;user-select:none;
        }
        .si-check-box{
          width:18px;height:18px;flex-shrink:0;
          border:1px solid rgba(212,175,55,.25);
          background:rgba(255,255,255,.03);
          display:flex;align-items:center;justify-content:center;
          position:relative;
          transition:border-color .25s,background .25s;
        }
        .si-check-label:hover .si-check-box{
          border-color:rgba(212,175,55,.5);
          background:rgba(212,175,55,.05);
        }
        .si-check-box.checked{
          border-color:#D4AF37;
          background:rgba(212,175,55,.12);
        }
        /* checkmark */
        .si-check-box::after{
          content:'';
          position:absolute;
          width:9px;height:5px;
          border-left:1.5px solid #D4AF37;
          border-bottom:1.5px solid #D4AF37;
          transform:rotate(-45deg) translateY(-1px) scale(0);
          transition:transform .22s cubic-bezier(.34,1.56,.64,1);
        }
        .si-check-box.checked::after{transform:rotate(-45deg) translateY(-1px) scale(1);}
        .si-check-txt{
          font-size:10px;font-weight:300;
          color:rgba(245,240,232,.42);
          letter-spacing:.06em;
        }

        /* saved badge — shown when email was pre-filled */
        .si-saved-badge{
          font-size:8px;font-weight:400;letter-spacing:.18em;text-transform:uppercase;
          color:rgba(212,175,55,.55);
          border:1px solid rgba(212,175,55,.18);
          padding:3px 8px;
          background:rgba(212,175,55,.04);
        }

        .si-forgot{
          font-size:9.5px;font-weight:300;letter-spacing:.08em;
          color:rgba(212,175,55,.5);text-decoration:none;
          transition:color .22s;white-space:nowrap;
        }
        .si-forgot:hover{color:#D4AF37;}

        /* ── SUBMIT ── */
        .si-submit{
          width:100%;display:flex;align-items:center;justify-content:center;gap:10px;
          font-family:var(--font-main);font-size:9.5px;font-weight:400;
          letter-spacing:.28em;text-transform:uppercase;
          color:#080604;background:#D4AF37;border:none;
          padding:15px 20px;cursor:pointer;
          position:relative;overflow:hidden;margin-top:4px;
          transition:box-shadow .32s,opacity .25s;
        }
        .si-submit::before{
          content:'';position:absolute;inset:0;background:#b8960c;
          transform:translateX(-101%);
          transition:transform .44s cubic-bezier(.25,.46,.45,.94);
        }
        .si-submit:hover:not(:disabled){box-shadow:0 8px 32px rgba(212,175,55,.38);}
        .si-submit:hover:not(:disabled)::before{transform:translateX(0);}
        .si-submit span,.si-submit svg{position:relative;z-index:1;}
        .si-submit:disabled{opacity:.5;cursor:not-allowed;}

        .si-dots{display:inline-flex;gap:4px;align-items:center;}
        .si-dot{width:4px;height:4px;border-radius:50%;background:#080604;animation:siDot 1s ease-in-out infinite;}
        .si-dot:nth-child(2){animation-delay:.16s;}
        .si-dot:nth-child(3){animation-delay:.32s;}
        @keyframes siDot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}

        /* ── DIVIDER ── */
        .si-div{display:flex;align-items:center;gap:14px;margin:20px 0;}
        .si-div-line{flex:1;height:.5px;background:rgba(212,175,55,.1);}
        .si-div-txt{font-size:9px;font-weight:300;letter-spacing:.1em;color:rgba(245,240,232,.28);white-space:nowrap;}

        /* ── CREATE ACCOUNT ── */
        .si-signup{
          width:100%;display:flex;align-items:center;justify-content:center;gap:8px;
          font-family:var(--font-main);font-size:9.5px;font-weight:400;
          letter-spacing:.24em;text-transform:uppercase;
          color:rgba(212,175,55,.65);text-decoration:none;
          padding:14px 20px;
          border:1px solid rgba(212,175,55,.2);
          background:transparent;
          position:relative;overflow:hidden;
          transition:border-color .28s,box-shadow .28s;
        }
        .si-signup::before{
          content:'';position:absolute;inset:0;background:#D4AF37;
          transform:scaleX(0);transform-origin:left;
          transition:transform .44s cubic-bezier(.25,.46,.45,.94);
        }
        .si-signup:hover{border-color:#D4AF37;box-shadow:0 4px 20px rgba(212,175,55,.14);}
        .si-signup:hover::before{transform:scaleX(1);}
        .si-signup:hover span{color:#080604;}
        .si-signup span{position:relative;z-index:1;transition:color .28s;}
      `}</style>

      <div className="si-page">
        <HeaderMegaMenu />

        <main className="si-main">
          <div className="si-card">
            <div className="si-corner si-corner-tl" />
            <div className="si-corner si-corner-tr" />
            <div className="si-corner si-corner-bl" />
            <div className="si-corner si-corner-br" />

            {/* heading */}
            <div className="si-hd">
              <div className="si-eyebrow">
                <div className="si-ey-l" />
                <span className="si-ey-txt">Welcome Back</span>
                <div className="si-ey-r" />
              </div>
              <h1 className="si-title">
                Sign <em>In</em>
              </h1>
              <p className="si-sub">Access your account & exclusive offers</p>
            </div>

            {/* error */}
            {error && (
              <div className="si-err">
                <AlertCircle
                  size={15}
                  color="rgba(255,120,100,.8)"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <p className="si-err-txt">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="si-form">
              {/* Email */}
              <div className="si-field">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <label className="si-label">Email Address</label>
                  {remember && formData.email && (
                    <span className="si-saved-badge">Saved</span>
                  )}
                </div>
                <div
                  className={`si-input-wrap${focused === "email" ? " focused" : ""}`}
                >
                  <Mail size={15} className="si-ico" strokeWidth={1.5} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="si-input"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused("")}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="si-field">
                <label className="si-label">Password</label>
                <div
                  className={`si-input-wrap${focused === "password" ? " focused" : ""}`}
                >
                  <Lock size={15} className="si-ico" strokeWidth={1.5} />
                  <input
                    type={showPw ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Your password"
                    className="si-input"
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="si-eye"
                    onClick={() => setShowPw((p) => !p)}
                  >
                    {showPw ? (
                      <EyeOff size={14} strokeWidth={1.5} />
                    ) : (
                      <Eye size={14} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + forgot */}
              <div className="si-remember-row">
                <label
                  className="si-check-label"
                  onClick={() => setRemember((p) => !p)}
                >
                  <div
                    className={`si-check-box${remember ? " checked" : ""}`}
                  />
                  <span className="si-check-txt">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="si-forgot">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" className="si-submit" disabled={loading}>
                {loading ? (
                  <span className="si-dots">
                    <span className="si-dot" />
                    <span className="si-dot" />
                    <span className="si-dot" />
                  </span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={13} strokeWidth={1.4} />
                  </>
                )}
              </button>
            </form>

            {/* divider */}
            <div className="si-div">
              <div className="si-div-line" />
              <span className="si-div-txt">Don't have an account?</span>
              <div className="si-div-line" />
            </div>

            <Link href="/auth/signup" className="si-signup">
              <span>Create Account</span>
            </Link>
          </div>
        </main>

        <CTA />
        <Footer />
      </div>
    </>
  );
}
