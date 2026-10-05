'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Calendar, FileText,
  Users, LogOut, Boxes, ChevronDown, BarChart3, ChevronLeft,
  MessageSquare, Tag, Diamond, Menu, X, Mail, Quote, Instagram,
  Image as ImageIcon, ReceiptText, Heading, CreditCard, Gem, Gift, Hammer, Leaf, Wrench,
  ShieldCheck, Truck, RefreshCw, Phone, Info
} from 'lucide-react';

import {
  getSettings, fetchAndSyncSettings, SiteSettings
} from '@/lib/authStore';

const MAIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: 'orders' },
  { href: '/admin/custom-payments', label: 'Custom Payments', icon: CreditCard },
  { href: '/admin/custom-orders', label: 'Custom Orders', icon: Gem, badge: 'customOrders' },
  { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
  { href: '/admin/offline-sales', label: 'Offline Sales', icon: FileText, badge: 'offline' },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar, badge: 'appts' },
  { href: '/admin/messaging', label: 'Messaging', icon: MessageSquare, badge: 'msgs' },
  { href: '/admin/site-analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
  { href: '/admin/hero', label: 'Hero Section', icon: LayoutDashboard },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/instagram-feed', label: 'Shop the Feed', icon: Instagram },
  { href: '/admin/gift-guide', label: 'Gift Guide', icon: Gift },
  { href: '/admin/craftsmanship', label: 'Craftsmanship', icon: Hammer },
  { href: '/admin/about', label: 'About Page', icon: Info },
  { href: '/admin/sustainability', label: 'Sustainability', icon: Leaf },
  { href: '/admin/repairs', label: 'Repairs', icon: Wrench },
  { href: '/admin/contact-us', label: 'Contact Us', icon: Phone },
  { href: '/admin/privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { href: '/admin/terms', label: 'Terms & Conditions', icon: FileText },
  { href: '/admin/shipping', label: 'Shipping Policy', icon: Truck },
  { href: '/admin/returns', label: 'Returns & Exchanges', icon: RefreshCw },
  { href: '/admin/img-gallery', label: 'Image Gallery', icon: ImageIcon },
  { href: '/admin/header', label: 'Header & Mega Menu', icon: Heading },
  { href: '/admin/settings', label: 'Site Settings', icon: Diamond },
];

const SUB_LINKS = [
  { href: '/admin/styles', label: 'Rings by Style' },
  { href: '/admin/diamond-shapes', label: 'Diamond Shapes' },
  { href: '/admin/metal-options', label: 'Metal Options' },
  { href: '/admin/size-options', label: 'Size Options' },
  { href: '/admin/carat-options', label: 'Carat Options' },
  { href: '/admin/ring-size-guide', label: 'Ring Size Guide' },
];

const REPORT_LINKS = [
  { href: '/admin/reports/ledger', label: 'Sales Ledger' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [msgs, setMsgs] = useState(0);
  const [orders, setOrders] = useState(0);
  const [appts, setAppts] = useState(0);
  const [offline, setOffline] = useState(0);
  const [customOrders, setCustomOrders] = useState(0);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [repOpen, setRepOpen] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    fetchAndSyncSettings().then(s => { if (s) setSettings(s); });
    const fn = (e: any) => setSettings(e?.detail?.settings ?? getSettings());
    window.addEventListener('settings-updated', fn as EventListener);
    return () => window.removeEventListener('settings-updated', fn as EventListener);
  }, []);

  useEffect(() => {
    setSubOpen(
      pathname.startsWith('/admin/styles') ||
      pathname.startsWith('/admin/diamond-shapes') ||
      pathname.startsWith('/admin/metal-options') ||
      pathname.startsWith('/admin/size-options') ||
      pathname.startsWith('/admin/carat-options') ||
      pathname.startsWith('/admin/ring-size-guide')
    );
    setRepOpen(pathname.startsWith('/admin/reports'));
  }, [pathname]);

  useEffect(() => { setMobOpen(false); }, [pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = mobOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobOpen]);

  useEffect(() => {
    let alive = true;
    import('@/lib/supabase').then(({ supabase }) =>
      supabase.auth.getUser().then(({ data }) => { if (alive) setEmail(data.user?.email ?? null); })
    ).catch(() => { });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadAll = async () => {
      if (!alive || document.hidden) return;
      try {
        const [uRes, sRes] = await Promise.all([
          fetch('/api/messages/unread-count', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
          fetch('/api/admin/sidebar-counts', { cache: 'no-store' }).then(r => r.json()).catch(() => ({}))
        ]);
        if (!alive) return;
        setMsgs(Number(uRes?.count || 0));
        setOrders(Number(sRes?.orders || 0));
        setAppts(Number(sRes?.appointments || 0));
        setOffline(Number(sRes?.offlineSales || 0));
        setCustomOrders(Number(sRes?.customOrders || 0));
      } catch { }
    };
    loadAll();
    const t = setInterval(loadAll, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const logout = async () => {
    setSigning(true);
    try { const { supabase } = await import('@/lib/supabase'); await supabase.auth.signOut(); } catch { }
    try { localStorage.removeItem('isAdmin'); } catch { }
    router.replace('/admin/login');
    setSigning(false);
  };

  const badgeMap: Record<string, number> = { msgs, orders, appts, offline, customOrders };
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (href !== '/admin' && pathname.startsWith(href));

  const initials = email ? email[0].toUpperCase() : 'A';
  const compact = collapsed && !mobOpen;
  const subActive = SUB_LINKS.some(s => pathname.startsWith(s.href));
  const repActive = pathname.startsWith('/admin/reports');

  return (
    <>
      <style>{`
        .asb{ --w:264px; --wc:76px; }
        .asb-aside{ font-family:var(--font-dmsans); }
        .asb-row{
          position:relative; display:flex; align-items:center; gap:12px;
          padding:9px 12px; border-radius:10px; cursor:pointer; text-decoration:none;
          color:var(--c-text-muted);
          transition:background-color .18s ease, color .18s ease;
        }
        .asb-row::before{
          content:''; position:absolute; left:-12px; top:50%; transform:translateY(-50%);
          width:3px; height:0; background:var(--c-accent); border-radius:0 3px 3px 0;
          transition:height .22s cubic-bezier(.22,1,.36,1);
        }
        .asb-row:hover{ background:var(--c-surface); color:var(--c-text); }
        .asb-row.is-active{ background:var(--c-accent-soft); color:var(--c-accent); }
        .asb-row.is-active::before{ height:20px; }
        .asb-label{ font-size:12.5px; font-weight:500; letter-spacing:.01em; white-space:nowrap; }
        .asb-badge{
          margin-left:auto; min-width:20px; height:20px; padding:0 6px;
          display:inline-flex; align-items:center; justify-content:center;
          background:var(--c-accent); color:#fff; border-radius:999px;
          font-size:10.5px; font-weight:700;
        }
        .asb-dot{ position:absolute; top:6px; right:7px; width:7px; height:7px; border-radius:50%; background:var(--c-accent); }
        .asb-sec{
          padding:0 12px; margin:18px 0 7px;
          font-size:9.5px; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          color:var(--c-text-faint);
        }
        .asb-sub{
          display:flex; align-items:center; gap:9px; padding:7px 12px 7px 14px;
          border-radius:9px; text-decoration:none; color:var(--c-text-muted);
          font-size:12px; font-weight:500; transition:color .15s, background-color .15s;
        }
        .asb-sub:hover{ color:var(--c-text); background:var(--c-surface); }
        .asb-sub.is-active{ color:var(--c-accent); }
        .asb-sub-dot{ width:5px; height:5px; border-radius:50%; background:currentColor; opacity:.55; flex-shrink:0; }
        .asb-toggle{ transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .asb-toggle:hover{ border-color:rgba(143,122,112,.5) !important; box-shadow:var(--shadow-md); }
        .asb-logout{ transition:background-color .18s ease, border-color .18s ease, color .18s ease; }
        .asb-logout:hover{ background:var(--c-danger-bg) !important; border-color:rgba(192,69,59,.4) !important; }
        .asb-aside ::-webkit-scrollbar{ width:6px; }
        .asb-aside ::-webkit-scrollbar-thumb{ background:rgba(143,122,112,.22); border-radius:999px; }
      `}</style>

      {/* Mobile toggle */}
      <button
        onClick={() => setMobOpen(v => !v)}
        className="asb-toggle md:hidden fixed top-4 right-4 z-[1001] flex items-center justify-center w-11 h-11 rounded-xl"
        style={{ backgroundColor: 'var(--c-bg)', border: '1px solid var(--c-border)', color: 'var(--c-accent)', boxShadow: 'var(--shadow-md)' }}
        aria-label="Toggle menu"
      >
        {mobOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-[998] transition-opacity duration-300 ${mobOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(44,35,30,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={() => setMobOpen(false)}
      />

      <div
        className={`asb ${compact ? 'w-[76px]' : 'w-[264px]'} flex-shrink-0 h-screen sticky top-0 z-[1000] transition-all duration-300 ease-in-out
          max-md:fixed max-md:left-0 max-md:top-0 ${mobOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
      >
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="asb-toggle hidden md:flex absolute -right-3.5 top-7 items-center justify-center w-7 h-7 rounded-full cursor-pointer z-10"
          style={{ backgroundColor: 'var(--c-bg)', border: '1px solid var(--c-border)', color: 'var(--c-accent)', boxShadow: 'var(--shadow-sm)' }}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease' }} />
        </button>

        <aside
          className={`asb-aside flex flex-col h-full overflow-hidden transition-all duration-300 ${compact ? 'w-[76px]' : 'w-[264px]'} ${mobOpen ? '!w-[264px]' : ''}`}
          style={{ backgroundColor: 'var(--c-surface)', borderRight: '1px solid var(--c-border)' }}
        >
          {/* Brand */}
          <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--c-border)' }}>
            {compact ? (
              <div className="flex items-center justify-center">
                <Diamond size={22} style={{ color: 'var(--c-accent)' }} />
              </div>
            ) : (
              <Link href="/admin" className="block no-underline">
                {settings?.logo_url ? (
                  <img src={settings.logo_url} alt={settings.site_name || 'Logo'} style={{ maxHeight: '42px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'var(--c-accent-soft)', border: '1px solid var(--c-border)' }}>
                      <Diamond size={17} style={{ color: 'var(--c-accent)' }} />
                    </div>
                    <div>
                      <div className="text-[15px] tracking-[0.22em] uppercase leading-none" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-main)', fontWeight: 400 }}>
                        ATELIER <em style={{ fontStyle: 'italic', color: 'var(--c-accent)' }}>FINE</em>
                      </div>
                      <div className="mt-1 text-[9px] tracking-[0.3em] uppercase" style={{ color: 'var(--c-text-muted)' }}>Admin Panel</div>
                    </div>
                  </div>
                )}
              </Link>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
            {!compact && <div className="asb-sec">Main</div>}
            {MAIN_LINKS.map(link => {
              const Icon = link.icon;
              const badge = (link as any).badge ? badgeMap[(link as any).badge] : 0;
              const active = isActive(link.href, (link as any).exact);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`asb-row ${active ? 'is-active' : ''} ${compact ? 'justify-center' : ''} mb-0.5`}
                  title={compact ? link.label : undefined}
                >
                  <Icon size={18} strokeWidth={1.6} style={{ flexShrink: 0 }} />
                  {!compact && <span className="asb-label">{link.label}</span>}
                  {badge > 0 && !compact && <span className="asb-badge">{badge}</span>}
                  {badge > 0 && compact && <span className="asb-dot" />}
                </Link>
              );
            })}

            {/* Catalogue options */}
            {!compact && <div className="asb-sec">Catalogue</div>}
            <div
              className={`asb-row ${subActive ? 'is-active' : ''} ${compact ? 'justify-center' : ''} mb-0.5`}
              onClick={() => compact ? router.push('/admin/styles') : setSubOpen(v => !v)}
              title={compact ? 'Sub Categories' : undefined}
            >
              <Boxes size={18} strokeWidth={1.6} style={{ flexShrink: 0 }} />
              {!compact && <span className="asb-label">Sub Categories</span>}
              {!compact && <ChevronDown size={14} style={{ marginLeft: 'auto', transform: subOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />}
            </div>
            {!compact && (
              <div className={`overflow-hidden transition-all duration-300 ${subOpen ? 'max-h-[260px]' : 'max-h-0'}`}>
                <div className="pl-7 pr-1 py-1">
                  {SUB_LINKS.map(s => (
                    <Link key={s.href} href={s.href} className={`asb-sub ${pathname.startsWith(s.href) ? 'is-active' : ''}`}>
                      <span className="asb-sub-dot" />{s.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reports */}
            <div
              className={`asb-row ${repActive ? 'is-active' : ''} ${compact ? 'justify-center' : ''} mb-0.5`}
              onClick={() => compact ? router.push('/admin/reports/ledger') : setRepOpen(v => !v)}
              title={compact ? 'Reports' : undefined}
            >
              <ReceiptText size={18} strokeWidth={1.6} style={{ flexShrink: 0 }} />
              {!compact && <span className="asb-label">Reports</span>}
              {!compact && <ChevronDown size={14} style={{ marginLeft: 'auto', transform: repOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }} />}
            </div>
            {!compact && (
              <div className={`overflow-hidden transition-all duration-300 ${repOpen ? 'max-h-[160px]' : 'max-h-0'}`}>
                <div className="pl-7 pr-1 py-1">
                  {REPORT_LINKS.map(s => (
                    <Link key={s.href} href={s.href} className={`asb-sub ${pathname.startsWith(s.href) ? 'is-active' : ''}`}>
                      <span className="asb-sub-dot" />{s.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="mt-auto p-3" style={{ borderTop: '1px solid var(--c-border)' }}>
            {!compact ? (
              <div className="mb-2.5 p-2.5 rounded-xl flex items-center gap-2.5" style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                  style={{ background: 'var(--c-accent-soft)', border: '1px solid var(--c-border)', color: 'var(--c-accent)' }}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] tracking-[0.18em] uppercase" style={{ color: 'var(--c-text-faint)' }}>Signed in</span>
                  <span className="block text-[12.5px] truncate" title={email ?? 'Admin'} style={{ color: 'var(--c-text)' }}>{email ?? 'Admin'}</span>
                </div>
              </div>
            ) : (
              <div className="mb-2.5 flex justify-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: 'var(--c-accent-soft)', border: '1px solid var(--c-border)', color: 'var(--c-accent)' }}>
                  {initials}
                </div>
              </div>
            )}
            <button
              className={`asb-logout w-full flex items-center justify-center gap-2 rounded-xl cursor-pointer ${compact ? 'h-10' : 'h-11'}`}
              style={{ background: 'transparent', border: '1px solid rgba(192,69,59,0.28)', color: 'var(--c-danger)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}
              onClick={logout}
              disabled={signing}
              title="Sign out"
            >
              <LogOut size={16} strokeWidth={1.7} />
              {!compact && <span>{signing ? 'Signing out…' : 'Sign Out'}</span>}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
