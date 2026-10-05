"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminStyles } from "@/components/admin/admin-theme";

/* ════════════════════════════════════════════════════════════════
   ADMIN SHELL
   The "Refined Atelier" design system (white, admin-only) is injected
   by <AdminStyles/> — globals.css is never modified. Every page that
   references the brand tokens (var(--c-bg)/--c-surface/--c-border/…)
   resolves to the clean white palette inside `.admin-scope`.
   ════════════════════════════════════════════════════════════════ */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const verifyAdmin = useCallback(async (userId: string) => {
    try {
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const isAdminCached = useRef<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    let subscription: { unsubscribe: () => void } | null = null;

    if (pathname === "/admin/login") {
      setAllowed(true);
      setChecked(true);
      return;
    }

    if (typeof window !== "undefined") {
      try {
        const cachedAdmin = localStorage.getItem("isAdmin");
        if (cachedAdmin === "true") {
          isAdminCached.current = true;
          setAllowed(true);
          setChecked(true);
        }
      } catch (e) {
        console.error("[AdminLayout] localStorage error", e);
      }
    }

    const run = async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const isAdmin = await verifyAdmin(session.user.id);
        if (!alive) return;
        if (isAdmin) {
          isAdminCached.current = true;
          if (typeof window !== "undefined") {
            localStorage.setItem("isAdmin", "true");
          }
          setAllowed(true);
          setChecked(true);
        } else {
          isAdminCached.current = false;
          if (typeof window !== "undefined") {
            localStorage.removeItem("isAdmin");
          }
          router.replace("/admin/login");
          setAllowed(false);
          setChecked(true);
        }
        return;
      }

      router.replace("/admin/login");
      setChecked(true);
      setAllowed(false);

      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          if (!alive) return;
          if (newSession?.user) {
            const isAdmin = await verifyAdmin(newSession.user.id);
            if (!alive) return;
            if (isAdmin) {
              isAdminCached.current = true;
              if (typeof window !== "undefined") {
                localStorage.setItem("isAdmin", "true");
              }
              setAllowed(true);
              setChecked(true);
            } else {
              isAdminCached.current = false;
              if (typeof window !== "undefined") {
                localStorage.removeItem("isAdmin");
              }
              router.replace("/admin/login");
              setAllowed(false);
              setChecked(true);
            }
          }
        }
      );
      subscription = listener.subscription;
    };

    run();

    return () => {
      alive = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [router, pathname, verifyAdmin]);

  if (!checked) {
    return (
      <div className="admin-scope flex h-screen w-screen items-center justify-center" style={{ backgroundColor: "var(--c-bg)" }}>
        <AdminStyles />
        <div className="admin-boot">
          <span className="admin-boot-dot" />
          <span className="admin-boot-dot" />
          <span className="admin-boot-dot" />
          <span
            className="ml-2 text-xs uppercase"
            style={{ color: "var(--c-text-muted)", letterSpacing: "0.22em", fontFamily: "var(--font-dmsans)" }}
          >
            Loading Admin Panel
          </span>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  if (pathname === "/admin/login") {
    return (
      <div className="admin-scope">
        <AdminStyles />
        {children}
      </div>
    );
  }

  return (
    <div className="admin-scope flex min-h-screen" style={{ backgroundColor: "var(--c-bg)" }}>
      <AdminStyles />
      <AdminSidebar />
      <main className="flex-1 min-h-screen overflow-y-auto relative z-10" style={{ backgroundColor: "var(--c-bg)" }}>
        {children}
      </main>
    </div>
  );
}
