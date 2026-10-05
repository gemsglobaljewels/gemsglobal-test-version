'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Calendar, FileText,
  Users, LogOut, Boxes, ChevronDown, BarChart3,
  MessageSquare, Tag, Diamond, Menu, X, Mail, Quote, Instagram, Image as ImageIcon
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
  { href: '/admin/img-gallery', label: 'Image Gallery', icon: ImageIcon },
  { href: '/admin/settings', label: 'Site Settings', icon: Diamond },
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
      pathname.startsWith('/admin/size-options')
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

  const badgeMap: Record<string, number> = { msgs, orders, appts, offline };
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (href !== '/admin' && pathname.startsWith(href));

  const initials = email ? email[0].toUpperCase() : 'A';

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobOpen(v => !v)}
        className="fixed top-4 right-4 z-[1001] flex items-center justify-center w-10 h-10 rounded-lg shadow-lg"
        style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-accent)' }}
      >
        {mobOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-[998] transition-opacity duration-300 ${mobOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={() => setMobOpen(false)}
      />

      {/* Sidebar Container */}
      <div
        className={`
        ${collapsed ? 'w-[70px]' : 'w-[260px]'} flex-shrink-0 h-screen overflow-visible transition-all duration-300 ease-in-out
        translate-x-0
        static top-0 left-0 z-[1000]
      `}
        style={{ backgroundColor: 'var(--c-surface)' }}
      >
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden md:flex absolute -right-4 top-5 items-center justify-center w-8 h-8 rounded-full cursor-pointer shadow-lg z-10"
          style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-accent)' }}
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Sidebar */}
        <aside
          className={`
          flex flex-col h-full border-r z-50 relative overflow-hidden transition-all duration-300
          ${collapsed ? 'w-[70px]' : 'w-[260px]'}
          ${mobOpen ? '!w-[260px]' : ''}
        `}
          style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
        >
          {/* Logo */}
          <div className="p-5 border-b" style={{ borderColor: 'var(--c-border)' }}>
            {collapsed && !mobOpen ? (
              <div className="flex items-center justify-center">
                <Diamond size={20} style={{ color: 'var(--c-accent)' }} />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Diamond size={14} style={{ color: 'var(--c-accent)' }} />
                  <div className="flex-1 h-[0.5px]" style={{ backgroundColor: 'var(--c-border)' }}></div>
                </div>
                <Link href="/admin" className="text-xl font-light tracking-[0.3em] uppercase no-underline block" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-main)' }}>
                  {settings?.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt={settings.site_name || 'Logo'}
                      style={{ maxHeight: '46px', width: 'auto', objectFit: 'contain' }}
                    />
                  ) : (
                    'ATELIER <em style="font-style:italic;font-weight:600;color:var(--c-accent)">FINE</em>'
                  )}
                </Link>
                <span
                  className="block mt-1 text-xs tracking-[0.42em] uppercase"
                  style={{ color: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }}
                >
                  Admin Panel
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" style={{ scrollbarWidth: 'thin' }}>
            <div className="mb-2">
              <span
                className={`text-xs font-bold tracking-[0.48em] uppercase pl-2 ${collapsed && !mobOpen ? 'hidden' : 'block'}`}
                style={{ color: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }}
              >
                Main
              </span>
            </div>

            {MAIN_LINKS.map(link => {
              const Icon = link.icon;
              const badge = (link as any).badge ? badgeMap[(link as any).badge] : 0;
              const active = isActive(link.href, (link as any).exact);

              return (
                <div key={link.href} className="mb-1">
                  <Link
                    href={link.href}
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <div
                      className={`
                      flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200
                      ${collapsed && !mobOpen ? 'justify-center px-0' : ''}
                    `}
                      style={{
                        backgroundColor: active ? 'rgba(var(--c-accent-rgb), 0.12)' : 'transparent',
                        color: active ? 'var(--c-accent)' : 'var(--c-text-muted)',
                      }}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                      {(!collapsed || mobOpen) && (
                        <span className="text-xs font-medium tracking-[0.1em] uppercase" style={{ fontFamily: 'var(--font-main)' }}>
                          {link.label}
                        </span>
                      )}
                      {badge > 0 && (!collapsed || mobOpen) && (
                        <span
                          className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: 'var(--c-accent)', color: 'white' }}
                        >
                          {badge}
                        </span>
                      )}
                      {badge > 0 && collapsed && !mobOpen && (
                        <span
                          className="absolute right-1 top-1 w-2 h-2 rounded-full"
                          style={{ backgroundColor: 'var(--c-accent)' }}
                        ></span>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Sub Categories Dropdown */}
            <div className="mt-4 mb-2">
              <span
                className={`text-xs font-bold tracking-[0.48em] uppercase pl-2 ${collapsed && !mobOpen ? 'hidden' : 'block'}`}
                style={{ color: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }}
              >
                More
              </span>
            </div>

            <div className="mb-1">
              <div
                className={`
                flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200
                ${collapsed && !mobOpen ? 'justify-center px-0' : ''}
              `}
                style={{
                  backgroundColor: (pathname.startsWith('/admin/styles') || pathname.startsWith('/admin/diamond-shapes') || pathname.startsWith('/admin/metal-options') || pathname.startsWith('/admin/size-options')) ? 'rgba(var(--c-accent-rgb), 0.12)' : 'transparent',
                  color: (pathname.startsWith('/admin/styles') || pathname.startsWith('/admin/diamond-shapes') || pathname.startsWith('/admin/metal-options') || pathname.startsWith('/admin/size-options')) ? 'var(--c-accent)' : 'var(--c-text-muted)',
                }}
                onClick={() => setSubOpen(v => !v)}
              >
                <Boxes size={18} strokeWidth={1.5} />
                {(!collapsed || mobOpen) && (
                  <span className="text-xs font-medium tracking-[0.1em] uppercase flex-1" style={{ fontFamily: 'var(--font-main)' }}>
                    Sub Categories
                  </span>
                )}
                {(!collapsed || mobOpen) && (
                  <ChevronDown size={14} strokeWidth={1.5} style={{ transform: subOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                )}
              </div>

              {(!collapsed || mobOpen) && (
                <div
                  className={`overflow-hidden transition-all duration-300 ${subOpen ? 'max-h-[300px]' : 'max-h-0'}`}
                >
                  <div className="px-3 py-2">
                    {[
                      { href: '/admin/styles', label: 'Rings by Style' },
                      { href: '/admin/diamond-shapes', label: 'Diamond Shapes' },
                      { href: '/admin/metal-options', label: 'Metal Options' },
                      { href: '/admin/size-options', label: 'Size Options' }
                    ].map(subItem => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`
                        block py-1.5 text-xs tracking-[0.08em] uppercase
                        text-left no-underline transition-colors duration-200
                        ${pathname.startsWith(subItem.href) ? 'text-[var(--c-accent)]' : 'text-[var(--c-text-muted)]'}
                      `}
                        style={{ fontFamily: 'var(--font-main)' }}
                      >
                        <span className="inline-block w-1 h-1 rounded-full mr-2" style={{ backgroundColor: pathname.startsWith(subItem.href) ? 'var(--c-accent)' : 'var(--c-text-muted)' }}></span>
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="mt-auto border-t p-4" style={{ borderColor: 'var(--c-border)' }}>
            <div
              className={`mb-3 p-3 rounded-md flex items-center gap-3 ${collapsed && !mobOpen ? 'justify-center p-2' : ''}`}
              style={{ backgroundColor: 'rgba(var(--c-accent-rgb), 0.04)', border: '1px solid rgba(var(--c-accent-rgb), 0.08)' }}
            >
              {(!collapsed || mobOpen) && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: 'rgba(var(--c-accent-rgb), 0.1)', border: '1px solid rgba(var(--c-accent-rgb), 0.2)', color: 'var(--c-accent)' }}
                >
                  {initials}
                </div>
              )}
              {(!collapsed || mobOpen) && (
                <div className="flex-1 min-w-0">
                  <span className="block text-xs tracking-[0.2em] uppercase" style={{ color: 'var(--c-text-muted)', fontFamily: 'var(--font-main)' }}>Logged in as</span>
                  <span className="block text-sm font-light text-ellipsis overflow-hidden" title={email ?? 'Admin'} style={{ color: 'var(--c-text)', fontFamily: 'var(--font-main)' }}>
                    {email ?? 'Admin'}
                  </span>
                </div>
              )}
            </div>

            <button
              className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md cursor-pointer
              font-medium text-xs tracking-[0.24em] uppercase
              transition-all duration-200
              ${collapsed && !mobOpen ? 'w-9 h-9 p-0 rounded-full' : ''}
            `}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(185, 64, 64, 0.25)',
                color: '#B94040'
              }}
              onClick={logout}
              disabled={signing}
            >
              <LogOut size={15} strokeWidth={1.5} />
              {(!collapsed || mobOpen) && <span>{signing ? 'Signing out…' : 'Sign Out'}</span>}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
