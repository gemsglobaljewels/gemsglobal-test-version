"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from "@/components/footer";
import {
  LogOut, User, ShoppingBag, Calendar,
  Mail, ArrowRight,
  Clock, Gem, X, Check, Phone, Bookmark,
  Shield, Camera, Video, Store, Edit2, Trash2, RotateCcw
} from "lucide-react";
import { getUser, clearUser, saveUser, clearCart, convertCurrency } from "@/lib/authStore";
import { authedFetch } from "@/lib/authedFetch";
import { isUnpaidStatus } from "@/lib/orderStatus";
import { Price, PriceFrom } from "@/components/Price";
import { signOut } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type TabId = "overview" | "profile" | "orders" | "appointments" | "saved";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "profile", label: "Profile" },
  { id: "orders", label: "Orders" },
  { id: "appointments", label: "Appointments" },
  { id: "saved", label: "Saved" },
];

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Changed my mind",
  "Delivery is taking too long",
  "Need to change size or design",
];

const RETURN_REASONS = [
  "Item damaged or defective",
  "Not as described on the website",
  "Wrong item received",
  "Size or fit issue",
  "Quality not as expected",
  "Changed my mind",
];

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<TabId>("overview");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  // Lifetime spend, normalized to the app's USD base currency. Orders can each
  // be stored in a different currency (INR/USD), so we cannot sum o.total
  // directly — every amount is converted to USD before adding.
  const [totalSpentUsd, setTotalSpentUsd] = useState(0);
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // id of the order/appointment currently being cancelled or removed
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/auth/signin"); return; }
    setUser(u);
    setLoading(false);
    fetchAppts(u);
    fetchOrders(u);
    fetchSavedBlogs(u);
  }, [router]);

  async function fetchAppts(u: any) {
    setApptLoading(true);
    try {
      const r = await fetch(`/api/appointments?email=${encodeURIComponent(u.email)}&limit=50`);
      const d = await r.json();
      setAppointments(Array.isArray(d) ? d : []);
    } catch { setAppointments([]); }
    finally { setApptLoading(false); }
  }

  async function fetchOrders(u: any) {
    setOrdersLoading(true);
    try {
      // /api/orders requires a verified JWT; authedFetch attaches it from the
      // live Supabase session so we don't depend on the async cookie bridge.
      const r = await authedFetch(`/api/orders?userId=${u.id}`);
      const d = await r.json();
      // Guard: only ever show genuinely placed (paid) orders. An abandoned
      // checkout — added to cart, proceeded, but never paid — stays pending /
      // payment_failed and must NOT appear as an order or count toward the
      // acquisitions total or lifetime spend. The API already excludes these;
      // this mirrors that rule client-side so a stale/cached response can't
      // resurrect a phantom order.
      const placed = Array.isArray(d) ? d.filter((o: any) => !isUnpaidStatus(o?.status)) : [];
      setOrders(placed);
    } catch { setOrders([]); }
    finally { setOrdersLoading(false); }
  }

  async function fetchSavedBlogs(u: any) {
    setSavedLoading(true);
    try {
      const r = await fetch(`/api/saved-blogs?userId=${u.id}`);
      const d = await r.json();
      setSavedBlogs(Array.isArray(d) ? d : []);
    } catch { setSavedBlogs([]); }
    finally { setSavedLoading(false); }
  }

  const handleUpdateProfile = async (field: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field === 'name' ? 'name' : field]: value,
          email: user.email
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      const next = { ...user, [field]: updated[field] };
      saveUser(next);
      setUser(next);
      setEditingField(null);
      toast({ title: "Profile Updated", description: "Changes saved successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Could not update profile.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const unsaveBlog = async (blogId: string) => {
    try {
      await fetch('/api/saved-blogs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, blogId }),
      });
      setSavedBlogs(prev => prev.filter((b: any) => b.id !== blogId));
      toast({ title: "Saved Updated", description: "Article removed from your selection." });
    } catch {
      toast({ title: "Error", description: "Could not remove article.", variant: "destructive" });
    }
  };

  /* ── order actions — cancel a live order / return a delivered one / remove a settled one ── */
  // Cancelling or returning asks for a reason first (stored on the order, visible to admin).
  // One shared dialog serves both flows; actionMode picks the copy and reason chips.
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionMode, setActionMode] = useState<'cancel' | 'return'>('cancel');

  const cancelOrder = async (orderId: string, reason: string) => {
    setActingId(orderId);
    try {
      const r = await authedFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', cancellationReason: reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not cancel order');
      setOrders(prev => prev.map((o: any) => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setCancelTarget(null);
      setCancelReason("");
      toast({ title: "Order Cancelled", description: "Your order has been cancelled." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not cancel order.", variant: "destructive" });
    } finally { setActingId(null); }
  };

  const requestReturn = async (orderId: string, reason: string) => {
    setActingId(orderId);
    try {
      const r = await authedFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'return_requested', returnReason: reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not request return');
      setOrders(prev => prev.map((o: any) => o.id === orderId ? { ...o, status: 'return_requested' } : o));
      setCancelTarget(null);
      setCancelReason("");
      toast({ title: "Return Requested", description: "We have received your return request. Our team will contact you shortly." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not request return.", variant: "destructive" });
    } finally { setActingId(null); }
  };

  const removeOrder = async (orderId: string) => {
    if (!window.confirm('Remove this order from your ledger? This cannot be undone.')) return;
    setActingId(orderId);
    try {
      const r = await authedFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not remove order');
      setOrders(prev => prev.filter((o: any) => o.id !== orderId));
      toast({ title: "Order Removed", description: "The order has been removed from your ledger." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not remove order.", variant: "destructive" });
    } finally { setActingId(null); }
  };

  /* ── appointment actions — cancel upcoming / remove concluded ── */
  const cancelAppointment = async (apptId: string) => {
    if (!window.confirm('Cancel this consultation?')) return;
    setActingId(apptId);
    try {
      const r = await authedFetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not cancel appointment');
      setAppointments(prev => prev.map((a: any) => a.id === apptId ? { ...a, status: 'cancelled' } : a));
      toast({ title: "Consultation Cancelled", description: "Your consultation has been cancelled." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not cancel appointment.", variant: "destructive" });
    } finally { setActingId(null); }
  };

  const removeAppointment = async (apptId: string) => {
    if (!window.confirm('Remove this consultation from your diary? This cannot be undone.')) return;
    setActingId(apptId);
    try {
      const r = await authedFetch(`/api/appointments/${apptId}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not remove appointment');
      setAppointments(prev => prev.filter((a: any) => a.id !== apptId));
      toast({ title: "Consultation Removed", description: "The consultation has been removed from your diary." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Could not remove appointment.", variant: "destructive" });
    } finally { setActingId(null); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload to R2
      const upRes = await fetch('/api/storage/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      const { url } = await upRes.json();
      if (!url) throw new Error("Upload failed");

      // 2. Update user record
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url, email: user.email }),
      });

      if (!res.ok) throw new Error("Failed to link photo");
      const updated = await res.json();

      const next = { ...user, avatarUrl: updated.avatarUrl };
      saveUser(next);
      setUser(next);
      toast({ title: "Photo Updated", description: "Your profile picture has been changed." });
    } catch (err) {
      toast({ title: "Upload Error", description: "Could not upload photo. Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    try { await signOut(); } catch { }
    clearCart();
    clearUser();
    router.replace("/");
  };

  /* ── lifetime spend, normalized to USD base (orders may be INR or USD) ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      const perOrderUsd = await Promise.all(
        orders.map((o: any) =>
          convertCurrency(Number(o.total) || 0, (o.currency || 'INR') as any, 'USD')
        )
      );
      if (alive) setTotalSpentUsd(perOrderUsd.reduce((s, v) => s + v, 0));
    })();
    return () => { alive = false; };
  }, [orders]);

  if (loading || !user) return <LoadingScreen />;

  const totalSpent = totalSpentUsd;
  const firstName = (user.name || "").trim().split(" ")[0] || user.name || "Guest";
  const initial = (user.name?.[0] || "G").toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  /* "Client since March 2024" — omitted when createdAt is missing/invalid */
  const sinceDate = user.createdAt ? new Date(user.createdAt) : null;
  const sinceLabel = sinceDate && !isNaN(sinceDate.getTime())
    ? sinceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const sinceYear = sinceDate && !isNaN(sinceDate.getTime()) ? sinceDate.getFullYear() : null;

  const counts: Partial<Record<TabId, number>> = {
    orders: orders.length,
    appointments: appointments.length,
    saved: savedBlogs.length,
  };

  const selectTab = (id: TabId, el?: HTMLElement) => {
    setTab(id);
    /* keep the active pill visible in the mobile scroll strip */
    if (el && typeof window !== 'undefined' && window.innerWidth < 1024) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="ac">
      <style>{CSS}</style>
      <HeaderMegaMenu />

      <main className="ac-main">
        {/* ═══ MASTHEAD ═══ */}
        <section className="ac-mast">
          <div className="ac-mast-rules" aria-hidden="true" />

          {/* folio line */}
          <div className="ac-folio">
            <span className="ac-eyebrow" aria-hidden="true" />
            <button className="ac-signout" onClick={handleSignOut}>
              <LogOut size={13} /> <span className="ac-ul">Sign Out</span>
            </button>
          </div>

          <div className="ac-mast-grid">
            <span className="ac-ghost" aria-hidden="true">{initial}</span>

            <div className="ac-mast-text">
              <h1 className="ac-h1">
                {greeting},
                <em>{firstName}</em>
              </h1>
              <p className="ac-meta">
                {sinceLabel && <span className="ac-meta-since">Client since {sinceLabel}</span>}
                {sinceLabel && <span className="ac-meta-dot" aria-hidden="true">·</span>}
                <span className="ac-meta-mail"><Mail size={12} /> {user.email}</span>
              </p>
            </div>

            <div className="ac-portrait-wrap">
              <button
                className="ac-portrait"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Replace profile photo"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="ac-portrait-img" />
                ) : (
                  <span className="ac-portrait-ph">{initial}</span>
                )}
                <span className="ac-portrait-veil">
                  {uploading ? <span className="ac-mini-spin" /> : <Camera size={17} strokeWidth={1.6} />}
                </span>
              </button>
              <span className="ac-portrait-cap">Replace Portrait</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                hidden
              />
            </div>
          </div>

          {/* stat rule — each cell jumps to its section */}
          <div className="ac-stats" role="group" aria-label="Account summary">
            <button className="ac-stat" onClick={() => selectTab('orders')}>
              <span className="ac-stat-n">{String(orders.length).padStart(2, '0')}</span>
              <span className="ac-stat-l">Acquisitions</span>
            </button>
            <button className="ac-stat" onClick={() => selectTab('appointments')}>
              <span className="ac-stat-n">{String(appointments.length).padStart(2, '0')}</span>
              <span className="ac-stat-l">Consultations</span>
            </button>
            <button className="ac-stat" onClick={() => selectTab('saved')}>
              <span className="ac-stat-n">{String(savedBlogs.length).padStart(2, '0')}</span>
              <span className="ac-stat-l">Saved</span>
            </button>
          </div>
          <div className="ac-dblrule" aria-hidden="true" />
        </section>

        {/* ═══ BODY · contents rail + stage ═══ */}
        <div className="ac-grid">
          <nav className="ac-nav" aria-label="Account sections">
            <span className="ac-nav-k">Contents</span>
            {TABS.map((t, i) => (
              <button
                key={t.id}
                className={`ac-nav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={(e) => selectTab(t.id, e.currentTarget)}
                aria-current={tab === t.id ? "page" : undefined}
              >
                {tab === t.id && (
                  <motion.span
                    layoutId="ac-nav-ind"
                    className="ac-nav-ind"
                    transition={{ type: "spring", stiffness: 420, damping: 38 }}
                  />
                )}
                <span className="ac-nav-ix">{String(i + 1).padStart(2, '0')}</span>
                <span className="ac-nav-lbl">{t.label}</span>
                {counts[t.id] != null && <span className="ac-nav-ct">{counts[t.id]}</span>}
              </button>
            ))}
          </nav>

          <div className="ac-stage">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="ac-view"
              >
                {tab === "overview" && <OverviewView orders={orders} appointments={appointments} totalSpent={totalSpent} sinceYear={sinceYear} onNav={(id: TabId) => selectTab(id)} />}
                {tab === "profile" && <ProfileView user={user} onEdit={(f: any, v: any) => { setEditingField(f); setEditValue(v); }} editingField={editingField} editValue={editValue} setEditValue={setEditValue} onSave={handleUpdateProfile} onCancel={() => setEditingField(null)} saving={saving} />}
                {tab === "orders" && <OrdersView orders={orders} loading={ordersLoading} onCancel={(o: any) => { setCancelReason(""); setActionMode('cancel'); setCancelTarget(o); }} onReturn={(o: any) => { setCancelReason(""); setActionMode('return'); setCancelTarget(o); }} onRemove={removeOrder} actingId={actingId} />}
                {tab === "appointments" && <AppointmentsView appts={appointments} loading={apptLoading} onCancel={cancelAppointment} onRemove={removeAppointment} actingId={actingId} />}
                {tab === "saved" && <SavedView blogs={savedBlogs} loading={savedLoading} onUnsave={(id: any) => unsaveBlog(id)} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Cancel-order / request-return dialog — a reason is required ── */}
      <AnimatePresence>
        {cancelTarget && (() => {
          const isReturn = actionMode === 'return';
          const reasons = isReturn ? RETURN_REASONS : CANCEL_REASONS;
          return (
          <motion.div
            className="ac-modal-veil"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (actingId !== cancelTarget.id) { setCancelTarget(null); setCancelReason(""); } }}
          >
            <motion.div
              className="ac-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ac-cancel-title"
              initial={{ opacity: 0, y: 18, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: .98 }}
              transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <span className="ac-kick">{isReturn ? 'Request Return' : 'Cancel Order'}</span>
              <h3 id="ac-cancel-title" className="ac-modal-h">
                No. {cancelTarget.id.slice(-8).toUpperCase()}
              </h3>
              <p className="ac-modal-sub">
                Please tell us why you wish to {isReturn ? 'return this order' : 'cancel'} — this helps us serve you better.
              </p>

              <div className="ac-modal-reasons">
                {reasons.map(r => (
                  <button
                    key={r}
                    type="button"
                    className={`ac-reason-chip ${cancelReason === r ? 'active' : ''}`}
                    onClick={() => setCancelReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                className="ac-modal-input"
                placeholder="Or write your own reason…"
                value={reasons.includes(cancelReason) ? '' : cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                rows={3}
                maxLength={500}
              />

              <div className="ac-modal-actions">
                <button
                  className="ac-btn-line"
                  onClick={() => { setCancelTarget(null); setCancelReason(""); }}
                  disabled={actingId === cancelTarget.id}
                >
                  Keep Order
                </button>
                {isReturn ? (
                  <button
                    className="ac-btn"
                    onClick={() => requestReturn(cancelTarget.id, cancelReason.trim())}
                    disabled={!cancelReason.trim() || actingId === cancelTarget.id}
                  >
                    {actingId === cancelTarget.id ? <span className="ac-mini-spin" /> : <RotateCcw size={13} />}
                    Request Return
                  </button>
                ) : (
                  <button
                    className="ac-btn ac-btn-danger"
                    onClick={() => cancelOrder(cancelTarget.id, cancelReason.trim())}
                    disabled={!cancelReason.trim() || actingId === cancelTarget.id}
                  >
                    {actingId === cancelTarget.id ? <span className="ac-mini-spin" /> : <X size={13} />}
                    Cancel Order
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

/* ─── SUB-VIEWS ──────────────────────────────────────────────── */

function OverviewView({ orders = [], appointments = [], totalSpent = 0, sinceYear = null, onNav }: any) {
  const latestOrder = orders[0];
  const nextAppt = appointments.find((a: any) => new Date(a.date) >= new Date());
  const canJoin = nextAppt && nextAppt.appointmentType === 'online' && nextAppt.status === 'confirmed' && nextAppt.meetingLink;

  return (
    <div className="ac-overview">
      <header className="ac-stage-head">
        <span className="ac-kick">Overview</span>
        <h2 className="ac-h2">Your collection at a glance</h2>
      </header>

      <div className="ac-spread">
        {/* Lead story — lifetime acquisitions */}
        <article className="ac-card ac-card-lead">
          <span className="ac-ghost-ix" aria-hidden="true">01</span>
          <span className="ac-kick">Lifetime Acquisitions</span>
          <span className="ac-lead-val"><Price value={totalSpent} /></span>
          <p className="ac-lead-sub">
            across {orders.length} {orders.length === 1 ? 'acquisition' : 'acquisitions'}
            {sinceYear ? ` since ${sinceYear}` : ''}
          </p>
          <button className="ac-card-link" onClick={() => onNav('orders')}>
            <span className="ac-ul">View Order Ledger</span> <ArrowRight size={14} />
          </button>
        </article>

        {/* Next consultation */}
        <article className="ac-card ac-card-appt">
          <span className="ac-kick">Next Consultation</span>
          {nextAppt ? (
            <>
              <div className="ac-na">
                <div className="ac-na-date">
                  <span className="ac-na-day">{new Date(nextAppt.date).getDate()}</span>
                  <span className="ac-na-mon">{new Date(nextAppt.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div className="ac-na-info">
                  <span className="ac-na-service">{nextAppt.service}</span>
                  <span className="ac-na-meta">
                    <Clock size={12} /> {nextAppt.time}
                    <i className="ac-na-sep" aria-hidden="true" />
                    {nextAppt.appointmentType === 'online' ? <Video size={12} /> : <Store size={12} />}
                    {nextAppt.appointmentType === 'online' ? 'Online' : 'In-Person'}
                  </span>
                </div>
              </div>
              {canJoin ? (
                <a href={nextAppt.meetingLink} target="_blank" rel="noopener noreferrer" className="ac-btn">
                  <Video size={13} /> Join Meeting
                </a>
              ) : (
                <button className="ac-btn-line" onClick={() => onNav('appointments')}>View Details</button>
              )}
            </>
          ) : (
            <div className="ac-card-empty">
              <p>No upcoming consultations.</p>
              <Link href="/appointments" className="ac-btn-line">Arrange a Consultation</Link>
            </div>
          )}
        </article>

        {/* Latest order */}
        <article className="ac-card ac-card-order">
          <span className="ac-kick">Latest Acquisition</span>
          {latestOrder ? (
            <>
              <div className="ac-lo-row">
                <span className="ac-lo-no">No. {latestOrder.id.slice(-8).toUpperCase()}</span>
                <span className="ac-leader" aria-hidden="true" />
                <span className="ac-lo-total"><PriceFrom value={latestOrder.total} from={(latestOrder.currency || 'INR')} /></span>
              </div>
              <div className="ac-lo-foot">
                <StatusMark status={latestOrder.status} />
                <Link href={`/order/success?order_id=${latestOrder.id}&view=account`} className="ac-card-link">
                  <span className="ac-ul">View Details</span> <ArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <div className="ac-card-empty">
              <p>No acquisitions yet.</p>
              <Link href="/collection" className="ac-btn-line">Explore the Collection</Link>
            </div>
          )}
        </article>

        {/* Client services — the page's single dark surface */}
        <article className="ac-card ac-card-dark">
          <span className="ac-kick on-dark">Client Services</span>
          <div className="ac-perks">
            <div className="ac-perk">
              <span className="ac-perk-ic"><Shield size={16} strokeWidth={1.6} /></span>
              <div>
                <h6>Insured Delivery</h6>
                <p>Complimentary insurance on every piece, door to door.</p>
              </div>
            </div>
            <div className="ac-perk">
              <span className="ac-perk-ic"><Gem size={16} strokeWidth={1.6} /></span>
              <div>
                <h6>Certified Authenticity</h6>
                <p>Verified certificates accompany all gemstones.</p>
              </div>
            </div>
          </div>
          <div className="ac-dark-links">
            <Link href="/appointments" className="ac-dark-link">Book a Consultation <ArrowRight size={14} /></Link>
            <Link href="/collection" className="ac-dark-link">Explore the Collection <ArrowRight size={14} /></Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function ProfileView({ user, onEdit, editingField, editValue, setEditValue, onSave, onCancel, saving }: any) {
  return (
    <div className="ac-profile">
      <header className="ac-stage-head">
        <span className="ac-kick">Profile</span>
        <h2 className="ac-h2">Personal details</h2>
      </header>
      <div className="ac-frows">
        {[
          { id: 'name', label: 'Full Name', value: user.name, icon: User },
          { id: 'email', label: 'Email Address', value: user.email, icon: Mail, locked: true },
          { id: 'phone', label: 'Phone', value: user.phone || 'Add phone number', icon: Phone },
        ].map((f, i) => (
          <div key={f.id} className="ac-frow" style={{ ['--i' as any]: i }}>
            <label className="ac-frow-lbl"><f.icon size={13} strokeWidth={1.8} /> {f.label}</label>
            {editingField === f.id ? (
              <div className="ac-frow-edit">
                <input
                  className="ac-input"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  autoFocus
                />
                <div className="ac-frow-actions">
                  <button className="ac-ibtn ac-ibtn-save" onClick={() => onSave(f.id, editValue)} disabled={saving} aria-label="Save">
                    {saving ? <span className="ac-mini-spin" /> : <Check size={16} />}
                  </button>
                  <button className="ac-ibtn" onClick={onCancel} aria-label="Cancel"><X size={16} /></button>
                </div>
              </div>
            ) : (
              <div className="ac-frow-display">
                <span className={`ac-frow-val ${!user[f.id] && f.id !== 'email' ? 'none' : ''}`}>{f.value}</span>
                {f.locked ? (
                  <span className="ac-frow-lock">Verified</span>
                ) : (
                  <button className="ac-frow-editbtn" onClick={() => onEdit(f.id, user[f.id] || '')} aria-label={`Edit ${f.label}`}>
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrdersView({ orders, loading, onCancel, onReturn, onRemove, actingId }: any) {
  if (loading) return <ViewLoading />;
  if (orders.length === 0) return <ViewEmpty icon={ShoppingBag} text="No acquisitions yet" link="/collection" linkText="Explore the Collection" />;

  return (
    <div className="ac-orders">
      <header className="ac-stage-head">
        <span className="ac-kick">Order Ledger</span>
        <h2 className="ac-h2">Your acquisitions</h2>
      </header>
      <div className="ac-ledger">
        {orders.map((o: any, i: number) => {
          const s = String(o.status || '').toLowerCase();
          const canCancel = ['pending', 'confirmed', 'processing'].includes(s);
          const canReturn = s === 'delivered';
          const canRemove = ['cancelled', 'canceled', 'refunded', 'returned'].includes(s);
          const busy = actingId === o.id;
          return (
            <div key={o.id} className="ac-orow" style={{ ['--i' as any]: Math.min(i, 8) }}>
              <div className="ac-orow-top">
                <span className="ac-ono">No. {o.id.slice(-8).toUpperCase()}</span>
                <span className="ac-odate">{new Date(o.createdAt).toLocaleDateString()}</span>
                <span className="ac-leader" aria-hidden="true" />
                <span className="ac-ototal"><PriceFrom value={o.total} from={(o.currency || 'INR')} /></span>
              </div>
              {o.isCustom && o.customTitle && (
                <div className="ac-otitle"><Gem size={11} /> {o.customTitle}</div>
              )}
              <div className="ac-orow-sub">
                <span className="ac-orow-marks">
                  <StatusMark status={o.status} />
                  {o.isCustom && !o.customTitle && <span className="ac-ocust"><Gem size={10} /> Custom</span>}
                </span>
                <span className="ac-row-actions">
                  {canCancel && (
                    <button className="ac-row-act err" onClick={() => onCancel(o)} disabled={busy}>
                      {busy ? <span className="ac-mini-spin dark" /> : <X size={12} />} Cancel Order
                    </button>
                  )}
                  {canReturn && (
                    <button className="ac-row-act" onClick={() => onReturn(o)} disabled={busy}>
                      {busy ? <span className="ac-mini-spin dark" /> : <RotateCcw size={12} />} Request Return
                    </button>
                  )}
                  {canRemove && (
                    <button className="ac-row-act err" onClick={() => onRemove(o.id)} disabled={busy} aria-label="Remove order">
                      {busy ? <span className="ac-mini-spin dark" /> : <Trash2 size={12} />} Remove
                    </button>
                  )}
                  <Link href={`/order/success?order_id=${o.id}&view=account`} className="ac-card-link">
                    <span className="ac-ul">View Details</span> <ArrowRight size={13} />
                  </Link>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentsView({ appts, loading, onCancel, onRemove, actingId }: any) {
  if (loading) return <ViewLoading />;
  if (appts.length === 0) return <ViewEmpty icon={Calendar} text="No consultations scheduled" link="/appointments" linkText="Arrange a Consultation" />;

  return (
    <div className="ac-appts">
      <header className="ac-stage-head">
        <span className="ac-kick">Engagement Diary</span>
        <h2 className="ac-h2">Your consultations</h2>
      </header>
      <div className="ac-diary">
        {appts.map((a: any, i: number) => {
          const isOnline = a.appointmentType === 'online';
          const s = String(a.status || '').toLowerCase();
          const canJoin = isOnline && s === 'confirmed' && a.meetingLink;
          const canCancel = ['pending', 'confirmed'].includes(s);
          const canRemove = ['cancelled', 'completed'].includes(s);
          const busy = actingId === a.id;
          return (
            <div key={a.id} className="ac-arow" style={{ ['--i' as any]: Math.min(i, 8) }}>
              <div className="ac-adate">
                <span className="ac-aday">{new Date(a.date).getDate()}</span>
                <span className="ac-amon">{new Date(a.date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="ac-ainfo">
                <span className="ac-aservice">{a.service}</span>
                <span className="ac-ameta">
                  {isOnline ? <Video size={12} /> : <Store size={12} />}
                  {isOnline ? 'Online' : 'In-Person'}
                  <i className="ac-na-sep" aria-hidden="true" />
                  <Clock size={12} /> {a.time}
                  <i className="ac-na-sep" aria-hidden="true" />
                  <StatusMark status={a.status} />
                </span>
              </div>
              <span className="ac-aacts">
                {canJoin && (
                  <a href={a.meetingLink} target="_blank" rel="noopener noreferrer" className="ac-btn ac-aact">
                    <Video size={13} /> Join
                  </a>
                )}
                {canCancel ? (
                  <button className="ac-row-act err ac-aact" onClick={() => onCancel(a.id)} disabled={busy}>
                    {busy ? <span className="ac-mini-spin dark" /> : <X size={12} />} Cancel
                  </button>
                ) : canRemove ? (
                  <button className="ac-row-act err ac-aact" onClick={() => onRemove(a.id)} disabled={busy} aria-label="Remove consultation">
                    {busy ? <span className="ac-mini-spin dark" /> : <Trash2 size={12} />} Remove
                  </button>
                ) : !canJoin && (
                  <Link href="/appointments" className="ac-btn-line ac-aact">Reschedule</Link>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SavedView({ blogs, loading, onUnsave }: any) {
  if (loading) return <ViewLoading />;
  if (blogs.length === 0) return <ViewEmpty icon={Bookmark} text="Nothing saved yet" link="/blog" linkText="Read the Journal" />;

  return (
    <div className="ac-saved">
      <header className="ac-stage-head">
        <span className="ac-kick">Reading Room</span>
        <h2 className="ac-h2">Saved from the journal</h2>
      </header>
      <div className="ac-sgrid">
        {blogs.map((b: any, i: number) => (
          <div key={b.id} className="ac-scard" style={{ ['--i' as any]: Math.min(i, 8) }}>
            <div className="ac-simg">
              {b.image_url ? <img src={b.image_url} alt="" /> : <div className="ac-sph" />}
              <button className="ac-sremove" onClick={() => onUnsave(b.id)} aria-label="Remove from saved"><X size={14} /></button>
            </div>
            <div className="ac-sbody">
              <h4 className="ac-stitle">{b.title}</h4>
              <Link href={`/blog/${b.slug}`} className="ac-card-link">
                <span className="ac-ul">Read Article</span> <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── UTILS ─────────────────────────────────────────────────── */

/* status dot + small-caps annotation — replaces pill chips */
function StatusMark({ status }: { status: string }) {
  const s = String(status || '').toLowerCase();
  const tone =
    ['delivered', 'completed', 'paid', 'confirmed'].includes(s) ? 'ok' :
    ['processing', 'pending', 'return_requested'].includes(s) ? 'warn' :
    ['cancelled', 'failed', 'returned'].includes(s) ? 'err' : '';
  return <span className={`ac-st ${tone}`}><i aria-hidden="true" />{String(status || '').replace(/_/g, ' ')}</span>;
}

function ViewLoading() {
  return <div className="ac-view-load"><span className="ac-spin" /></div>;
}

function ViewEmpty({ icon: Icon, text, link, linkText }: any) {
  return (
    <div className="ac-empty">
      <span className="ac-empty-ic"><Icon size={26} strokeWidth={1.4} /></span>
      <p>{text}</p>
      <Link href={link} className="ac-btn-line">{linkText}</Link>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="ac">
      <style>{CSS}</style>
      <HeaderMegaMenu />
      <div className="ac-loader">
        <span className="ac-spin" />
        <p>Preparing your account</p>
      </div>
      <Footer />
    </div>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────── */
const CSS = `
.ac{
  --bg:#FAF9F6;--paper:#FFFFFF;--tint:#F8F3EE;--soft:#F2EBE5;
  --ink:#2C231E;--body:#5A4F47;--mu:#8B7D71;
  --acc:#8F7A70;--accd:#6F5A4D;--accb:#A4897B;
  --ln:rgba(44,35,30,.12);--ln2:rgba(44,35,30,.22);--accln:rgba(143,122,112,.38);
  --ok:#4A6B57;--warn:#9C6A1E;--err:#B94040;
  --display:var(--font-main,'Bodoni Moda',Georgia,serif);
  --serif:var(--font-playfair,'Cormorant Garamond',Georgia,serif);
  --sans:var(--font-dmsans,'DM Sans',system-ui,sans-serif);
  --e:cubic-bezier(.22,1,.36,1);

  background:var(--bg);color:var(--ink);min-height:100vh;
  font-family:var(--sans);
}
.ac *{box-sizing:border-box;}
.ac button{font-family:var(--sans);}
.ac button:focus-visible,.ac a:focus-visible{outline:2px solid var(--acc);outline-offset:3px;}

/* ══ MAIN ══ */
.ac-main{
  max-width:1320px;margin:0 auto;
  padding:0 clamp(18px,4vw,64px) 96px;
}
/* clearance for the fixed mobile bottom pill-nav (60px + offset + safe area) */
@media(max-width:1023px){
  .ac-main{ padding-bottom:calc(110px + env(safe-area-inset-bottom,0px)); }
}

/* underline sweep — shared text-link mechanism */
.ac-ul{
  background-image:linear-gradient(currentColor,currentColor);
  background-repeat:no-repeat;background-size:0% 1px;background-position:0 100%;
  padding-bottom:2px;
  transition:background-size .45s var(--e);
}
a:hover .ac-ul,button:hover .ac-ul,.ac-ul:hover{ background-size:100% 1px; }

/* ══════════════════════════════════════════════════════════════
   MASTHEAD — light editorial folio
══════════════════════════════════════════════════════════════ */
.ac-mast{ position:relative; }
.ac-mast-rules{
  position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.55;
  background-image:linear-gradient(var(--ln) 1px,transparent 1px);
  background-size:100% clamp(52px,6.5vh,80px);
  -webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 22%,#000 78%,transparent 100%);
  mask-image:linear-gradient(180deg,transparent 0%,#000 22%,#000 78%,transparent 100%);
}

/* folio line */
.ac-folio{
  position:relative;z-index:1;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding-top:clamp(20px,3vw,34px);
}
.ac-eyebrow{
  display:inline-flex;align-items:center;gap:12px;
  font-size:10px;font-weight:700;letter-spacing:.34em;text-transform:uppercase;
  color:var(--acc);
}
.ac-eyebrow-dash{ width:clamp(26px,4vw,42px);height:1px;background:var(--accln); }
.ac-signout{
  display:inline-flex;align-items:center;gap:8px;
  min-height:44px;padding:0 4px;border:none;background:transparent;cursor:pointer;
  font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:var(--mu);transition:color .25s ease;
  -webkit-tap-highlight-color:transparent;
}
.ac-signout:hover{ color:var(--err); }

/* masthead grid */
.ac-mast-grid{
  position:relative;z-index:1;
  display:grid;grid-template-columns:minmax(0,1fr) auto;
  gap:clamp(24px,4.5vw,60px);align-items:end;
  padding:clamp(26px,4.5vw,54px) 0 clamp(24px,3.5vw,40px);
}
.ac-ghost{
  position:absolute;top:-10%;left:-8px;z-index:0;
  font-family:var(--display);font-weight:400;line-height:1;
  font-size:clamp(140px,20vw,260px);
  color:var(--acc);opacity:.08;
  pointer-events:none;user-select:none;
}
.ac-mast-text{ position:relative;z-index:1;min-width:0; }
.ac-h1{
  font-family:var(--display);font-weight:400;
  font-size:clamp(34px,5.2vw,62px);line-height:1.04;letter-spacing:-.015em;
  color:var(--ink);margin:0 0 16px;
}
.ac-h1 em{
  display:block;
  font-family:var(--serif);font-style:italic;font-weight:500;
  color:var(--accd);
}
.ac-meta{
  display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0;
  font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:clamp(15px,1.8vw,19px);color:var(--mu);
}
.ac-meta-mail{ display:inline-flex;align-items:center;gap:7px;word-break:break-all; }
.ac-meta-dot{ color:var(--accln); }

/* portrait — the whole frame is the upload button */
.ac-portrait-wrap{ position:relative;z-index:1;flex-shrink:0; }
.ac-portrait{
  position:relative;display:block;overflow:hidden;
  width:clamp(108px,13vw,158px);aspect-ratio:4/5;
  padding:0;border:1px solid var(--ln2);background:var(--tint);
  cursor:pointer;
  box-shadow:0 24px 55px -34px rgba(33,25,19,.45);
  transition:border-color .3s ease,box-shadow .35s var(--e);
  -webkit-tap-highlight-color:transparent;
}
.ac-portrait:hover{ border-color:var(--acc);box-shadow:0 30px 65px -34px rgba(33,25,19,.55); }
.ac-portrait::after{
  content:'';position:absolute;inset:7px;z-index:2;pointer-events:none;
  border:1px solid rgba(255,255,255,.38);
}
.ac-portrait-img{ width:100%;height:100%;object-fit:cover;display:block; }
.ac-portrait-ph{
  width:100%;height:100%;display:flex;align-items:center;justify-content:center;
  font-family:var(--display);font-size:clamp(36px,4.5vw,52px);font-weight:400;color:var(--acc);
}
.ac-portrait-veil{
  position:absolute;inset:0;z-index:3;
  display:flex;align-items:center;justify-content:center;
  background:rgba(44,35,30,.44);color:#fff;
  opacity:0;transition:opacity .3s ease;
}
.ac-portrait:hover .ac-portrait-veil,
.ac-portrait:focus-visible .ac-portrait-veil{ opacity:1; }
.ac-portrait:disabled{ cursor:default; }
.ac-portrait:disabled .ac-portrait-veil{ opacity:1; }
.ac-portrait-cap{
  display:block;margin-top:10px;text-align:center;
  font-size:8.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--mu);
}

/* stat rule */
.ac-stats{
  position:relative;z-index:1;
  display:grid;grid-template-columns:repeat(3,1fr);
  border-top:1px solid var(--ln2);border-bottom:1px solid var(--ln2);
}
.ac-stat{
  display:flex;flex-direction:column;align-items:center;gap:5px;
  padding:clamp(16px,2.4vw,26px) 8px;
  background:transparent;border:none;cursor:pointer;
  transition:background .3s var(--e);
  -webkit-tap-highlight-color:transparent;
}
.ac-stat + .ac-stat{ border-left:1px solid var(--ln); }
.ac-stat:hover{ background:var(--tint); }
.ac-stat-n{
  font-family:var(--display);font-weight:400;line-height:1;
  font-size:clamp(26px,3.4vw,42px);color:var(--ink);
}
.ac-stat-l{
  font-size:9px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;
  color:var(--mu);text-align:center;
}
.ac-dblrule{ height:3px;border-bottom:1px solid var(--ln);margin-top:2px; }

/* ══════════════════════════════════════════════════════════════
   BODY GRID · contents rail + stage
══════════════════════════════════════════════════════════════ */
.ac-grid{
  display:grid;grid-template-columns:clamp(200px,17vw,248px) minmax(0,1fr);
  gap:clamp(32px,4.5vw,64px);align-items:start;
  margin-top:clamp(30px,4vw,50px);
}
@media(max-width:1023px){ .ac-grid{ grid-template-columns:1fr;gap:22px;margin-top:0; } }

/* ── CONTENTS RAIL (desktop) / running-head strip (mobile) ── */
.ac-nav{
  position:sticky;top:160px;
  display:flex;flex-direction:column;
}
.ac-nav-k{
  font-size:9px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;
  color:var(--mu);padding-bottom:12px;border-bottom:1px solid var(--ln2);
}
.ac-nav-btn{
  position:relative;
  display:flex;align-items:center;gap:13px;
  min-height:52px;padding:0 4px 0 16px;
  background:transparent;border:none;border-bottom:1px solid var(--ln);
  cursor:pointer;text-align:left;
  -webkit-tap-highlight-color:transparent;
}
.ac-nav-ix{
  font-family:var(--serif);font-style:italic;font-size:14px;font-weight:500;
  color:var(--mu);transition:color .25s ease;
}
.ac-nav-lbl{
  font-size:10.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
  color:var(--mu);transition:color .25s ease;white-space:nowrap;
}
.ac-nav-ct{
  margin-left:auto;
  font-family:var(--serif);font-style:italic;font-size:13px;color:var(--mu);
  transition:color .25s ease;
}
.ac-nav-btn:hover .ac-nav-lbl{ color:var(--ink); }
.ac-nav-btn.active .ac-nav-lbl{ color:var(--ink); }
.ac-nav-btn.active .ac-nav-ix{ color:var(--acc); }
.ac-nav-btn.active .ac-nav-ct{ color:var(--acc); }
.ac-nav-ind{
  position:absolute;left:0;top:12px;bottom:12px;width:2px;
  background:var(--acc);
}

@media(max-width:1023px){
  .ac-nav{
    top:63px;z-index:40;
    flex-direction:row;align-items:stretch;gap:2px;
    overflow-x:auto;overflow-y:hidden;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;-ms-overflow-style:none;
    background:rgba(250,249,246,.92);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border-bottom:1px solid var(--ln2);
    margin:0 calc(-1*clamp(18px,4vw,64px));
    padding:0 clamp(18px,4vw,64px);
  }
  .ac-nav::-webkit-scrollbar{ display:none;height:0; }
  .ac-nav-k{ display:none; }
  .ac-nav-btn{
    flex:0 0 auto;min-height:50px;padding:0 14px;
    border-bottom:none;
  }
  .ac-nav-ix{ display:none; }
  .ac-nav-ct{ display:none; }
  .ac-nav-ind{
    left:12px;right:12px;top:auto;bottom:0;
    width:auto;height:2px;
  }
}

/* ══ STAGE ══ */
.ac-stage{ min-width:0; }
@media(max-width:1023px){ .ac-stage{ padding-top:6px; } }
.ac-stage-head{ margin-bottom:clamp(22px,3vw,34px); }
.ac-h2{
  font-family:var(--serif);font-weight:500;
  font-size:clamp(26px,3.2vw,38px);line-height:1.08;letter-spacing:-.01em;
  margin:10px 0 0;color:var(--ink);
}

/* kicker — micro-label with hairline dash */
.ac-kick{
  display:inline-flex;align-items:center;gap:10px;
  font-size:9.5px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;
  color:var(--acc);
}
.ac-kick::before{ content:'';width:26px;height:1px;background:var(--accln);flex-shrink:0; }
.ac-kick.on-dark{ color:#C7AE9C; }
.ac-kick.on-dark::before{ background:rgba(199,174,156,.45); }

/* ══════════════════════════════════════════════════════════════
   OVERVIEW SPREAD
══════════════════════════════════════════════════════════════ */
.ac-spread{
  display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(14px,2vw,24px);
}
.ac-card{
  position:relative;overflow:hidden;
  background:var(--paper);border:1px solid var(--ln);
  padding:clamp(22px,2.6vw,32px);
  display:flex;flex-direction:column;gap:16px;
  transition:border-color .3s ease,transform .35s var(--e),box-shadow .35s var(--e);
}
.ac-card:hover{
  border-color:var(--accln);transform:translateY(-2px);
  box-shadow:0 30px 70px -38px rgba(33,25,19,.4);
}
.ac-card-lead{ grid-column:span 7; }
.ac-card-appt{ grid-column:span 5; }
.ac-card-order{ grid-column:span 7; }
.ac-card-dark{ grid-column:span 5; }
@media(max-width:1023px){
  .ac-card-lead{ grid-column:span 12; }
  .ac-card-appt{ grid-column:span 6; }
  .ac-card-order{ grid-column:span 6; }
  .ac-card-dark{ grid-column:span 12; }
}
@media(max-width:680px){
  .ac-card-lead,.ac-card-appt,.ac-card-order,.ac-card-dark{ grid-column:span 12; }
}

.ac-ghost-ix{
  position:absolute;top:-14px;right:6px;z-index:0;
  font-family:var(--display);font-size:clamp(80px,9vw,124px);line-height:1;
  color:var(--acc);opacity:.09;pointer-events:none;user-select:none;
}
.ac-card > *{ position:relative;z-index:1; }

.ac-lead-val{
  font-family:var(--display);font-weight:400;line-height:1;
  font-size:clamp(36px,4.4vw,56px);color:var(--ink);
}
.ac-lead-sub{
  margin:0;font-family:var(--serif);font-style:italic;font-weight:500;
  font-size:clamp(15px,1.7vw,18px);color:var(--mu);
}
.ac-card-link{
  margin-top:auto;padding:0;
  display:inline-flex;align-items:center;gap:9px;
  background:transparent;border:none;cursor:pointer;
  font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--accd);text-decoration:none;
  transition:color .2s ease,gap .25s var(--e);
  min-height:24px;
}
.ac-card-link:hover{ color:var(--ink);gap:13px; }
.ac-card-empty{
  display:flex;flex-direction:column;gap:16px;align-items:flex-start;flex:1;justify-content:center;
}
.ac-card-empty p{
  margin:0;font-family:var(--serif);font-style:italic;font-size:17px;color:var(--mu);
}

/* buttons */
.ac-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  min-height:46px;padding:0 26px;
  background:var(--acc);color:#fff;border:1px solid var(--acc);cursor:pointer;
  font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  text-decoration:none;
  box-shadow:0 18px 40px -20px rgba(44,35,30,.45);
  transition:background .3s var(--e),border-color .3s ease,transform .25s var(--e);
  -webkit-tap-highlight-color:transparent;
  align-self:flex-start;
}
.ac-btn:hover{ background:var(--accd);border-color:var(--accd);transform:translateY(-1px); }
.ac-btn-line{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  min-height:46px;padding:0 24px;
  background:transparent;color:var(--ink);border:1px solid var(--ln2);cursor:pointer;
  font-family:var(--sans);font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  text-decoration:none;
  transition:border-color .3s ease,color .2s ease,background .3s var(--e);
  -webkit-tap-highlight-color:transparent;
  align-self:flex-start;
}
.ac-btn-line:hover{ border-color:var(--acc);color:var(--accd);background:var(--tint); }

/* next consultation */
.ac-na{ display:flex;align-items:center;gap:clamp(16px,2vw,22px);flex:1; }
.ac-na-date{
  flex-shrink:0;text-align:center;
  padding-right:clamp(16px,2vw,22px);border-right:1px solid var(--ln2);
}
.ac-na-day{
  display:block;font-family:var(--display);font-weight:400;line-height:1;
  font-size:clamp(32px,3.6vw,44px);color:var(--ink);
}
.ac-na-mon{
  display:block;margin-top:4px;
  font-family:var(--serif);font-style:italic;font-size:14px;font-weight:500;color:var(--acc);
}
.ac-na-info{ min-width:0;display:flex;flex-direction:column;gap:8px; }
.ac-na-service{ font-family:var(--serif);font-size:clamp(18px,2vw,21px);font-weight:600;color:var(--ink); }
.ac-na-meta{
  display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap;
  font-size:11px;font-weight:500;color:var(--mu);
}
.ac-na-sep{ width:3px;height:3px;border-radius:50%;background:var(--accln);margin:0 3px; }

/* latest order strip */
.ac-lo-row{ display:flex;align-items:baseline;gap:12px; }
.ac-lo-no{
  font-family:var(--serif);font-style:italic;font-size:clamp(19px,2vw,23px);font-weight:500;color:var(--ink);
  white-space:nowrap;
}
.ac-lo-total{
  font-family:var(--display);font-size:clamp(19px,2vw,23px);font-weight:400;color:var(--ink);
  white-space:nowrap;
}
.ac-leader{
  flex:1;min-width:18px;align-self:center;
  border-bottom:1px dotted rgba(44,35,30,.32);
  transform:translateY(-3px);
}
.ac-lo-foot{
  display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;
  margin-top:auto;
}

/* status mark — dot + small caps annotation */
.ac-st{
  display:inline-flex;align-items:center;gap:7px;
  font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:var(--mu);
}
.ac-st i{ width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0; }
.ac-st.ok{ color:var(--ok); }
.ac-st.warn{ color:var(--warn); }
.ac-st.err{ color:var(--err); }

/* dark client-services card */
.ac-card-dark{
  background:linear-gradient(135deg,rgba(44,35,30,.97),rgba(111,90,77,.9) 52%,rgba(28,22,17,.97));
  border-color:rgba(143,122,112,.4);color:#F5F0E8;
}
.ac-card-dark:hover{ border-color:rgba(199,174,156,.55); }
.ac-perks{ display:flex;flex-direction:column;gap:18px; }
.ac-perk{ display:flex;gap:14px;align-items:flex-start; }
.ac-perk-ic{
  flex-shrink:0;width:40px;height:40px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:#C7AE9C;
}
.ac-perk h6{ font-family:var(--serif);font-size:17px;font-weight:600;margin:0 0 3px;color:#F5F0E8; }
.ac-perk p{ font-size:11.5px;line-height:1.55;font-weight:300;color:rgba(245,240,232,.62);margin:0; }
.ac-dark-links{ margin-top:auto;display:flex;flex-direction:column; }
.ac-dark-link{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  min-height:48px;border-top:1px solid rgba(255,255,255,.14);
  font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:#F5F0E8;text-decoration:none;
  transition:color .25s ease,padding-left .3s var(--e);
}
.ac-dark-link:hover{ color:#C7AE9C;padding-left:6px; }

/* ══════════════════════════════════════════════════════════════
   PROFILE — definition rows
══════════════════════════════════════════════════════════════ */
.ac-frows{
  background:var(--paper);border:1px solid var(--ln);
  padding:6px clamp(20px,2.6vw,32px);
}
.ac-frow{
  display:grid;grid-template-columns:minmax(150px,210px) 1fr;
  align-items:center;gap:18px;
  min-height:76px;padding:18px 0;
  border-bottom:1px solid var(--ln);
}
.ac-frow:last-child{ border-bottom:none; }
.ac-frow-lbl{
  display:inline-flex;align-items:center;gap:8px;
  font-size:9.5px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;
  color:var(--mu);
}
.ac-frow-lbl svg{ color:var(--acc); }
.ac-frow-display{ display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0; }
.ac-frow-val{
  font-family:var(--serif);font-size:clamp(18px,2vw,23px);font-weight:500;color:var(--ink);
  word-break:break-word;min-width:0;
}
.ac-frow-val.none{ color:var(--mu);font-style:italic; }
.ac-frow-lock{
  flex-shrink:0;
  font-family:var(--serif);font-style:italic;font-size:13px;color:var(--mu);
}
.ac-frow-editbtn{
  flex-shrink:0;
  display:inline-flex;align-items:center;gap:7px;
  min-height:44px;padding:0 12px;
  background:transparent;border:none;cursor:pointer;
  font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;
  color:var(--accd);transition:color .2s ease;
  -webkit-tap-highlight-color:transparent;
}
.ac-frow-editbtn:hover{ color:var(--ink); }

.ac-frow-edit{ display:flex;gap:12px;align-items:center;min-width:0; }
.ac-input{
  flex:1;min-width:0;
  border:none;border-bottom:1px solid var(--ln2);outline:none;
  background-color:transparent;
  background-image:linear-gradient(var(--acc),var(--acc));
  background-repeat:no-repeat;background-size:0% 2px;background-position:0 100%;
  font-family:var(--serif);font-size:clamp(18px,2vw,21px);font-weight:500;color:var(--ink);
  padding:8px 2px;
  transition:background-size .45s var(--e);
}
.ac-input:focus{ background-size:100% 2px; }
.ac-frow-actions{ display:flex;gap:8px;flex-shrink:0; }
.ac-ibtn{
  width:44px;height:44px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  background:transparent;border:1px solid var(--ln2);color:var(--mu);
  transition:border-color .25s ease,color .2s ease,background .25s var(--e);
  -webkit-tap-highlight-color:transparent;
}
.ac-ibtn:hover{ border-color:var(--err);color:var(--err); }
.ac-ibtn-save{ background:var(--acc);border-color:var(--acc);color:#fff; }
.ac-ibtn-save:hover{ background:var(--accd);border-color:var(--accd);color:#fff; }
.ac-ibtn-save:disabled{ opacity:.7;cursor:default; }

@media(max-width:640px){
  .ac-frow{ grid-template-columns:1fr;gap:10px;padding:16px 0; }
}

/* ══════════════════════════════════════════════════════════════
   ORDER LEDGER
══════════════════════════════════════════════════════════════ */
.ac-ledger{
  background:var(--paper);border:1px solid var(--ln);
  padding:4px clamp(20px,2.6vw,32px);
}
.ac-orow{
  display:flex;flex-direction:column;gap:12px;
  padding:22px 0;border-bottom:1px solid var(--ln);
}
.ac-orow:last-child{ border-bottom:none; }
.ac-orow-top{ display:flex;align-items:baseline;gap:12px;min-width:0; }
.ac-ono{
  font-family:var(--serif);font-style:italic;font-size:clamp(17px,2vw,21px);font-weight:500;color:var(--ink);
  white-space:nowrap;
}
.ac-odate{
  font-size:9px;font-weight:600;letter-spacing:.12em;color:var(--mu);
  white-space:nowrap;
}
.ac-ototal{
  font-family:var(--display);font-size:clamp(17px,2vw,21px);font-weight:400;color:var(--ink);
  white-space:nowrap;
}
.ac-otitle{
  display:inline-flex;align-items:center;gap:7px;
  font-family:var(--serif);font-size:16px;font-weight:500;color:var(--body);
}
.ac-otitle svg{ color:var(--acc);flex-shrink:0; }
.ac-orow-sub{
  display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;
}
.ac-orow-marks{ display:inline-flex;align-items:center;gap:14px; }
.ac-row-actions{ display:inline-flex;align-items:center;gap:16px;flex-wrap:wrap; }
.ac-row-act{
  display:inline-flex;align-items:center;gap:7px;
  min-height:32px;padding:0 4px;
  background:transparent;border:none;cursor:pointer;
  font-family:var(--sans);font-size:9.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;
  color:var(--mu);transition:color .2s ease;
  -webkit-tap-highlight-color:transparent;
}
.ac-row-act.err:hover{ color:var(--err); }
.ac-row-act:disabled{ opacity:.55;cursor:default; }
.ac-mini-spin.dark{ border-color:rgba(44,35,30,.25);border-top-color:var(--ink); }

/* ══ CANCEL-ORDER DIALOG ══ */
.ac-modal-veil{
  position:fixed;inset:0;z-index:90;
  display:flex;align-items:center;justify-content:center;
  background:rgba(44,35,30,.45);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  padding:20px;
}
.ac-modal{
  width:min(480px,100%);
  background:var(--paper);border:1px solid var(--ln2);
  padding:clamp(24px,3.5vw,36px);
  display:flex;flex-direction:column;gap:16px;
  box-shadow:0 40px 90px -30px rgba(33,25,19,.5);
  max-height:calc(100vh - 40px);overflow-y:auto;
}
.ac-modal-h{
  font-family:var(--serif);font-weight:500;
  font-size:clamp(22px,2.6vw,28px);line-height:1.1;
  margin:0;color:var(--ink);
}
.ac-modal-sub{
  margin:0;font-family:var(--serif);font-style:italic;
  font-size:15px;color:var(--mu);line-height:1.5;
}
.ac-modal-reasons{ display:flex;flex-wrap:wrap;gap:8px; }
.ac-reason-chip{
  padding:9px 14px;cursor:pointer;
  background:transparent;border:1px solid var(--ln2);color:var(--body);
  font-family:var(--sans);font-size:11px;font-weight:500;letter-spacing:.04em;
  transition:border-color .25s ease,color .2s ease,background .25s var(--e);
  -webkit-tap-highlight-color:transparent;
}
.ac-reason-chip:hover{ border-color:var(--acc);color:var(--accd); }
.ac-reason-chip.active{ background:var(--acc);border-color:var(--acc);color:#fff; }
.ac-modal-input{
  width:100%;resize:vertical;min-height:64px;
  border:1px solid var(--ln2);outline:none;background:transparent;
  font-family:var(--sans);font-size:13px;color:var(--ink);line-height:1.5;
  padding:12px 14px;
  transition:border-color .25s ease;
}
.ac-modal-input:focus{ border-color:var(--acc); }
.ac-modal-actions{
  display:flex;justify-content:flex-end;gap:12px;flex-wrap:wrap;margin-top:4px;
}
.ac-btn:disabled{ opacity:.55;cursor:default;transform:none; }
.ac-btn-danger{ background:var(--err);border-color:var(--err); }
.ac-btn-danger:hover{ background:#9C3232;border-color:#9C3232; }
.ac-btn-danger:disabled{ opacity:.55;cursor:default;transform:none; }
.ac-ocust{
  display:inline-flex;align-items:center;gap:5px;
  font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--acc);
}
@media(max-width:480px){
  .ac-odate{ display:none; }
}

/* ══════════════════════════════════════════════════════════════
   ENGAGEMENT DIARY
══════════════════════════════════════════════════════════════ */
.ac-diary{
  background:var(--paper);border:1px solid var(--ln);
  padding:4px clamp(20px,2.6vw,32px);
}
.ac-arow{
  display:flex;align-items:center;gap:clamp(16px,2.5vw,26px);
  padding:20px 0;border-bottom:1px solid var(--ln);
}
.ac-arow:last-child{ border-bottom:none; }
.ac-adate{
  flex-shrink:0;width:60px;text-align:center;
  padding-right:clamp(14px,2vw,22px);border-right:1px solid var(--ln2);
}
.ac-aday{
  display:block;font-family:var(--display);font-weight:400;line-height:1;
  font-size:clamp(26px,3vw,34px);color:var(--ink);
}
.ac-amon{
  display:block;margin-top:3px;
  font-family:var(--serif);font-style:italic;font-size:13px;font-weight:500;color:var(--acc);
}
.ac-ainfo{ flex:1;min-width:0;display:flex;flex-direction:column;gap:7px; }
.ac-aservice{ font-family:var(--serif);font-size:clamp(17px,2vw,21px);font-weight:600;color:var(--ink); }
.ac-ameta{
  display:inline-flex;align-items:center;gap:7px;flex-wrap:wrap;
  font-size:11px;font-weight:500;color:var(--mu);
}
.ac-aact{ flex-shrink:0; }
.ac-aacts{ display:inline-flex;align-items:center;gap:12px;flex-shrink:0;flex-wrap:wrap; }
@media(max-width:560px){
  .ac-arow{ flex-wrap:wrap; }
  .ac-aacts{ width:100%;margin-top:2px; }
  .ac-btn.ac-aact,.ac-btn-line.ac-aact{ align-self:stretch;flex:1; }
}

/* ══════════════════════════════════════════════════════════════
   READING ROOM
══════════════════════════════════════════════════════════════ */
.ac-sgrid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));
  gap:clamp(16px,2.5vw,28px);
}
.ac-scard{
  background:var(--paper);border:1px solid var(--ln);overflow:hidden;
  display:flex;flex-direction:column;
  transition:border-color .3s ease,transform .35s var(--e),box-shadow .35s var(--e);
}
.ac-scard:hover{
  border-color:var(--accln);transform:translateY(-3px);
  box-shadow:0 30px 70px -38px rgba(33,25,19,.45);
}
.ac-simg{ position:relative;aspect-ratio:3/2;overflow:hidden;background:var(--tint); }
.ac-simg img{
  width:100%;height:100%;object-fit:cover;display:block;
  filter:grayscale(1) contrast(1.03);
  transition:filter 1s ease,transform 1.2s var(--e);
}
.ac-scard:hover .ac-simg img{ filter:grayscale(0) contrast(1);transform:scale(1.04); }
.ac-sph{ width:100%;height:100%;background:linear-gradient(135deg,var(--tint),var(--soft)); }
.ac-sremove{
  position:absolute;top:10px;right:10px;
  width:38px;height:38px;border-radius:50%;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.92);border:1px solid var(--ln);color:var(--err);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  box-shadow:0 6px 16px -6px rgba(44,35,30,.35);
  transition:background .25s var(--e),color .2s ease;
  -webkit-tap-highlight-color:transparent;
}
.ac-sremove:hover{ background:var(--err);color:#fff;border-color:var(--err); }
.ac-sbody{ padding:clamp(16px,2vw,22px);display:flex;flex-direction:column;gap:14px;flex:1; }
.ac-stitle{
  font-family:var(--serif);font-size:18px;font-weight:600;line-height:1.35;color:var(--ink);
  margin:0;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.ac-sbody .ac-card-link{ margin-top:auto; }

/* ══════════════════════════════════════════════════════════════
   STATES
══════════════════════════════════════════════════════════════ */
.ac-spin{
  display:block;width:30px;height:30px;border-radius:50%;
  border:2px solid var(--ln2);border-top-color:var(--acc);
  animation:acSpin .8s linear infinite;
}
@keyframes acSpin{ to{ transform:rotate(360deg); } }
.ac-mini-spin{
  display:block;width:16px;height:16px;border-radius:50%;
  border:2px solid rgba(255,255,255,.45);border-top-color:#fff;
  animation:acSpin .65s linear infinite;
}

.ac-view-load{ padding:90px 20px;display:flex;justify-content:center; }

.ac-empty{
  padding:clamp(50px,8vw,86px) 24px;text-align:center;
  background:var(--paper);border:1px solid var(--ln);
  display:flex;flex-direction:column;align-items:center;gap:18px;
}
.ac-empty-ic{
  width:60px;height:60px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:var(--tint);border:1px solid var(--ln);color:var(--acc);
}
.ac-empty p{ font-family:var(--serif);font-style:italic;font-size:20px;color:var(--mu);margin:0; }
.ac-empty .ac-btn-line{ align-self:center;margin-top:4px; }

.ac-loader{
  min-height:50vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;
  padding:80px 20px;
}
.ac-loader p{ font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--mu); }
@media(max-width:1023px){ .ac-loader{ padding-bottom:calc(110px + env(safe-area-inset-bottom,0px)); } }

/* ══ STAGGER REVEAL ══ */
.ac-orow,.ac-arow,.ac-scard,.ac-frow{
  animation:acIn .5s var(--e) both;
  animation-delay:calc(var(--i,0)*50ms);
}
@keyframes acIn{
  from{ opacity:0;transform:translateY(12px); }
  to{ opacity:1;transform:none; }
}

/* ══ MASTHEAD RESPONSIVE ══ */
@media(max-width:640px){
  .ac-mast-grid{
    grid-template-columns:1fr;
    justify-items:center;text-align:center;
    gap:26px;padding:clamp(22px,5vw,32px) 0 26px;
  }
  .ac-portrait-wrap{ order:-1; }
  .ac-portrait{ width:96px; }
  .ac-meta{ justify-content:center; }
  .ac-ghost{ left:50%;transform:translateX(-50%);top:-6%; }
  .ac-h1 em{ display:inline;margin-left:10px; }
}
@media(max-width:400px){
  .ac-stat-l{ letter-spacing:.16em; }
}

/* ══ REDUCED MOTION ══ */
@media(prefers-reduced-motion:reduce){
  .ac *,.ac *::before,.ac *::after{
    animation-duration:.01ms!important;transition-duration:.01ms!important;
  }
  .ac-spin,.ac-mini-spin{ animation-duration:.8s!important; }
  .ac-orow,.ac-arow,.ac-scard,.ac-frow{ animation:none; }
}
`
