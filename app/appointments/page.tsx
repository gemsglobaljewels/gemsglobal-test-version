'use client';

import { useState, useEffect } from "react";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { useRouter } from "next/navigation";
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle,
  Sparkles, ArrowRight, MapPin, Video, Store, Globe, Calendar,
  Phone, Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getUser, getSettings, fetchAndSyncSettings, SiteSettings } from "@/lib/authStore";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, isBefore, isToday,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════════════════ */

type AppointmentType = "visit" | "online";
type Step = "type" | "location" | "service" | "datetime" | "details" | "confirmation";

const APPOINTMENT_TYPES: {
  id: AppointmentType;
  icon: React.ReactNode;
  name: string;
  tagline: string;
  description: string;
  badge: string | null;
  features: string[];
}[] = [
  {
    id: "visit",
    icon: <Store size={24} aria-hidden="true" />,
    name: "Visit a Boutique",
    tagline: "In-person · Private salon",
    description:
      "Experience our collections in person at a private appointment. Enjoy unhurried, white-glove service from our specialists.",
    badge: "Most Requested",
    features: ["Private salon setting", "One-to-one specialist", "View pieces in person"],
  },
  {
    id: "online",
    icon: <Video size={24} aria-hidden="true" />,
    name: "Online Consultation",
    tagline: "Video call · Anywhere",
    description:
      "Connect with our specialists from anywhere in the world via a secure, private video session — guidance without the travel.",
    badge: null,
    features: ["Secure private video", "Available worldwide", "Link sent to your email"],
  },
];

type Service = { id: string; name: string; description: string; duration: string; tag: string | null };

// Fallback service lists — used only if the admin-managed list fails to load.
// The live lists come from /api/appointment-services (admin editable).
const SERVICES: Service[] = [
  { id: "consultation", name: "Personal Consultation", description: "One-on-one with our jewellery specialists in a private salon", duration: "45 min", tag: "Most Popular" },
  { id: "fitting", name: "Jewellery Fitting", description: "Precision sizing and bespoke fitting for every piece", duration: "30 min", tag: null },
  { id: "custom-design", name: "Custom Design Session", description: "Co-create your dream piece with our master jewellers", duration: "90 min", tag: "Exclusive" },
  { id: "repair", name: "Repair Assessment", description: "Expert evaluation, restoration, and transparent quotation", duration: "30 min", tag: null },
];

const ONLINE_SERVICES: Service[] = [
  { id: "consultation", name: "Virtual Consultation", description: "In-depth video session with a jewellery specialist", duration: "45 min", tag: "Most Popular" },
  { id: "custom-design", name: "Custom Design Session", description: "Co-create your dream piece via screen share & sketches", duration: "90 min", tag: "Exclusive" },
  { id: "styling", name: "Styling Advice", description: "Curated recommendations based on your wardrobe and occasion", duration: "30 min", tag: null },
];

function toService(row: any): Service {
  return {
    id: row.key,
    name: row.name,
    description: row.description || "",
    duration: row.duration || "",
    tag: row.tag || null,
  };
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM",
];

const ONLINE_TIME_SLOTS = [
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "01:00 PM", "01:30 PM", "02:00 PM",
  "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
];

const STEP_LABELS: Record<Step, string> = {
  type: "Type",
  location: "Boutique",
  service: "Service",
  datetime: "Schedule",
  details: "Details",
  confirmation: "Done",
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
export default function AppointmentsPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("type");
  const [appointmentType, setAppointmentType] = useState<AppointmentType | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", platform: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [visitServices, setVisitServices] = useState<Service[]>(SERVICES);
  const [onlineServices, setOnlineServices] = useState<Service[]>(ONLINE_SERVICES);

  /* ── Boutiques (from Site Settings — India & Canada) ── */
  const boutiques = [
    {
      id: "india",
      name: "India Atelier",
      country: "India",
      icon: <Sparkles size={13} />,
      address: settings?.india_address?.trim() || "",
      phone: settings?.india_contact?.trim() || "",
      hours: "Mon – Sat · 10:00 AM – 07:00 PM IST",
    },
    {
      id: "canada",
      name: "Canada Atelier",
      country: "Canada",
      icon: <Sparkles size={13} />,
      address: settings?.canada_address?.trim() || "",
      phone: settings?.canada_contact?.trim() || "",
      hours: "Mon – Sat · 10:00 AM – 06:00 PM EST",
    },
  ];
  const selectedBoutique = boutiques.find(b => b.id === selectedLocation) || null;

  /* ── Derived ── */
  const activeServices = appointmentType === "online" ? onlineServices : visitServices;
  const activeTimeSlots = appointmentType === "online" ? ONLINE_TIME_SLOTS : TIME_SLOTS;
  const selectedTypeInfo = APPOINTMENT_TYPES.find(t => t.id === appointmentType);
  const service = activeServices.find(s => s.id === selectedService);

  // The location string saved on the appointment (flows to admin + email).
  const locationLabel = appointmentType === "online"
    ? "Online — Video Call"
    : selectedBoutique
      ? [selectedBoutique.name, selectedBoutique.address].filter(Boolean).join(" · ")
      : "Boutique — confirmed on booking";

  /* ── Step flow (stepper) ── */
  const flow: Step[] = appointmentType === "online"
    ? ["type", "service", "datetime", "details"]
    : ["type", "location", "service", "datetime", "details"];
  const stepIndex = step === "confirmation" ? flow.length : flow.indexOf(step);
  const progressPct = step === "confirmation" ? 100 : Math.round((stepIndex / (flow.length - 1)) * 100);

  /* ── auth ── */
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      const localUser = getUser();
      if (!user && !localUser) { router.push("/login?redirect=/appointments"); }
      else { setIsLoggedIn(true); }
      setCheckingAuth(false);
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const localUser = getUser();
    if (localUser) {
      setFormData(prev => ({
        ...prev,
        name: localUser.name || prev.name,
        email: localUser.email || prev.email,
        phone: localUser.phone || prev.phone,
      }));
    }
  }, [isLoggedIn]);

  /* ── Site settings (boutique addresses) ── */
  useEffect(() => {
    setSettings(getSettings());
    fetchAndSyncSettings().then(s => { if (s) setSettings(s); }).catch(() => {});
  }, []);

  /* ── Admin-managed services (falls back to defaults) ── */
  useEffect(() => {
    let alive = true;
    async function loadServices() {
      try {
        const [vRes, oRes] = await Promise.all([
          fetch("/api/appointment-services?mode=visit").then(r => r.json()).catch(() => null),
          fetch("/api/appointment-services?mode=online").then(r => r.json()).catch(() => null),
        ]);
        if (!alive) return;
        if (Array.isArray(vRes) && vRes.length) setVisitServices(vRes.map(toService));
        if (Array.isArray(oRes) && oRes.length) setOnlineServices(oRes.map(toService));
      } catch { /* keep fallbacks */ }
    }
    loadServices();
    return () => { alive = false; };
  }, []);

  /* ── handlers ── */
  const handleTypeSelect = (type: AppointmentType) => {
    setAppointmentType(type);
    setSelectedLocation(null);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(type === "visit" ? "location" : "service");
    loadPastAppointments();
  };

  const handleLocationSelect = (id: string) => {
    setSelectedLocation(id);
    setStep("service");
  };

  const handleServiceSelect = (id: string) => {
    setSelectedService(id);
    setStep("datetime");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function handleSubmit() {
    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      setError("Please fill all required fields."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentType,
          service: selectedService,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          preferredPlatform: appointmentType === "online" ? formData.platform : "",
          notes: formData.notes,
          location: locationLabel,
        }),
      });
      if (res.ok) setStep("confirmation");
      else setError("Booking failed. Please try again.");
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  async function loadPastAppointments() {
    setLoadingPast(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let res: Response;
      if (user?.id) {
        res = await fetch(`/api/appointments?userId=${encodeURIComponent(user.id)}`);
      } else {
        const localUser = getUser();
        if (!localUser?.email) { setPastAppointments([]); return; }
        res = await fetch(`/api/appointments?email=${encodeURIComponent(localUser.email)}`);
      }
      const data = await res.json();
      const now = new Date();
      const past = (data || [])
        .filter((a: any) => { try { return new Date(`${a.date}T${a.time}:00`) < now; } catch { return false; } })
        .sort((a: any, b: any) => new Date(`${b.date}T${b.time}:00`).getTime() - new Date(`${a.date}T${a.time}:00`).getTime());
      setPastAppointments(past);
    } catch { setPastAppointments([]); }
    finally { setLoadingPast(false); }
  }

  /* ── calendar helpers ── */
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const firstDayIdx = startOfMonth(currentMonth).getDay();
  const emptyDays = Array(firstDayIdx).fill(null);
  const isDisabled = (d: Date) => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (isBefore(d, t)) return true;
    if (appointmentType === "online") {
      const day = d.getDay();
      if (day === 0 || day === 6) return true;
    }
    return false;
  };

  const goBack = () => {
    if (step === "location") setStep("type");
    else if (step === "service") setStep(appointmentType === "visit" ? "location" : "type");
    else if (step === "datetime") setStep("service");
    else if (step === "details") setStep("datetime");
  };

  /* ── loading ── */
  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 30, height: 30, border: "1.5px solid var(--c-accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "ax-spin 0.7s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "var(--font-montserrat)", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--c-text-muted)" }}>Loading</p>
        </div>
      </div>
    );
  }
  if (!isLoggedIn) return null;

  const summaryVisible = step !== "type" && step !== "confirmation";

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <>
      <style>{STYLES}</style>
      <HeaderMegaMenu />

      <div className="ax-page">
        {/* ── Masthead ── */}
        <header className="ax-masthead">
          <div className="ax-mast-inner">
            <div className="ax-eyebrow">
              <span className="ax-eyebrow-rule" />
              By Appointment
            </div>
            <h1 className="ax-mast-title">Private <em>Appointments</em></h1>
            <p className="ax-mast-sub">
              A considered, personal experience — in one of our boutiques or online, entirely at your convenience.
            </p>
          </div>

          {/* Stepper */}
          {step !== "confirmation" && (
            <nav className="ax-stepper" aria-label="Booking progress">
              {flow.map((s, i) => {
                const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
                return (
                  <div key={s} className={`ax-step ax-step--${state}`}>
                    <span className="ax-step-dot">
                      {state === "done" ? <Check size={12} /> : <span>{i + 1}</span>}
                    </span>
                    <span className="ax-step-label">{STEP_LABELS[s]}</span>
                    {i < flow.length - 1 && <span className="ax-step-line" />}
                  </div>
                );
              })}
            </nav>
          )}
        </header>

        {/* ── Stage ── */}
        <div className={`ax-stage ${summaryVisible ? "ax-stage--split" : ""}`}>
          <main className="ax-main" id="main-content">
            <AnimatePresence mode="wait">

              {/* ═══ STEP: TYPE ═══ */}
              {step === "type" && (
                <motion.section key="type" {...stepMotion} aria-label="Choose appointment type">
                  <SectionHead eyebrow="Step 01" title={<>How would you like to <em>meet?</em></>} />
                  <div className="ax-type-grid">
                    {APPOINTMENT_TYPES.map((t) => (
                      <button key={t.id} className="ax-type-card" onClick={() => handleTypeSelect(t.id)}>
                        {t.badge && <span className="ax-type-badge">{t.badge}</span>}
                        <span className="ax-type-icon">{t.icon}</span>
                        <span className="ax-type-name">{t.name}</span>
                        <span className="ax-type-tag">{t.tagline}</span>
                        <p className="ax-type-desc">{t.description}</p>
                        <ul className="ax-feature-list">
                          {t.features.map((f, i) => (
                            <li key={i}><Check size={12} /> {f}</li>
                          ))}
                        </ul>
                        <span className="ax-type-cta">Select <ArrowRight size={14} /></span>
                      </button>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* ═══ STEP: LOCATION ═══ */}
              {step === "location" && (
                <motion.section key="location" {...stepMotion} aria-label="Choose a boutique">
                  <BackHead onBack={goBack} eyebrow="Step 02" title={<>Choose your <em>boutique</em></>} />
                  <div className="ax-boutique-grid">
                    {boutiques.map((b) => {
                      const active = selectedLocation === b.id;
                      return (
                        <button
                          key={b.id}
                          className={`ax-boutique-card ${active ? "is-active" : ""}`}
                          onClick={() => handleLocationSelect(b.id)}
                        >
                          <div className="ax-boutique-top">
                            <span className="ax-boutique-flag">{b.country}</span>
                            {active && <span className="ax-boutique-check"><Check size={13} /></span>}
                          </div>
                          <div className="ax-boutique-name">{b.name}</div>
                          <div className="ax-boutique-meta">
                            <span className="ax-bm-row">
                              <MapPin size={13} />
                              <span>{b.address || "Address shared upon confirmation"}</span>
                            </span>
                            {b.phone && (
                              <span className="ax-bm-row">
                                <Phone size={13} />
                                <span>{b.phone}</span>
                              </span>
                            )}
                            <span className="ax-bm-row">
                              <Clock size={13} />
                              <span>{b.hours}</span>
                            </span>
                          </div>
                          <span className="ax-type-cta">Book here <ArrowRight size={14} /></span>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* ═══ STEP: SERVICE ═══ */}
              {step === "service" && (
                <motion.section key="service" {...stepMotion} aria-label="Select a service">
                  <BackHead
                    onBack={goBack}
                    eyebrow={appointmentType === "online" ? "Step 02" : "Step 03"}
                    title={appointmentType === "online" ? <>Our <em>online</em> services</> : <>Select a <em>service</em></>}
                  />
                  <div className="ax-service-list">
                    {activeServices.map((s) => {
                      const active = selectedService === s.id;
                      return (
                        <button key={s.id} className={`ax-service-card ${active ? "is-active" : ""}`} onClick={() => handleServiceSelect(s.id)}>
                          <div className="ax-service-main">
                            {s.tag && <span className="ax-service-tag"><Sparkles size={9} /> {s.tag}</span>}
                            <div className="ax-service-name">{s.name}</div>
                            {s.description && <div className="ax-service-desc">{s.description}</div>}
                          </div>
                          <div className="ax-service-side">
                            {s.duration && <span className="ax-service-dur"><Clock size={12} /> {s.duration}</span>}
                            <ArrowRight size={16} className="ax-service-arrow" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              )}

              {/* ═══ STEP: DATE & TIME ═══ */}
              {step === "datetime" && (
                <motion.section key="datetime" {...stepMotion} aria-label="Select date and time">
                  <BackHead
                    onBack={goBack}
                    eyebrow={appointmentType === "online" ? "Step 03" : "Step 04"}
                    title={<>When shall we <em>expect you?</em></>}
                  />

                  {appointmentType === "online" && (
                    <div className="ax-note">
                      <Video size={13} />
                      Online sessions run Monday – Friday · all times Indian Standard Time (IST)
                    </div>
                  )}

                  <div className="ax-cal-card">
                    <div className="ax-cal-header">
                      <button className="ax-cal-nav" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month">
                        <ChevronLeft size={16} />
                      </button>
                      <span className="ax-cal-month">{format(currentMonth, "MMMM yyyy")}</span>
                      <button className="ax-cal-nav" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Next month">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="ax-cal-grid">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                        <div key={d} className="ax-cal-dow">{d}</div>
                      ))}
                      {emptyDays.map((_, i) => <div key={`e${i}`} />)}
                      {daysInMonth.map((date, i) => {
                        const disabled = isDisabled(date);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const today = isToday(date);
                        return (
                          <button
                            key={i}
                            disabled={disabled}
                            onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                            className={["ax-cal-day", today ? "is-today" : "", isSelected ? "is-selected" : ""].join(" ")}
                            aria-label={format(date, "EEEE, MMMM d")}
                          >
                            {format(date, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedDate && (
                      <motion.div
                        key="times"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                      >
                        <div className="ax-sub-label">{format(selectedDate, "EEEE, d MMMM")} — available times</div>
                        <div className="ax-time-grid">
                          {activeTimeSlots.map((time) => (
                            <button
                              key={time}
                              className={`ax-time-pill ${selectedTime === time ? "is-selected" : ""}`}
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="ax-actions">
                    <button
                      className="ax-btn ax-btn--solid"
                      disabled={!selectedDate || !selectedTime}
                      onClick={() => setStep("details")}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                    {selectedDate && !selectedTime && <span className="ax-hint">Select a time to continue</span>}
                  </div>
                </motion.section>
              )}

              {/* ═══ STEP: DETAILS ═══ */}
              {step === "details" && (
                <motion.section key="details" {...stepMotion} aria-label="Your details">
                  <BackHead
                    onBack={goBack}
                    eyebrow={appointmentType === "online" ? "Step 04" : "Step 05"}
                    title={<>Almost <em>there</em></>}
                  />

                  {error && (
                    <div className="ax-error" role="alert">
                      <AlertCircle size={15} />
                      <div>
                        <p>{error}</p>
                        <button onClick={() => setError("")}>Dismiss</button>
                      </div>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate className="ax-form">
                    <div className="ax-form-grid">
                      <div className="ax-field">
                        <label htmlFor="ax-name">Full Name *</label>
                        <input id="ax-name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Your full name" required autoComplete="name" />
                      </div>
                      <div className="ax-field">
                        <label htmlFor="ax-phone">Phone</label>
                        <input id="ax-phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="+91 00000 00000" autoComplete="tel" />
                      </div>
                    </div>
                    <div className="ax-field">
                      <label htmlFor="ax-email">Email Address *</label>
                      <input id="ax-email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="you@example.com" required autoComplete="email" />
                    </div>

                    {appointmentType === "online" && (
                      <div className="ax-field">
                        <label htmlFor="ax-platform">Preferred Platform (optional)</label>
                        <input id="ax-platform" name="platform" type="text" value={formData.platform} onChange={handleInputChange} placeholder="e.g. Zoom, Google Meet, FaceTime…" />
                      </div>
                    )}

                    <div className="ax-field">
                      <label htmlFor="ax-notes">Special Requests</label>
                      <textarea id="ax-notes" name="notes" rows={3} value={formData.notes} onChange={handleInputChange} placeholder={appointmentType === "online" ? "Any questions or pieces you'd like to discuss…" : "Any preferences, accessibility needs, or questions for our team…"} />
                    </div>

                    <div className="ax-actions">
                      <button type="submit" className="ax-btn ax-btn--solid" disabled={loading}>
                        {loading ? (
                          <><span className="ax-btn-spin" /> Reserving…</>
                        ) : (
                          <>Confirm Appointment <ArrowRight size={14} /></>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.section>
              )}

              {/* ═══ STEP: CONFIRMATION ═══ */}
              {step === "confirmation" && (
                <motion.section key="confirmation" {...stepMotion} aria-label="Confirmation" className="ax-confirm">
                  <motion.span
                    className="ax-confirm-icon"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <CheckCircle size={28} />
                  </motion.span>
                  <h2 className="ax-confirm-title">Your appointment<br />is <em>confirmed</em></h2>
                  <p className="ax-confirm-sub">
                    A confirmation has been sent to <strong>{formData.email}</strong>. We look forward to welcoming you.
                  </p>

                  {appointmentType === "online" && (
                    <div className="ax-callout">
                      <Video size={18} />
                      <div>
                        <div className="ax-callout-title">Your video link is on its way</div>
                        <p>A secure, private video link will be emailed to you before your session. No installation needed — simply click to join.</p>
                      </div>
                    </div>
                  )}

                  <div className="ax-receipt">
                    <ReceiptRow label="Appointment" value={appointmentType === "visit" ? "In-Person Visit" : "Online Consultation"} />
                    {appointmentType === "visit" && selectedBoutique && (
                      <ReceiptRow label="Boutique" value={selectedBoutique.name} />
                    )}
                    <ReceiptRow label="Service" value={service?.name} />
                    <ReceiptRow label="Date & Time" value={selectedDate ? `${format(selectedDate, "EEE, d MMM yyyy")} · ${selectedTime}` : ""} />
                    {service?.duration && <ReceiptRow label="Duration" value={service.duration} />}
                    <ReceiptRow label="Location" value={appointmentType === "visit" ? (selectedBoutique?.address || selectedBoutique?.name) : "Online — Video Call"} />
                    <ReceiptRow label="Confirmation to" value={formData.email} />
                  </div>

                  <div className="ax-actions ax-actions--center">
                    <button className="ax-btn ax-btn--ghost" onClick={() => window.location.href = "/"}>Return Home</button>
                    <button
                      className="ax-btn ax-btn--solid"
                      onClick={() => {
                        setStep("type");
                        setAppointmentType(null);
                        setSelectedLocation(null);
                        setSelectedService(null);
                        setSelectedDate(null);
                        setSelectedTime(null);
                        setFormData({ name: formData.name, email: formData.email, phone: formData.phone, platform: "", notes: "" });
                      }}
                    >
                      Book Another <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.section>
              )}

            </AnimatePresence>
          </main>

          {/* ── Sticky summary rail ── */}
          {summaryVisible && (
            <aside className="ax-summary">
              <div className="ax-summary-card">
                <div className="ax-summary-eyebrow">Your Appointment</div>
                <div className="ax-summary-progress"><span style={{ width: `${progressPct}%` }} /></div>

                <dl className="ax-summary-list">
                  <SummaryRow label="Mode" show={!!appointmentType} value={
                    <span className="ax-summary-mode">
                      {appointmentType === "visit" ? <Store size={12} /> : <Video size={12} />}
                      {appointmentType === "visit" ? "In-Person" : "Online"}
                    </span>
                  } />
                  {appointmentType === "visit" && (
                    <SummaryRow label="Boutique" show={!!selectedBoutique} value={selectedBoutique?.name} />
                  )}
                  <SummaryRow label="Service" show={!!service} value={service?.name} />
                  <SummaryRow label="Duration" show={!!service?.duration} value={service?.duration} />
                  <SummaryRow label="Date" show={!!selectedDate} value={selectedDate ? format(selectedDate, "d MMM yyyy") : ""} />
                  <SummaryRow label="Time" show={!!selectedTime} value={selectedTime} />
                </dl>

                {!loadingPast && pastAppointments.length > 0 && (
                  <div className="ax-summary-past">
                    <div className="ax-summary-eyebrow">Recent Visits</div>
                    {pastAppointments.slice(0, 2).map((a, i) => (
                      <div key={i} className="ax-past-row">
                        <span>{a.service}</span>
                        <span>{a.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

const stepMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

function SectionHead({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) {
  return (
    <div className="ax-head">
      <span className="ax-head-eyebrow">{eyebrow}</span>
      <h2 className="ax-head-title">{title}</h2>
    </div>
  );
}

function BackHead({ onBack, eyebrow, title }: { onBack: () => void; eyebrow: string; title: React.ReactNode }) {
  return (
    <div className="ax-head ax-head--back">
      <button className="ax-back" onClick={onBack} aria-label="Go back">
        <ChevronLeft size={14} /> Back
      </button>
      <span className="ax-head-eyebrow">{eyebrow}</span>
      <h2 className="ax-head-title">{title}</h2>
    </div>
  );
}

function SummaryRow({ label, value, show }: { label: string; value?: React.ReactNode; show: boolean }) {
  if (!show) return null;
  return (
    <div className="ax-summary-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="ax-receipt-row">
      <span className="ax-receipt-label">{label}</span>
      <span className="ax-receipt-value">{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STYLES
   ══════════════════════════════════════════════════════════════════════════ */
const STYLES = `
  @keyframes ax-spin { to { transform: rotate(360deg); } }

  .ax-page {
    min-height: 100vh;
    background:
      radial-gradient(1200px 500px at 50% -10%, rgba(var(--c-accent-rgb), 0.06), transparent 60%),
      var(--c-bg);
    color: var(--c-text);
    font-family: var(--font-montserrat);
    padding-bottom: 100px;
  }

  /* ── Masthead ── */
  .ax-masthead {
    max-width: 1180px;
    margin: 0 auto;
    padding: clamp(40px, 6vw, 88px) clamp(20px, 5vw, 56px) 0;
    text-align: center;
  }
  .ax-mast-inner { max-width: 640px; margin: 0 auto; }
  .ax-eyebrow {
    display: inline-flex; align-items: center; gap: 12px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.34em; text-transform: uppercase;
    color: var(--c-accent); margin-bottom: 20px;
  }
  .ax-eyebrow-rule { width: 30px; height: 1px; background: var(--c-accent); opacity: 0.5; }
  .ax-mast-title {
    font-family: var(--font-main); font-weight: 400;
    font-size: clamp(38px, 5.4vw, 62px); line-height: 1.04; letter-spacing: -0.015em;
    color: var(--c-text); margin: 0 0 18px;
  }
  .ax-mast-title em { font-style: italic; color: var(--c-accent); }
  .ax-mast-sub {
    font-size: 14px; font-weight: 300; line-height: 1.75; color: var(--c-text-muted);
    max-width: 500px; margin: 0 auto;
  }

  /* ── Stepper ── */
  .ax-stepper {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin: 44px auto 0; max-width: 720px; flex-wrap: nowrap;
  }
  .ax-step { display: flex; align-items: center; position: relative; }
  .ax-step-dot {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--c-border); background: #fff;
    font-family: var(--font-main); font-size: 14px; color: var(--c-text-muted);
    transition: all 0.3s ease; z-index: 1;
  }
  .ax-step-label {
    margin-left: 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--c-text-faint); white-space: nowrap;
    transition: color 0.3s ease;
  }
  .ax-step-line {
    width: clamp(20px, 5vw, 56px); height: 1px; background: var(--c-border);
    margin: 0 14px; transition: background 0.3s ease;
  }
  .ax-step--active .ax-step-dot { border-color: var(--c-accent); color: var(--c-accent); box-shadow: 0 0 0 4px rgba(var(--c-accent-rgb), 0.10); }
  .ax-step--active .ax-step-label { color: var(--c-text); }
  .ax-step--done .ax-step-dot { background: var(--c-accent); border-color: var(--c-accent); color: #fff; }
  .ax-step--done .ax-step-label { color: var(--c-text-muted); }
  .ax-step--done .ax-step-line { background: var(--c-accent); }
  @media (max-width: 720px) {
    .ax-step-label { display: none; }
    .ax-step-line { margin: 0 6px; width: 26px; }
  }

  /* ── Stage ── */
  .ax-stage {
    max-width: 1180px; margin: 0 auto;
    padding: clamp(36px, 5vw, 64px) clamp(20px, 5vw, 56px) 0;
    display: grid; grid-template-columns: 1fr;
  }
  .ax-stage--split { grid-template-columns: 1fr 340px; gap: clamp(28px, 4vw, 56px); align-items: start; }
  @media (max-width: 940px) { .ax-stage--split { grid-template-columns: 1fr; } }
  .ax-main { min-width: 0; }

  /* ── Section heads ── */
  .ax-head { margin-bottom: 34px; }
  .ax-head-eyebrow {
    display: block; font-size: 10px; font-weight: 600; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--c-accent); margin-bottom: 12px;
  }
  .ax-head-title {
    font-family: var(--font-main); font-weight: 400; font-size: clamp(28px, 3.6vw, 42px);
    line-height: 1.1; letter-spacing: -0.01em; color: var(--c-text); margin: 0;
  }
  .ax-head-title em { font-style: italic; color: var(--c-accent); }
  .ax-back {
    display: inline-flex; align-items: center; gap: 5px; margin-bottom: 20px;
    background: transparent; border: none; cursor: pointer;
    font-family: var(--font-montserrat); font-size: 10px; font-weight: 600;
    letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-muted);
    padding: 0; transition: gap 0.2s ease, color 0.2s ease;
  }
  .ax-back:hover { gap: 9px; color: var(--c-accent); }

  /* ── Type cards ── */
  .ax-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 720px) { .ax-type-grid { grid-template-columns: 1fr; } }
  .ax-type-card {
    position: relative; display: flex; flex-direction: column; text-align: left;
    padding: 34px 30px 28px; background: #fff; border: 1px solid var(--c-border);
    cursor: pointer; transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
    box-shadow: 0 1px 2px rgba(var(--c-text-rgb), 0.03);
  }
  .ax-type-card:hover {
    border-color: rgba(var(--c-accent-rgb), 0.5);
    box-shadow: 0 18px 44px -20px rgba(var(--c-text-rgb), 0.22);
    transform: translateY(-3px);
  }
  .ax-type-badge {
    position: absolute; top: 20px; right: 20px; padding: 4px 11px;
    background: var(--c-accent); color: #fff; font-size: 8px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase;
  }
  .ax-type-icon {
    width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--c-border); color: var(--c-accent); margin-bottom: 22px;
    transition: border-color 0.25s ease, background 0.25s ease;
  }
  .ax-type-card:hover .ax-type-icon { border-color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.05); }
  .ax-type-name { font-family: var(--font-main); font-size: 25px; font-weight: 500; letter-spacing: -0.01em; color: var(--c-text); margin-bottom: 5px; }
  .ax-type-tag { font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-accent); margin-bottom: 16px; }
  .ax-type-desc { font-size: 13px; font-weight: 300; line-height: 1.7; color: var(--c-text-muted); margin-bottom: 22px; }
  .ax-feature-list { list-style: none; padding: 0; margin: 0 0 26px; display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--c-border); padding-top: 20px; }
  .ax-feature-list li { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 300; color: var(--c-text); }
  .ax-feature-list li svg { color: var(--c-accent); flex-shrink: 0; }
  .ax-type-cta {
    display: inline-flex; align-items: center; gap: 8px; margin-top: auto;
    font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-accent);
    transition: gap 0.2s ease;
  }
  .ax-type-card:hover .ax-type-cta { gap: 12px; }

  /* ── Boutique cards ── */
  .ax-boutique-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 720px) { .ax-boutique-grid { grid-template-columns: 1fr; } }
  .ax-boutique-card {
    display: flex; flex-direction: column; text-align: left; padding: 28px 28px 26px;
    background: #fff; border: 1px solid var(--c-border); cursor: pointer;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
  }
  .ax-boutique-card:hover { border-color: rgba(var(--c-accent-rgb), 0.5); box-shadow: 0 18px 44px -20px rgba(var(--c-text-rgb), 0.22); transform: translateY(-3px); }
  .ax-boutique-card.is-active { border-color: var(--c-accent); box-shadow: 0 0 0 1px var(--c-accent) inset; }
  .ax-boutique-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .ax-boutique-flag { font-size: 9px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--c-accent); }
  .ax-boutique-check { width: 24px; height: 24px; border-radius: 50%; background: var(--c-accent); color: #fff; display: flex; align-items: center; justify-content: center; }
  .ax-boutique-name { font-family: var(--font-main); font-size: 26px; font-weight: 500; letter-spacing: -0.01em; color: var(--c-text); margin-bottom: 18px; }
  .ax-boutique-meta { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--c-border); padding-top: 18px; margin-bottom: 24px; }
  .ax-bm-row { display: flex; align-items: flex-start; gap: 10px; font-size: 12.5px; font-weight: 300; line-height: 1.55; color: var(--c-text-muted); }
  .ax-bm-row svg { color: var(--c-accent); flex-shrink: 0; margin-top: 2px; }

  /* ── Service list ── */
  .ax-service-list { display: flex; flex-direction: column; gap: 12px; }
  .ax-service-card {
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
    padding: 24px 26px; background: #fff; border: 1px solid var(--c-border);
    cursor: pointer; text-align: left; width: 100%;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .ax-service-card:hover { border-color: rgba(var(--c-accent-rgb), 0.5); transform: translateX(4px); box-shadow: 0 14px 30px -20px rgba(var(--c-text-rgb), 0.2); }
  .ax-service-card.is-active { border-color: var(--c-accent); box-shadow: 0 0 0 1px var(--c-accent) inset; }
  .ax-service-main { min-width: 0; }
  .ax-service-tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border: 1px solid rgba(var(--c-accent-rgb), 0.3); font-size: 8px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent); margin-bottom: 10px; }
  .ax-service-name { font-family: var(--font-main); font-size: 22px; font-weight: 500; letter-spacing: -0.01em; color: var(--c-text); margin-bottom: 5px; line-height: 1.15; }
  .ax-service-desc { font-size: 12.5px; font-weight: 300; line-height: 1.55; color: var(--c-text-muted); }
  .ax-service-side { display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
  .ax-service-dur { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--c-accent); white-space: nowrap; }
  .ax-service-arrow { color: var(--c-border); transition: color 0.2s ease; }
  .ax-service-card:hover .ax-service-arrow { color: var(--c-accent); }

  /* ── Note ── */
  .ax-note {
    display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin-bottom: 24px;
    background: rgba(var(--c-accent-rgb), 0.05); border: 1px solid rgba(var(--c-accent-rgb), 0.2);
    font-size: 12px; font-weight: 300; color: var(--c-text-muted);
  }
  .ax-note svg { color: var(--c-accent); flex-shrink: 0; }

  /* ── Calendar ── */
  .ax-cal-card { background: #fff; border: 1px solid var(--c-border); padding: 26px 26px 20px; margin-bottom: 30px; }
  .ax-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .ax-cal-month { font-family: var(--font-main); font-size: 20px; font-weight: 500; color: var(--c-text); }
  .ax-cal-nav { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--c-border); background: #fff; color: var(--c-text-muted); cursor: pointer; transition: border-color 0.18s ease, color 0.18s ease; }
  .ax-cal-nav:hover { border-color: var(--c-accent); color: var(--c-accent); }
  .ax-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .ax-cal-dow { text-align: center; font-size: 8px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-faint); padding-bottom: 12px; }
  .ax-cal-day {
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 400; color: var(--c-text); background: transparent; border: 1px solid transparent;
    cursor: pointer; transition: all 0.15s ease; font-family: var(--font-montserrat);
  }
  .ax-cal-day:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); }
  .ax-cal-day.is-today { color: var(--c-accent); font-weight: 700; }
  .ax-cal-day.is-selected { background: var(--c-accent); color: #fff; border-color: var(--c-accent); font-weight: 600; }
  .ax-cal-day:disabled { color: var(--c-text-faint); opacity: 0.3; cursor: not-allowed; }

  .ax-sub-label { font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 14px; }

  /* ── Time grid ── */
  .ax-time-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 8px; }
  @media (max-width: 720px) { .ax-time-grid { grid-template-columns: repeat(3, 1fr); } }
  .ax-time-pill {
    padding: 12px 8px; border: 1px solid var(--c-border); background: #fff; color: var(--c-text);
    font-size: 12px; font-weight: 400; cursor: pointer; text-align: center; white-space: nowrap;
    font-family: var(--font-montserrat); transition: all 0.15s ease;
  }
  .ax-time-pill:hover { border-color: var(--c-accent); color: var(--c-accent); }
  .ax-time-pill.is-selected { background: var(--c-accent); border-color: var(--c-accent); color: #fff; font-weight: 500; }

  /* ── Actions / buttons ── */
  .ax-actions { display: flex; align-items: center; gap: 14px; margin-top: 34px; flex-wrap: wrap; }
  .ax-actions--center { justify-content: center; }
  .ax-hint { font-size: 12px; color: var(--c-text-muted); }
  .ax-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 9px;
    height: 52px; padding: 0 32px; cursor: pointer; border: 1px solid transparent;
    font-family: var(--font-montserrat); font-size: 11px; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase; transition: all 0.22s ease;
  }
  .ax-btn--solid { background: var(--c-accent); color: #fff; }
  .ax-btn--solid:hover:not(:disabled) { background: var(--c-text); box-shadow: 0 14px 30px -12px rgba(var(--c-text-rgb), 0.4); transform: translateY(-2px); }
  .ax-btn--solid:disabled { opacity: 0.4; cursor: not-allowed; }
  .ax-btn--ghost { background: #fff; border-color: var(--c-border); color: var(--c-text); }
  .ax-btn--ghost:hover { border-color: var(--c-accent); color: var(--c-accent); }
  .ax-btn-spin { width: 14px; height: 14px; border: 1.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: ax-spin 0.7s linear infinite; }

  /* ── Form ── */
  .ax-form { max-width: 620px; }
  .ax-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  @media (max-width: 560px) { .ax-form-grid { grid-template-columns: 1fr; } }
  .ax-field { display: flex; flex-direction: column; margin-bottom: 24px; }
  .ax-form-grid .ax-field { margin-bottom: 0; }
  .ax-field label { font-size: 9px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--c-text-muted); margin-bottom: 10px; }
  .ax-field input, .ax-field textarea {
    width: 100%; padding: 14px 0; background: transparent; border: none;
    border-bottom: 1px solid var(--c-border); color: var(--c-text);
    font-family: var(--font-montserrat); font-size: 15px; font-weight: 300;
    outline: none; transition: border-color 0.2s ease;
  }
  .ax-field input:focus, .ax-field textarea:focus { border-bottom-color: var(--c-accent); }
  .ax-field textarea { resize: none; min-height: 60px; }
  .ax-field ::placeholder { color: rgba(var(--c-accent-rgb), 0.4); }

  /* ── Error ── */
  .ax-error { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-left: 2px solid var(--c-error); background: rgba(185,64,64,0.05); margin-bottom: 26px; }
  .ax-error svg { color: var(--c-error); flex-shrink: 0; margin-top: 1px; }
  .ax-error p { font-size: 13px; color: var(--c-error); margin: 0 0 4px; }
  .ax-error button { font-size: 10px; color: var(--c-error); opacity: 0.7; background: none; border: none; cursor: pointer; padding: 0; }

  /* ── Confirmation ── */
  .ax-confirm { max-width: 560px; margin: 0 auto; text-align: center; }
  .ax-confirm-icon { display: inline-flex; width: 68px; height: 68px; align-items: center; justify-content: center; border: 1px solid var(--c-accent); color: var(--c-accent); margin-bottom: 30px; }
  .ax-confirm-title { font-family: var(--font-main); font-weight: 400; font-size: clamp(30px, 4vw, 46px); line-height: 1.08; color: var(--c-text); margin: 0 0 16px; }
  .ax-confirm-title em { font-style: italic; color: var(--c-accent); }
  .ax-confirm-sub { font-size: 14px; font-weight: 300; line-height: 1.75; color: var(--c-text-muted); margin: 0 0 30px; }
  .ax-confirm-sub strong { font-weight: 500; color: var(--c-text); }
  .ax-callout { display: flex; align-items: flex-start; gap: 14px; text-align: left; padding: 18px 20px; border: 1px solid rgba(var(--c-accent-rgb), 0.25); background: rgba(var(--c-accent-rgb), 0.04); margin-bottom: 30px; }
  .ax-callout svg { color: var(--c-accent); flex-shrink: 0; margin-top: 2px; }
  .ax-callout-title { font-family: var(--font-main); font-size: 16px; font-weight: 500; color: var(--c-text); margin-bottom: 5px; }
  .ax-callout p { font-size: 12px; font-weight: 300; line-height: 1.65; color: var(--c-text-muted); margin: 0; }
  .ax-receipt { text-align: left; border-top: 1px solid var(--c-border); margin-bottom: 34px; }
  .ax-receipt-row { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; padding: 15px 0; border-bottom: 1px solid var(--c-border); }
  .ax-receipt-label { font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--c-text-muted); flex-shrink: 0; }
  .ax-receipt-value { font-family: var(--font-main); font-size: 16px; font-weight: 400; color: var(--c-text); text-align: right; }

  /* ── Summary rail ── */
  .ax-summary { position: sticky; top: 24px; }
  @media (max-width: 940px) { .ax-summary { position: static; } }
  .ax-summary-card { background: #fff; border: 1px solid var(--c-border); padding: 26px 24px; box-shadow: 0 1px 2px rgba(var(--c-text-rgb), 0.03); }
  .ax-summary-eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; color: var(--c-accent); margin-bottom: 16px; }
  .ax-summary-progress { height: 2px; background: var(--c-border); margin-bottom: 22px; overflow: hidden; }
  .ax-summary-progress span { display: block; height: 100%; background: var(--c-accent); transition: width 0.5s cubic-bezier(0.22,1,0.36,1); }
  .ax-summary-list { margin: 0; }
  .ax-summary-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid var(--c-border); }
  .ax-summary-row:last-child { border-bottom: none; }
  .ax-summary-row dt { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-text-faint); }
  .ax-summary-row dd { margin: 0; font-family: var(--font-main); font-size: 14px; color: var(--c-text); text-align: right; }
  .ax-summary-mode { display: inline-flex; align-items: center; gap: 6px; }
  .ax-summary-mode svg { color: var(--c-accent); }
  .ax-summary-past { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--c-border); }
  .ax-past-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: 12px; }
  .ax-past-row span:first-child { font-family: var(--font-main); color: var(--c-text); }
  .ax-past-row span:last-child { font-size: 10px; color: var(--c-text-muted); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
`;
