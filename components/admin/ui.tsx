"use client";

/* ════════════════════════════════════════════════════════════════════
   ADMIN UI PRIMITIVES  —  "Refined Atelier"
   --------------------------------------------------------------------
   Thin, flexible wrappers over the design-system classes defined in
   components/admin/admin-theme.tsx. Import from "@/components/admin/ui".
   Every primitive forwards className / style / ...rest so pages can
   extend without fighting the system.
   ════════════════════════════════════════════════════════════════════ */

import React from "react";
import Link from "next/link";
import { Search, X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ──────────────────────────────────────────── PAGE ──────────────── */
export function Page({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-page", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Back",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {backHref && (
        <Link href={backHref} className="a-back">
          <ChevronLeft size={14} strokeWidth={2} /> {backLabel}
        </Link>
      )}
      <div className="a-head">
        <div>
          {eyebrow && <div className="a-eyebrow">{eyebrow}</div>}
          <h1 className="a-title">{title}</h1>
          {subtitle && <p className="a-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="a-head-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── CARD ──────────────── */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-card", className)} {...rest}>
      {children}
    </div>
  );
}
export function CardHeader({
  title,
  sub,
  actions,
  className,
  children,
}: {
  title?: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx("a-card-head", className)}>
      {children ?? (
        <div>
          {title && <h2 className="a-card-title">{title}</h2>}
          {sub && <p className="a-card-sub">{sub}</p>}
        </div>
      )}
      {actions && <div className="a-head-actions">{actions}</div>}
    </div>
  );
}
export function CardBody({ className, flush, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { flush?: boolean }) {
  return (
    <div className={cx("a-card-body", flush && "a-card-body--flush", className)} {...rest}>
      {children}
    </div>
  );
}
export function CardFooter({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-card-foot", className)} {...rest}>
      {children}
    </div>
  );
}
export function SectionTitle({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-section-title", className)} {...rest}>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────── STATS ─────────────── */
export function StatGrid({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-stats", className)} {...rest}>
      {children}
    </div>
  );
}
export function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
  loading,
  className,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  trend?: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cx("a-stat", className)}>
      <div className="a-stat-top">
        {icon && <div className="a-stat-ico">{icon}</div>}
        {trend && <span className="a-stat-trend">{trend}</span>}
      </div>
      <div className="a-stat-label">{label}</div>
      <div className={cx("a-stat-val", loading && "is-loading")}>{value}</div>
      {sub && <div className="a-stat-sub">{sub}</div>}
    </div>
  );
}

/* ──────────────────────────────────────────── BUTTON ────────────── */
type BtnVariant = "primary" | "ghost" | "subtle" | "danger" | "solid-danger";
type BtnSize = "sm" | "md" | "lg";
type ButtonProps = {
  variant?: BtnVariant;
  size?: BtnSize;
  block?: boolean;
  href?: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "ref">;

export function Button({ variant = "primary", size = "md", block, href, className, children, ...rest }: ButtonProps) {
  const cls = cx(
    "a-btn",
    `a-btn--${variant}`,
    size === "sm" && "a-btn--sm",
    size === "lg" && "a-btn--lg",
    block && "a-btn--block",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function IconButton({
  href,
  danger,
  size,
  className,
  children,
  ...rest
}: {
  href?: string;
  danger?: boolean;
  size?: "sm";
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "ref">) {
  const cls = cx("a-icon-btn", danger && "a-icon-btn--danger", size === "sm" && "a-icon-btn--sm", className);
  if (href) {
    return (
      <Link href={href} className={cls} title={(rest as any).title}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────── BADGE ─────────────── */
export type BadgeTone = "success" | "warning" | "danger" | "info" | "accent" | "neutral";
export function Badge({ tone = "neutral", className, children, ...rest }: { tone?: BadgeTone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("a-badge", `a-badge--${tone}`, className)} {...rest}>
      {children}
    </span>
  );
}
export function StatusDot({ tone = "success", pulse, className }: { tone?: BadgeTone; pulse?: boolean; className?: string }) {
  return <span className={cx("a-dot", `a-dot--${tone}`, pulse && "a-dot--pulse", className)} />;
}

/* ──────────────────────────────────────────── FORM ──────────────── */
export function FormGrid({ cols = 2, className, children, ...rest }: { cols?: 1 | 2 | 3 } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-form-grid", cols === 1 && "a-form-grid--1", cols === 3 && "a-form-grid--3", className)} {...rest}>
      {children}
    </div>
  );
}
export function Field({
  label,
  required,
  hint,
  error,
  span2,
  className,
  children,
}: {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  span2?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cx("a-field", !!error && "a-field--error", span2 && "a-col-span-2", className)}>
      {label && (
        <label className="a-label">
          {label}
          {required && <span className="a-req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="a-hint">{hint}</span>}
      {error && <span className="a-error-text">{error}</span>}
    </div>
  );
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cx("a-input", className)} {...rest} />;
  },
);
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cx("a-textarea", className)} {...rest} />;
  },
);
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx("a-select", className)} {...rest}>
        {children}
      </select>
    );
  },
);
export function InputWithIcon({ icon, className, ...rest }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="a-input-wrap">
      <span className="a-input-ico">{icon}</span>
      <input className={cx("a-input", className)} {...rest} />
    </div>
  );
}
export function Switch({ checked, onChange, disabled, className }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; className?: string }) {
  return (
    <label className={cx("a-switch", className)}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      <span className="a-switch-slider" />
    </label>
  );
}
export function Checkbox({ className, radio, ...rest }: { radio?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={radio ? "radio" : "checkbox"} className={cx("a-check", radio && "a-check--radio", className)} {...rest} />;
}

/* ──────────────────────────────────────────── TOOLBAR / SEARCH ──── */
export function Toolbar({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-toolbar", className)} {...rest}>
      {children}
    </div>
  );
}
export function ToolbarGroup({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-toolbar-group", className)} {...rest}>
      {children}
    </div>
  );
}
export function SearchInput({ className, value, onChange, placeholder = "Search…", ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cx("a-search", className)}>
      <Search className="a-search-ico" size={17} strokeWidth={1.7} />
      <input className="a-search-input" value={value} onChange={onChange} placeholder={placeholder} {...rest} />
    </div>
  );
}

/* ──────────────────────────────────────────── TABLE ─────────────── */
export function TableWrap({ className, children, scroll = true, ...rest }: { scroll?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("a-table-wrap", className)} {...rest}>
      {scroll ? <div className="a-table-scroll">{children}</div> : children}
    </div>
  );
}
export function Table({ className, children, ...rest }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cx("a-table", className)} {...rest}>
      {children}
    </table>
  );
}

/* ──────────────────────────────────────────── EMPTY / LOADER ────── */
export function EmptyState({
  icon,
  title = "Nothing here yet",
  text,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  text?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("a-empty", className)}>
      <div className="a-empty-ico">{icon ?? <Inbox size={44} strokeWidth={1} />}</div>
      {title && <div className="a-empty-title">{title}</div>}
      {text && <div className="a-empty-text">{text}</div>}
      {action}
    </div>
  );
}
export function Loader({ label, className }: { label?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("a-loader-row", className)}>
      <div className="a-loader" />
      {label && <span className="a-loader-label">{label}</span>}
    </div>
  );
}

/* ──────────────────────────────────────────── PAGINATION ────────── */
export function Pagination({
  page,
  pageCount,
  onChange,
  className,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;
  const windowed: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pageCount, start + 4);
  for (let i = start; i <= end; i++) windowed.push(i);
  return (
    <div className={cx("a-pager", className)}>
      <button className="a-pager-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous">
        <ChevronLeft size={16} />
      </button>
      {start > 1 && (
        <>
          <button className="a-pager-btn" onClick={() => onChange(1)}>1</button>
          {start > 2 && <span className="a-muted" style={{ padding: "0 4px" }}>…</span>}
        </>
      )}
      {windowed.map((p) => (
        <button key={p} className={cx("a-pager-btn", p === page && "is-active")} onClick={() => onChange(p)}>
          {p}
        </button>
      ))}
      {end < pageCount && (
        <>
          {end < pageCount - 1 && <span className="a-muted" style={{ padding: "0 4px" }}>…</span>}
          <button className="a-pager-btn" onClick={() => onChange(pageCount)}>{pageCount}</button>
        </>
      )}
      <button className="a-pager-btn" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────── MODAL ─────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width,
}: {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div className="a-modal" style={width ? { maxWidth: width } : undefined} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="a-modal-head" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <h3 className="a-modal-title">{title}</h3>
            {onClose && (
              <button className="a-icon-btn a-icon-btn--sm" onClick={onClose} aria-label="Close" style={{ marginTop: 2 }}>
                <X size={15} />
              </button>
            )}
          </div>
        )}
        <div className="a-modal-body">{children}</div>
        {footer && <div className="a-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────── TABS ──────────────── */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: React.ReactNode; icon?: React.ReactNode }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cx("a-tabs", className)}>
      {tabs.map((t) => (
        <button key={t.key} className={cx("a-tab", t.key === active && "is-active")} onClick={() => onChange(t.key)}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
