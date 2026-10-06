"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HeaderMegaMenu from "@/components/HeaderMegaMenu";
import { Footer } from "@/components/footer";
import {
  Heart, ArrowRight, Trash2, ShoppingBag, Gem,
  LayoutGrid, List, ArrowUpRight, Sparkles,
} from "lucide-react";
import { getWishlist, removeFromWishlist, addToCart, getUser } from "@/lib/authStore";
import { useToast } from "@/hooks/use-toast";
import { Price } from "@/components/Price";

/* ─── helpers ───────────────────────────────────────────────── */
function productHref(p: any) {
  const cat = String(p.category_slug || p.category || "").toLowerCase().replace(/\s+/g, "-");
  const slug = String(p.slug || "");
  const style = String(p.style_slug || p.style || "").toLowerCase().replace(/\s+/g, "-");
  if (cat === "rings" && style && slug) return `/collection/rings/${style}/${slug}`;
  return cat && slug ? `/collection/${cat}/${slug}` : `/products/${slug}`;
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ─── CSS ───────────────────────────────────────────────────── */
const CSS = `
.wl-root *,.wl-root *::before,.wl-root *::after{box-sizing:border-box;}

/* ══ ROOT ═══════════════════════════════════════════════════ */
.wl-root{
  --wl-gold:linear-gradient(120deg,#C9A96E 0%,#A8916F 46%,#8C7456 100%);
  --wl-hair:rgba(var(--c-accent-rgb),.15);
  --wl-hair-strong:rgba(var(--c-accent-rgb),.3);
  position:relative;min-height:100vh;display:flex;flex-direction:column;
  background:
    radial-gradient(135% 92% at 50% -14%, rgba(var(--c-accent-rgb),.09), transparent 56%),
    var(--c-bg);
  color:var(--c-text);font-family:var(--font-main);overflow-x:clip;
}
.wl-root::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.02;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.wl-root a:focus-visible,.wl-root button:focus-visible{outline:2px solid var(--c-accent);outline-offset:3px;border-radius:var(--radius);}

.wl-main{flex:1;position:relative;z-index:1;padding-top:clamp(96px,13vw,132px);padding-bottom:clamp(72px,9vw,112px);}
.wl-shell{max-width:1380px;margin:0 auto;padding-inline:clamp(18px,5vw,60px);}

/* ══ MASTHEAD ═══════════════════════════════════════════════ */
.wl-masthead{
  display:flex;align-items:flex-end;justify-content:space-between;
  gap:clamp(24px,4vw,56px);flex-wrap:wrap;
  padding-bottom:clamp(22px,3vw,32px);margin-bottom:clamp(20px,2.6vw,30px);
  border-bottom:1px solid var(--wl-hair);
}
.wl-eyebrow{
  display:inline-flex;align-items:center;gap:11px;margin-bottom:16px;
  font-family:var(--font-montserrat);font-size:10px;font-weight:600;
  letter-spacing:.34em;text-transform:uppercase;color:var(--c-accent);
}
.wl-eyebrow::before{content:'';width:30px;height:1px;background:linear-gradient(90deg,transparent,var(--c-accent));}
.wl-title{
  font-family:var(--font-main);font-weight:400;
  font-size:clamp(40px,7vw,76px);line-height:.92;letter-spacing:-.015em;
  color:var(--c-text);margin:0;
}
.wl-title em{
  font-style:italic;color:transparent;
  background:var(--wl-gold);-webkit-background-clip:text;background-clip:text;
}
.wl-lede{
  margin:16px 0 0;max-width:46ch;font-family:var(--font-montserrat);
  font-size:clamp(11px,1.3vw,12.5px);line-height:1.75;letter-spacing:.02em;color:var(--c-text-muted);
}
.wl-head-right{display:flex;align-items:flex-end;gap:clamp(16px,2.6vw,28px);padding-bottom:4px;}
.wl-stat{text-align:right;}
.wl-stat-num{font-family:var(--font-main);font-style:italic;font-size:clamp(28px,4.2vw,44px);line-height:1;color:var(--c-text);}
.wl-stat-num--price{font-family:var(--font-montserrat);font-style:normal;font-weight:800;color:#111;font-variant-numeric:tabular-nums;}
.wl-stat-num span{color:var(--c-accent);font-style:normal;}
.wl-stat-label{display:block;margin-top:8px;font-family:var(--font-montserrat);font-size:9px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--c-text-faint);}
.wl-stat-div{width:1px;align-self:stretch;background:var(--wl-hair-strong);}

/* ══ TOOLBAR ════════════════════════════════════════════════ */
.wl-toolbar{
  display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;
  margin-bottom:clamp(20px,3vw,30px);
}
.wl-toolbar-left{font-family:var(--font-montserrat);font-size:11px;letter-spacing:.04em;color:var(--c-text-muted);}
.wl-toolbar-left em{font-style:normal;color:var(--c-accent);font-weight:600;}
.wl-toolbar-right{display:flex;align-items:center;gap:12px;}
.wl-toggle{display:inline-flex;padding:3px;border:1px solid var(--wl-hair);border-radius:999px;background:rgba(var(--c-bg-rgb),.6);}
.wl-toggle-btn{width:38px;height:32px;display:grid;place-items:center;border:none;background:transparent;border-radius:999px;color:rgba(var(--c-accent-rgb),.55);cursor:pointer;transition:.25s;}
.wl-toggle-btn.on{background:var(--c-accent);color:#fff;box-shadow:0 4px 12px rgba(var(--c-accent-rgb),.28);}
.wl-toggle-btn:hover:not(.on){color:var(--c-accent);}

/* ══ SHARED PILL BUTTONS ════════════════════════════════════ */
.wl-btn{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:var(--font-montserrat);font-size:10.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;text-decoration:none;border-radius:999px;transition:.3s;white-space:nowrap;}
.wl-btn>*{position:relative;z-index:1;}
.wl-btn-ghost{padding:12px 22px;border:1px solid var(--wl-hair-strong);background:transparent;color:var(--c-accent);}
.wl-btn-ghost:hover{border-color:transparent;background:#1F1811;color:#fff;transform:translateY(-2px);box-shadow:0 14px 28px -14px rgba(58,46,34,.5);}
.wl-btn-solid{padding:13px 26px;border:1px solid transparent;background:linear-gradient(135deg,#8C7456,#6F5A42);color:#fff;box-shadow:0 12px 26px -12px rgba(140,116,86,.7);}
.wl-btn-solid::before{content:'';position:absolute;inset:0;background:#1F1811;transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.25,.46,.45,.94);z-index:0;}
.wl-btn-solid:hover::before{transform:scaleX(1);}
.wl-btn-solid:hover{transform:translateY(-2px);box-shadow:0 18px 34px -14px rgba(58,46,34,.5);}
.wl-btn svg{transition:transform .35s;}
.wl-btn:hover svg{transform:translateX(3px);}

/* ══ GRID VIEW ══════════════════════════════════════════════ */
.wl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:clamp(16px,2vw,26px);}
@media(max-width:720px){.wl-grid{grid-template-columns:repeat(2,1fr);gap:13px;}}
@media(max-width:430px){.wl-grid{grid-template-columns:1fr;gap:16px;}}

.wl-card{
  position:relative;display:flex;flex-direction:column;background:#fff;
  border:1px solid var(--wl-hair);border-radius:calc(var(--radius) + 3px);overflow:hidden;
  box-shadow:0 1px 2px rgba(44,35,30,.04);
  transition:transform .55s cubic-bezier(.16,1,.3,1),box-shadow .55s,border-color .55s;
}
.wl-card:hover{transform:translateY(-6px);box-shadow:0 28px 54px -30px rgba(44,35,30,.5);border-color:var(--wl-hair-strong);}
.wl-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;z-index:7;background:var(--wl-gold);transform:scaleX(0);transform-origin:left;transition:transform .6s cubic-bezier(.25,.46,.45,.94);}
.wl-card:hover::before{transform:scaleX(1);}

.wl-media{position:relative;aspect-ratio:4/5;overflow:hidden;background:var(--c-surface);}
.wl-media-link{position:absolute;inset:0;display:block;text-decoration:none;}
.wl-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1s cubic-bezier(.16,1,.3,1),filter .5s;}
.wl-card:hover .wl-media img{transform:scale(1.06);}
.wl-media-empty{position:absolute;inset:0;display:grid;place-items:center;color:rgba(var(--c-accent-rgb),.35);}
.wl-card-out .wl-media img{filter:grayscale(.55) brightness(.8);}

.wl-ribbon{position:absolute;top:12px;left:12px;z-index:6;font-family:var(--font-montserrat);font-size:8px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#fff;background:rgba(185,64,64,.92);border:1px solid rgba(255,255,255,.18);padding:5px 10px;border-radius:999px;backdrop-filter:blur(6px);}

.wl-heart{position:absolute;top:12px;right:12px;z-index:7;width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:rgba(var(--c-bg-rgb),.85);border:1px solid var(--wl-hair-strong);backdrop-filter:blur(8px);color:var(--c-accent);cursor:pointer;transition:.28s cubic-bezier(.34,1.56,.64,1);}
.wl-heart svg{fill:currentColor;}
.wl-heart:hover{color:#fff;background:var(--c-error);border-color:var(--c-error);transform:scale(1.08);}

.wl-tray{position:absolute;left:12px;right:12px;bottom:12px;z-index:6;display:flex;gap:8px;transform:translateY(150%);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .4s;}
.wl-card:hover .wl-tray{transform:translateY(0);opacity:1;}
.wl-tray-btn{height:42px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-family:var(--font-montserrat);font-size:9.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;border-radius:999px;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:.28s;}
.wl-tray-add{flex:1;background:var(--c-text);color:#fff;}
.wl-tray-add:hover{background:var(--c-accent);}
.wl-tray-view{flex:0 0 44px;background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border-color:var(--wl-hair-strong);color:var(--c-accent);}
.wl-tray-view.wide{flex:1;}
.wl-tray-view:hover{background:#fff;color:var(--c-text);}

.wl-body{display:flex;flex-direction:column;gap:6px;padding:clamp(14px,1.8vw,19px);}
.wl-cat{font-family:var(--font-montserrat);font-size:8.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--c-accent);}
.wl-name{font-family:var(--font-playfair);font-size:clamp(17px,1.6vw,20px);font-weight:500;line-height:1.2;color:var(--c-text);text-decoration:none;transition:color .25s;}
.wl-name:hover{color:var(--c-accent);}
.wl-price{margin-top:3px;display:flex;align-items:center;gap:10px;font-family:var(--font-montserrat);font-size:clamp(16px,1.5vw,19px);font-weight:800;color:#111;font-variant-numeric:tabular-nums;}
.wl-oos{font-family:var(--font-montserrat);font-size:9px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--c-error);}

/* ══ LIST VIEW ══════════════════════════════════════════════ */
.wl-list{display:flex;flex-direction:column;gap:clamp(10px,1.4vw,14px);}
.wl-row{
  position:relative;display:grid;
  grid-template-columns:clamp(92px,12vw,120px) 1fr auto;
  grid-template-areas:"media body actions";
  align-items:stretch;gap:0;
  background:#fff;border:1px solid var(--wl-hair);border-radius:calc(var(--radius) + 3px);overflow:hidden;
  transition:.4s cubic-bezier(.16,1,.3,1);
}
.wl-row:hover{border-color:var(--wl-hair-strong);box-shadow:0 16px 34px -24px rgba(44,35,30,.5);transform:translateY(-2px);}
.wl-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;z-index:2;background:var(--wl-gold);transform:scaleY(0);transform-origin:top;transition:transform .4s;}
.wl-row:hover::before{transform:scaleY(1);}
.wl-row-media{grid-area:media;position:relative;overflow:hidden;background:var(--c-surface);text-decoration:none;}
.wl-row-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.16,1,.3,1);}
.wl-row:hover .wl-row-media img{transform:scale(1.05);}
.wl-row-media-empty{position:absolute;inset:0;display:grid;place-items:center;color:rgba(var(--c-accent-rgb),.35);}
.wl-row-out .wl-row-media img{filter:grayscale(.55) brightness(.8);}
.wl-row-body{grid-area:body;display:flex;flex-direction:column;justify-content:center;gap:5px;min-width:0;padding:clamp(16px,2vw,22px) clamp(18px,2.4vw,28px);}
.wl-row-cat{font-family:var(--font-montserrat);font-size:8.5px;font-weight:600;letter-spacing:.26em;text-transform:uppercase;color:var(--c-accent);}
.wl-row-name{font-family:var(--font-playfair);font-size:clamp(18px,1.8vw,22px);font-weight:500;color:var(--c-text);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .25s;}
.wl-row-name:hover{color:var(--c-accent);}
.wl-row-price{margin-top:3px;display:flex;align-items:center;gap:12px;font-family:var(--font-montserrat);font-size:clamp(17px,1.6vw,20px);font-weight:800;color:#111;font-variant-numeric:tabular-nums;}
.wl-row-actions{grid-area:actions;display:flex;align-items:center;gap:10px;padding-right:clamp(16px,2vw,24px);}
.wl-icon-btn{display:grid;place-items:center;width:42px;height:42px;flex-shrink:0;border-radius:50%;border:1px solid var(--wl-hair-strong);background:transparent;color:var(--c-accent);text-decoration:none;cursor:pointer;transition:.25s;}
.wl-icon-btn:hover{border-color:var(--c-accent);background:rgba(var(--c-accent-rgb),.08);}
.wl-icon-btn.danger{color:rgba(var(--c-text-rgb),.4);border-color:rgba(var(--c-text-rgb),.12);}
.wl-icon-btn.danger:hover{color:var(--c-error);border-color:rgba(185,64,64,.4);background:rgba(185,64,64,.07);}

@media(max-width:640px){
  .wl-row{grid-template-columns:88px 1fr;grid-template-areas:"media body" "actions actions";}
  .wl-row-media{min-height:88px;}
  .wl-row-actions{padding:0 16px 16px;}
  .wl-row-actions .wl-btn{flex:1;}
}

/* ══ SUMMARY STRIP ══════════════════════════════════════════ */
.wl-summary{
  margin-top:clamp(26px,3.6vw,42px);display:flex;align-items:center;justify-content:space-between;
  gap:20px;flex-wrap:wrap;padding:clamp(18px,2.4vw,26px) clamp(20px,3vw,34px);
  border-radius:calc(var(--radius) + 5px);border:1px solid var(--wl-hair);
  background:rgba(var(--c-bg-rgb),.72);backdrop-filter:blur(12px);box-shadow:var(--shadow-sm);
}
.wl-summary-info{font-family:var(--font-playfair);font-style:italic;font-size:clamp(16px,2vw,22px);color:var(--c-text-muted);}
.wl-summary-info em{font-style:normal;color:var(--c-accent);}
.wl-summary-info em.wl-sum-val{color:#111;font-weight:800;font-family:var(--font-montserrat);font-variant-numeric:tabular-nums;}
.wl-summary-actions{display:flex;gap:12px;flex-wrap:wrap;}

/* ══ EMPTY STATE ════════════════════════════════════════════ */
.wl-empty{min-height:58vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 24px;}
.wl-empty-badge{position:relative;width:clamp(96px,20vw,120px);aspect-ratio:1;border-radius:50%;display:grid;place-items:center;color:var(--c-accent);border:1px solid var(--wl-hair-strong);background:radial-gradient(circle at 50% 30%,rgba(var(--c-accent-rgb),.14),transparent 72%);margin-bottom:30px;}
.wl-empty-badge::after{content:'';position:absolute;inset:9px;border-radius:50%;border:1px solid var(--wl-hair);}
.wl-empty-eyebrow{font-family:var(--font-montserrat);font-size:10px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;color:var(--c-accent);display:block;margin-bottom:16px;}
.wl-empty-title{font-family:var(--font-main);font-style:italic;font-weight:300;font-size:clamp(32px,6vw,52px);line-height:1.02;margin:0 0 14px;color:var(--c-text);}
.wl-empty-text{font-family:var(--font-montserrat);font-size:12px;letter-spacing:.02em;line-height:1.8;color:var(--c-text-muted);max-width:380px;margin:0 auto 30px;}

/* ══ SKELETON ═══════════════════════════════════════════════ */
.wl-sk{position:relative;overflow:hidden;background:rgba(var(--c-accent-rgb),.1);border-radius:6px;}
.wl-sk::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(var(--c-accent-rgb),.18),transparent);transform:translateX(-100%);animation:wlShimmer 1.6s ease-in-out infinite;}
@keyframes wlShimmer{to{transform:translateX(100%);}}
.wl-sk-head{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-bottom:30px;margin-bottom:40px;border-bottom:1px solid var(--wl-hair);}
.wl-sk-card{border:1px solid var(--wl-hair);border-radius:calc(var(--radius) + 3px);overflow:hidden;}
.wl-sk-media{aspect-ratio:4/5;border-radius:0;}
.wl-sk-body{padding:16px;display:flex;flex-direction:column;gap:10px;}

/* ══ MOTION SAFETY ══════════════════════════════════════════ */
@media (prefers-reduced-motion: reduce){
  .wl-root *,.wl-root *::before,.wl-root *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;}
  .wl-card:hover{transform:none;}
  .wl-card:hover .wl-media img{transform:none;}
}
`;

type WishlistItem = {
  id?: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  stock_quantity?: number;
};

/* ─── skeleton ──────────────────────────────────────────────── */
function WishSkeleton() {
  return (
    <div className="wl-shell">
      <div className="wl-sk-head">
        <div>
          <div className="wl-sk" style={{ width: 130, height: 12, marginBottom: 18 }} />
          <div className="wl-sk" style={{ width: "min(340px,68vw)", height: 54 }} />
        </div>
        <div className="wl-sk" style={{ width: 130, height: 46, alignSelf: "flex-end" }} />
      </div>
      <div className="wl-grid">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div className="wl-sk-card" key={i}>
            <div className="wl-sk wl-sk-media" />
            <div className="wl-sk-body">
              <div className="wl-sk" style={{ width: "40%", height: 9 }} />
              <div className="wl-sk" style={{ width: "72%", height: 18 }} />
              <div className="wl-sk" style={{ width: "34%", height: 16 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function WishlistPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [, setTick] = useState(0);

  useEffect(() => {
    async function syncWishlistStock() {
      const localWishlist = getWishlist();
      try {
        const updatedWishlist = await Promise.all(
          localWishlist.map(async (item: any) => {
            try {
              const res = await fetch(`/api/products/${item.id || item.slug}`);
              if (res.ok) {
                const product = await res.json();
                return { ...item, stock_quantity: product.stock_quantity };
              }
            } catch (e) {
              console.error("Failed to sync stock for", item.slug, e);
            }
            return item;
          })
        );
        setWishlist(updatedWishlist);
      } catch (err) {
        setWishlist(localWishlist);
      } finally {
        setLoading(false);
      }
    }

    syncWishlistStock();
    const h = () => setTick((t) => t + 1);
    window.addEventListener("currency-updated", h);
    return () => window.removeEventListener("currency-updated", h);
  }, []);

  const handleRemove = (slug: string) => {
    removeFromWishlist(slug);
    setWishlist((p) => p.filter((i) => i.slug !== slug));
    toast({
      title: "Removed from Wishlist",
      description: "Product has been removed from your wishlist.",
      duration: 3000,
    });
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const isOutOfStock = Number(item.stock_quantity ?? 0) <= 0;
    if (isOutOfStock) {
      toast({
        title: "Out of Stock",
        description: "This exclusive piece is currently unavailable.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const user = getUser();
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    try {
      await addToCart({
        productId: item.id || item.slug,
        slug: item.slug,
        productName: item.name,
        price: item.price,
        quantity: 1,
        size: "6",
        image: item.image,
      });
      toast({
        title: "Added to Bag",
        description: `${item.name} has been added to your shopping bag.`,
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add to bag",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleAddAll = async () => {
    const inStock = wishlist.filter((i) => Number(i.stock_quantity ?? 0) > 0);
    if (inStock.length === 0) {
      toast({
        title: "Nothing Available",
        description: "None of your saved pieces are in stock right now.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const user = getUser();
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    let added = 0;
    for (const item of inStock) {
      try {
        await addToCart({
          productId: item.id || item.slug,
          slug: item.slug,
          productName: item.name,
          price: item.price,
          quantity: 1,
          size: "6",
          image: item.image,
        });
        added++;
      } catch (e) {
        /* skip failures silently, reported in summary */
      }
    }

    toast({
      title: "Added to Bag",
      description: `${added} ${added === 1 ? "piece has" : "pieces have"} been moved to your shopping bag.`,
      duration: 3000,
    });
  };

  const totalValue = wishlist.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const inStockCount = wishlist.filter((i) => Number(i.stock_quantity ?? 0) > 0).length;

  return (
    <>
      <style>{CSS}</style>
      <div className="wl-root">
        <HeaderMegaMenu />

        <main className="wl-main">
          {loading ? (
            <WishSkeleton />
          ) : wishlist.length === 0 ? (
            /* ── EMPTY ── */
            <div className="wl-shell">
              <div className="wl-empty">
                <motion.div
                  className="wl-empty-badge"
                  initial={{ opacity: 0, y: 16, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.9, ease: EASE }}
                >
                  <Heart size={32} strokeWidth={1.2} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
                >
                  <span className="wl-empty-eyebrow">The Wishlist</span>
                  <h1 className="wl-empty-title">Your collection awaits</h1>
                  <p className="wl-empty-text">
                    Pieces you fall for while browsing are kept here, ready for the moment you decide.
                    Begin curating your edit.
                  </p>
                  <Link href="/collection" className="wl-btn wl-btn-solid">
                    <span>Browse Collection</span>
                    <ArrowRight size={13} strokeWidth={1.6} />
                  </Link>
                </motion.div>
              </div>
            </div>
          ) : (
            /* ── POPULATED ── */
            <div className="wl-shell">
              {/* masthead */}
              <motion.header
                className="wl-masthead"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="wl-masthead-left">
                  <span className="wl-eyebrow">My Wishlist</span>
                  <h1 className="wl-title">Saved <em>Pieces</em></h1>
                  <p className="wl-lede">
                    Your personal edit of pieces worth returning to — kept close until the moment feels right.
                  </p>
                </div>
                <div className="wl-head-right">
                  <div className="wl-stat">
                    <div className="wl-stat-num">
                      {String(wishlist.length).padStart(2, "0")}
                    </div>
                    <span className="wl-stat-label">{wishlist.length === 1 ? "Piece saved" : "Pieces saved"}</span>
                  </div>
                  <div className="wl-stat-div" aria-hidden="true" />
                  <div className="wl-stat">
                    <div className="wl-stat-num wl-stat-num--price"><Price value={totalValue} /></div>
                    <span className="wl-stat-label">Total value</span>
                  </div>
                </div>
              </motion.header>

              {/* toolbar */}
              <div className="wl-toolbar">
                <div className="wl-toolbar-left">
                  <em>{inStockCount}</em> of {wishlist.length} available to order
                </div>
                <div className="wl-toolbar-right">
                  {inStockCount > 0 && (
                    <button className="wl-btn wl-btn-ghost" onClick={handleAddAll}>
                      <ShoppingBag size={13} strokeWidth={1.6} />
                      <span>Add all to Bag</span>
                    </button>
                  )}
                  <div className="wl-toggle" role="group" aria-label="View mode">
                    <button
                      className={`wl-toggle-btn${viewMode === "grid" ? " on" : ""}`}
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                    >
                      <LayoutGrid size={15} strokeWidth={1.6} />
                    </button>
                    <button
                      className={`wl-toggle-btn${viewMode === "list" ? " on" : ""}`}
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                    >
                      <List size={15} strokeWidth={1.6} />
                    </button>
                  </div>
                </div>
              </div>

              {/* GRID */}
              {viewMode === "grid" ? (
                <section className="wl-grid" aria-label="Saved pieces">
                  <AnimatePresence mode="popLayout">
                    {wishlist.map((item, idx) => {
                      const isOutOfStock = Number(item.stock_quantity ?? 0) <= 0;
                      return (
                        <motion.article
                          key={item.slug}
                          className={`wl-card ${isOutOfStock ? "wl-card-out" : ""}`}
                          layout
                          initial={{ opacity: 0, y: 22 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.3 } }}
                          transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.4), ease: EASE }}
                        >
                          <div className="wl-media">
                            <Link href={productHref(item)} className="wl-media-link" aria-label={`View ${item.name}`}>
                              {item.image ? (
                                <img src={item.image} alt={item.name} loading="lazy" />
                              ) : (
                                <span className="wl-media-empty"><Gem size={38} strokeWidth={0.9} /></span>
                              )}
                            </Link>

                            {isOutOfStock && <div className="wl-ribbon">Out of Stock</div>}

                            <button
                              className="wl-heart"
                              onClick={() => handleRemove(item.slug)}
                              aria-label={`Remove ${item.name} from wishlist`}
                              title="Remove from wishlist"
                            >
                              <Heart size={15} strokeWidth={1.5} />
                            </button>

                            <div className="wl-tray">
                              {!isOutOfStock && (
                                <button className="wl-tray-btn wl-tray-add" onClick={() => handleAddToCart(item)}>
                                  <ShoppingBag size={12} strokeWidth={1.6} />
                                  <span>Add to Bag</span>
                                </button>
                              )}
                              <Link
                                href={productHref(item)}
                                className={`wl-tray-btn wl-tray-view${isOutOfStock ? " wide" : ""}`}
                                aria-label={`View ${item.name}`}
                              >
                                {isOutOfStock ? (
                                  <>
                                    <span>View Details</span>
                                    <ArrowUpRight size={13} strokeWidth={1.6} />
                                  </>
                                ) : (
                                  <ArrowUpRight size={15} strokeWidth={1.6} />
                                )}
                              </Link>
                            </div>
                          </div>

                          <div className="wl-body">
                            {item.category && <span className="wl-cat">{item.category}</span>}
                            <Link href={productHref(item)} className="wl-name">{item.name}</Link>
                            <div className="wl-price">
                              <Price value={item.price} />
                              {isOutOfStock && <span className="wl-oos">Sold out</span>}
                            </div>
                          </div>
                        </motion.article>
                      );
                    })}
                  </AnimatePresence>
                </section>
              ) : (
                /* LIST */
                <section className="wl-list" aria-label="Saved pieces">
                  <AnimatePresence mode="popLayout">
                    {wishlist.map((item, idx) => {
                      const isOutOfStock = Number(item.stock_quantity ?? 0) <= 0;
                      return (
                        <motion.div
                          key={item.slug}
                          className={`wl-row ${isOutOfStock ? "wl-row-out" : ""}`}
                          layout
                          initial={{ opacity: 0, x: 18 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
                          transition={{ duration: 0.45, delay: Math.min(idx * 0.05, 0.4), ease: EASE }}
                        >
                          <Link href={productHref(item)} className="wl-row-media" aria-label={`View ${item.name}`}>
                            {item.image ? (
                              <img src={item.image} alt={item.name} loading="lazy" />
                            ) : (
                              <span className="wl-row-media-empty"><Gem size={26} strokeWidth={0.9} /></span>
                            )}
                          </Link>

                          <div className="wl-row-body">
                            {item.category && <span className="wl-row-cat">{item.category}</span>}
                            <Link href={productHref(item)} className="wl-row-name">{item.name}</Link>
                            <div className="wl-row-price">
                              <Price value={item.price} />
                              {isOutOfStock && <span className="wl-oos">Sold out</span>}
                            </div>
                          </div>

                          <div className="wl-row-actions">
                            {!isOutOfStock && (
                              <button className="wl-btn wl-btn-solid" onClick={() => handleAddToCart(item)}>
                                <ShoppingBag size={12} strokeWidth={1.6} />
                                <span>Add to Bag</span>
                              </button>
                            )}
                            <Link href={productHref(item)} className="wl-icon-btn" aria-label={`View ${item.name}`}>
                              <ArrowUpRight size={15} strokeWidth={1.6} />
                            </Link>
                            <button
                              className="wl-icon-btn danger"
                              onClick={() => handleRemove(item.slug)}
                              aria-label={`Remove ${item.name} from wishlist`}
                            >
                              <Trash2 size={14} strokeWidth={1.6} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </section>
              )}

              {/* summary */}
              <div className="wl-summary">
                <p className="wl-summary-info">
                  <em>{wishlist.length}</em> {wishlist.length === 1 ? "piece" : "pieces"} saved
                  {" · "}total value <em className="wl-sum-val"><Price value={totalValue} /></em>
                </p>
                <div className="wl-summary-actions">
                  <Link href="/collection" className="wl-btn wl-btn-ghost">
                    <Sparkles size={12} strokeWidth={1.6} />
                    <span>Continue Browsing</span>
                  </Link>
                  {inStockCount > 0 && (
                    <button className="wl-btn wl-btn-solid" onClick={handleAddAll}>
                      <span>Add all to Bag</span>
                      <ArrowRight size={12} strokeWidth={1.6} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
