'use client';

import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* ═════════════════════════════════════════════════════════════════
   GEMS GLOBAL — CTA v4  "LOOKBOOK"
   Exact reference layout:
   • 3 stacked sections, each 2 rows tall.
   • Section 1: BIG tile (2x2) on the LEFT  + 3x2 grid of squares on the RIGHT.
   • Section 2: 3x2 grid of squares on the LEFT + BIG tile (2x2) on the RIGHT.
   • Section 3: BIG tile (2x2) on the LEFT  + 3x2 grid of squares on the RIGHT.
   • Magazine-logo overlays (ELLE / VOGUE), SHOP NOW on feature tiles.
   • Cascading fade-in + upward slide on scroll-in (staggered).
   • Hover: slow image zoom, dark gradient fade-in, SHOP NOW lift.
   • Gentle scroll parallax on the big tiles.
   • Warm neutral palette, clean white bg, no rounded corners, 5px gaps.
   • Responsive (CSS-driven): 3-column editorial grid under 900px, 5-column
     alternating desktop pattern at 900px and up. Big tiles pin LEFT on mobile.
════════════════════════════════════════════════════════════════════ */

type Side = 'left' | 'right';
type MagPos = 'tl' | 'br';

type GalleryItem = {
  id: string;
  image_url: string;
  alt_text: string;
  is_big: boolean;
  side: Side;
  show_shop_now: boolean;
  magazine_text: string;
  magazine_position: MagPos;
  show_parallax: boolean;
  position: number;
  is_enabled: boolean;
  show_on_homepage: boolean;
  crop_position?: string;
  product_id?: string | null;
  products?: {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    price: number;
  } | null;
};

type Tile = {
  src: string;
  alt: string;
  big?: boolean;
  side?: Side;
  shop?: boolean;
  mag?: string;
  magPos?: MagPos;
  parallax?: boolean;
  crop?: string;
  productSlug?: string | null;
};

const GAP = 5;

const DEFAULT_TILES: Tile[] = [
  // ─── Section 1: feature LEFT, squares RIGHT ───
  { src: 'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?w=900&q=80&fit=crop', alt: 'Statement necklace editorial', big: true, side: 'left', shop: true, mag: 'ELLE', magPos: 'tl', parallax: true },
  { src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&q=80&fit=crop', alt: 'Drop earring close-up', big: false },
  { src: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80&fit=crop', alt: 'Hand with diamond bracelet', big: false },
  { src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80&fit=crop', alt: 'Editorial portrait', big: false, mag: 'VOGUE', magPos: 'br' },
  { src: 'https://images.unsplash.com/photo-1591209627710-a26a9a07e6d6?w=600&q=80&fit=crop', alt: 'Leather jacket & rings', big: false },
  { src: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=600&q=80&fit=crop', alt: 'Earring through the hair', big: false },
  { src: 'https://images.unsplash.com/photo-1614303384681-15ea2c5b4f96?w=600&q=80&fit=crop', alt: 'Gold initial pendant', big: false },

  // ─── Section 2: squares LEFT, feature RIGHT ───
  { src: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=900&q=80&fit=crop', alt: 'Kitten cover story', big: true, side: 'right', mag: 'ELLE', magPos: 'tl', parallax: true },
  { src: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80&fit=crop', alt: 'Solitaire ring', big: false },
  { src: 'https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=600&q=80&fit=crop', alt: 'Gold hoop earrings', big: false },
  { src: 'https://images.unsplash.com/photo-1633934542430-0905ccb5f050?w=600&q=80&fit=crop', alt: 'Emerald ring', big: false },
  { src: 'https://images.unsplash.com/photo-1599459183200-59c7687a0275?w=600&q=80&fit=crop', alt: 'Bridal jewelry set', big: false },
  { src: 'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600&q=80&fit=crop', alt: 'Sapphire necklace', big: false },
  { src: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80&fit=crop', alt: 'Stacked bracelets', big: false },

  // ─── Section 3: feature LEFT, squares RIGHT ───
  { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80&fit=crop', alt: 'The bridal story', big: true, side: 'left', shop: true, parallax: true },
  { src: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=600&q=80&fit=crop', alt: 'Earring close-up, soft light', big: false },
  { src: 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&q=80&fit=crop', alt: 'Layered necklaces', big: false },
  { src: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80&fit=crop', alt: 'Diamond bracelet, hand resting', big: false },
  { src: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80&fit=crop', alt: 'Golden hour close-up', big: false },
  { src: 'https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=80&fit=crop', alt: 'Side profile, gold earring', big: false },
  { src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&fit=crop', alt: 'Pearl pendant necklace', big: false },
];

export default function CTASection() {
  const rootRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* Column count + square row height are driven entirely by CSS now
     (viewport media queries + container-query units — see the <style> block).
     The old approach measured the grid's clientWidth in JS, which mis-counted
     columns whenever the mobile page had any horizontal overflow (clientWidth
     read wider than the screen → 5 columns on a phone) and flashed 5 columns
     for a frame before correcting. CSS is right on the first paint. */

  /* fetch gallery data */
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch('/api/img-gallery', { cache: 'no-store' });
        let data;
        if (res.ok) {
          data = await res.json();
        }
        if (Array.isArray(data.items)) {
          setItems(data.items);
        }
      } catch (e) {
        console.error('Failed to fetch gallery', e);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  /* cascade reveal — fire once when the wall scrolls into view */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* map items to tiles (filter enabled and homepage-only) */
  const TILES: Tile[] = items.length > 0
    ? items.filter(item => item.is_enabled && item.show_on_homepage).map(item => ({
      src: item.image_url,
      alt: item.alt_text,
      big: item.is_big,
      side: item.side,
      shop: item.show_shop_now,
      mag: item.magazine_text,
      magPos: item.magazine_position,
      parallax: item.show_parallax,
      crop: item.crop_position,
      productSlug: item.products?.slug || null
    }))
    : DEFAULT_TILES;

  /* Enhanced scroll parallax with individual tile tracking */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const progress = (rect.top + rect.height / 2 - vh / 2) / vh; // ~ -1..1
        const shift = Math.max(-1, Math.min(1, progress)) * -40; // Increased from -20 to -40 for more noticeable effect
        el.style.setProperty('--py', `${shift.toFixed(1)}px`);

        // Enhanced parallax for individual tiles
        const tiles = el.querySelectorAll('.lb-tile.px');
        tiles.forEach((tile, index) => {
          const tileRect = tile.getBoundingClientRect();
          const tileProgress = (tileRect.top + tileRect.height / 2 - vh / 2) / vh;
          // Different speeds for depth effect (index-based variation)
          const speed = 25 + (index % 3) * 10;
          const tileShift = Math.max(-1, Math.min(1, tileProgress)) * -speed;
          (tile as HTMLElement).style.setProperty('--tile-py', `${tileShift.toFixed(1)}px`);
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [TILES.length]);

  return (
    <section ref={rootRef} className={`lb${inView ? ' in' : ''}`} suppressHydrationWarning>
      <style>{`
        .lb{
          --w:#FFFFFF; --iv:#FDFCF9; --cr:#F8F4EE; --bd:#ECE5DA;
          --a:#8C7456; --a2:#A8916F; --a3:#C9B68F;
          --ink:#3A2E22; --mu:rgba(58,46,34,.55);
          --serif:var(--font-playfair,var(--font-cormorant)),'Cormorant Garamond',Georgia,serif;
          --sans:var(--font-jost,var(--font-dmsans)),'Jost','Montserrat',system-ui,sans-serif;
          --e:cubic-bezier(.22,1,.36,1);
          --spring:cubic-bezier(.34,1.56,.64,1);
          --py:0px;
          position:relative;background:var(--w);
          border-top:1px solid var(--bd);
          padding:clamp(46px,6vw,82px) clamp(14px,3vw,40px) clamp(44px,5vw,74px);
        }
        .lb *{ box-sizing:border-box; }

        /* ── editorial heading ── */
        .lb-head{ max-width:740px;margin:0 auto clamp(30px,4vw,50px);text-align:center; }
        .lb-eyebrow{ display:inline-flex;align-items:center;gap:10px;margin-bottom:13px; }
        .lb-eyebrow .ln{ width:28px;height:1px; }
        .lb-eyebrow .ln.l{ background:linear-gradient(90deg,transparent,var(--a3)); }
        .lb-eyebrow .ln.r{ background:linear-gradient(90deg,var(--a3),transparent); }
        .lb-eyebrow span{
          font-family:var(--sans);font-size:8px;font-weight:600;
          letter-spacing:.36em;text-transform:uppercase;color:var(--a);
        }
        .lb-title{
          font-family:var(--serif);font-size:clamp(30px,5vw,58px);font-weight:300;
          line-height:1.07;letter-spacing:.01em;color:var(--ink);margin:0;
        }
        .lb-title em{
          font-style:italic;font-weight:500;color:transparent;
          background:linear-gradient(120deg,var(--a3),var(--a) 50%,var(--a2));
          -webkit-background-clip:text;background-clip:text;
        }
        .lb-sub{
          margin:14px auto 0;max-width:470px;
          font-family:var(--sans);font-size:12px;font-weight:300;letter-spacing:.05em;
          line-height:1.7;color:var(--mu);
        }

        /* ── masonry grid ──
           Columns + square row height are viewport-driven here in CSS (not JS),
           so they always track real screen width. container-type lets the row
           height use container-query width units (cqw) for perfect squares. */
        .lb-grid-wrap{ max-width:1340px;margin:0 auto;container-type:inline-size; }
        .lb-grid{
          display:grid;grid-auto-flow:row dense;
          gap:${GAP}px;
          /* mobile / tablet: locked 3-column editorial grid (no 2- or 1-col collapse) */
          grid-template-columns:repeat(3,1fr);
          grid-auto-rows:calc((100cqw - ${GAP * 2}px) / 3);
        }
        /* ≥900px viewport → full 5-column desktop pattern */
        @media(min-width:900px){
          .lb-grid{
            grid-template-columns:repeat(5,1fr);
            grid-auto-rows:calc((100cqw - ${GAP * 4}px) / 5);
          }
        }
        /* big feature tiles: 2×2, pinned LEFT by default (mobile + desktop-left) */
        .lb-tile.big{ grid-column:1 / 3;grid-row:span 2; }
        /* desktop only: right-side feature tiles move to cols 4–5 (alternating) */
        @media(min-width:900px){
          .lb-tile.big.side-right{ grid-column:4 / 6; }
        }

        /* ── tile ── */
        .lb-tile{
          position:relative;display:block;overflow:hidden;
          background:linear-gradient(135deg,#F1ECE4,#E4DBCD);
          text-decoration:none;
          opacity:0;transform:translateY(20px);
          transition:opacity 1s var(--e),transform 1.05s var(--e);
        }
        .lb.in .lb-tile{ opacity:1;transform:translateY(0); }
        .lb-tile:hover{ z-index:3; }

        .lb-img{ position:absolute;inset:0;overflow:hidden;z-index:0; }
        .lb-img img{
          width:100%;height:100%;object-fit:cover;display:block;
          scale:1;transition:scale 1.15s var(--e),filter .6s ease;
          filter:saturate(.96);
        }
        .lb-tile:hover .lb-img img{ scale:1.06;filter:saturate(1.04); }
        .lb-tile.noimg .lb-img img{ display:none; }

        /* parallax tiles: oversize the image so the shift never shows edges, with enhanced animation */
        .lb-tile.px{ --tile-py:0px; }
        .lb-tile.px .lb-img img{
          height:140%;top:-20%;position:absolute;left:0;
          transform:translate3d(0,var(--tile-py,var(--py)),0);
          will-change:transform;
          transition:transform 0.15s linear;
        }
        .lb-tile.px:hover .lb-img img{
          transform:translate3d(0,var(--tile-py,var(--py)),0) scale(1.08);
          transition:transform 0.6s cubic-bezier(.22,1,.36,1);
        }

        /* dark gradient — base whisper, strengthens on hover */
        .lb-ov{
          position:absolute;inset:0;z-index:1;pointer-events:none;
          background:linear-gradient(to top,rgba(40,30,20,.55) 0%,rgba(40,30,20,.10) 38%,transparent 66%);
          opacity:0;transition:opacity .55s var(--e);
        }
        .lb-tile:hover .lb-ov{ opacity:1; }
        .lb-tile.big .lb-ov{ opacity:.5; }
        .lb-tile.big:hover .lb-ov{ opacity:1; }

        /* SHOP NOW button (feature tiles) */
        .lb-shop{
          position:absolute;left:0;right:0;bottom:0;z-index:2;
          display:flex;justify-content:center;
          padding:clamp(18px,2vw,30px);
        }
        .lb-shop-btn{
          display:inline-flex;align-items:center;gap:9px;
          padding:13px 30px;background:rgba(255,255,255,.95);
          color:var(--ink);
          font-family:var(--sans);font-size:9.5px;font-weight:700;
          letter-spacing:.22em;text-transform:uppercase;
          box-shadow:0 6px 18px -8px rgba(40,30,20,.5);
          transition:transform .35s var(--spring),box-shadow .4s var(--e),background .3s;
        }
        .lb-tile:hover .lb-shop-btn{
          transform:translateY(-3px) scale(1.04);
          background:#fff;
          box-shadow:0 14px 30px -10px rgba(40,30,20,.6);
        }
        .lb-shop-btn svg{ transition:transform .35s var(--e); }
        .lb-tile:hover .lb-shop-btn svg{ transform:translateX(4px); }

        /* magazine logo overlay — top-left by default, .br = bottom-right */
        .lb-mag{
          position:absolute;top:0;left:0;z-index:2;
          padding:clamp(12px,1.4vw,20px) clamp(14px,1.6vw,22px);
          font-family:var(--serif);font-weight:700;
          font-size:clamp(20px,2.4vw,38px);letter-spacing:.04em;
          color:#fff;line-height:1;
          text-shadow:0 2px 16px rgba(0,0,0,.45);
          opacity:0;transform:scale(.92);filter:blur(2px);
          transition:opacity 1.1s var(--e) .35s,transform 1.1s var(--e) .35s,filter 1.1s var(--e) .35s;
        }
        .lb-mag.br{ top:auto;left:auto;bottom:0;right:0;text-align:right; }
        .lb.in .lb-tile .lb-mag{ opacity:1;transform:scale(1);filter:blur(0); }
        .lb-tile:hover .lb-mag{ text-shadow:0 2px 22px rgba(255,247,235,.55),0 2px 14px rgba(0,0,0,.4); }

        /* tiny corner caption for plain close-ups (appears on hover) */
        .lb-cap{
          position:absolute;left:0;right:0;bottom:0;z-index:2;
          display:flex;align-items:center;gap:6px;
          padding:13px 14px;
          font-family:var(--sans);font-size:8.5px;font-weight:600;
          letter-spacing:.16em;text-transform:uppercase;color:#fff;
          opacity:0;transform:translateY(8px);
          transition:opacity .45s var(--e),transform .5s var(--e);
        }
        .lb-tile:hover .lb-cap{ opacity:.92;transform:translateY(0); }
        .lb-cap svg{ opacity:.8; }

        /* ── footer button ── */
        .lb-foot{ display:flex;justify-content:center;margin-top:clamp(34px,4vw,54px); }
        .lb-btn{
          display:inline-flex;align-items:center;gap:10px;
          padding:16px 40px;
          background:linear-gradient(135deg,var(--a),var(--a2));color:#fff;
          font-family:var(--sans);font-size:10px;font-weight:700;
          letter-spacing:.2em;text-transform:uppercase;text-decoration:none;
          box-shadow:0 12px 28px -12px rgba(140,116,86,.7);
          transition:transform .3s var(--spring),box-shadow .35s var(--e),filter .25s;
        }
        .lb-btn:hover{ transform:translateY(-2px);filter:brightness(1.05);box-shadow:0 18px 38px -12px rgba(140,116,86,.85); }
        .lb-btn:active{ transform:scale(.97); }
        .lb-btn svg{ transition:transform .3s var(--e); }
        .lb-btn:hover svg{ transform:translateX(4px); }

        .lb a:focus-visible{ outline:2px solid var(--a);outline-offset:3px; }

        @media(prefers-reduced-motion:reduce){
          .lb-tile,.lb-img img,.lb-mag,.lb-cap,.lb-shop-btn,.lb-btn{
            transition-duration:.01ms!important;
          }
          .lb-tile{ opacity:1;transform:none; }
          .lb-tile.px .lb-img img{ translate:0 0!important; }
        }
      `}</style>

      {/* heading */}
      <div className="lb-head">
        <div className="lb-eyebrow">
          <span className="ln l" />
          <span>The Lookbook</span>
          <span className="ln r" />
        </div>
        <h2 className="lb-title">Worn by those who <em>dare</em></h2>
        <p className="lb-sub">
          An editorial wall of moments, muses and masterpieces — step inside the story.
        </p>
      </div>

      {/* loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 0'
        }}>
          <Loader2 size={32} strokeWidth={1.5} className="animate-spin" style={{ color: 'var(--a)' }} />
        </div>
      )}

      {/* masonry wall */}
      {!loading && (
        <div className="lb-grid-wrap">
        <div className="lb-grid">
          {TILES.map((t, i) => (
            <Link
              key={i}
              href={t.productSlug ? `/products/${t.productSlug}` : '/collection'}
              className={`lb-tile ${t.big ? 'big' : 'small'}${t.big && t.side === 'right' ? ' side-right' : ''}${t.parallax ? ' px' : ''}`}
              style={{ transitionDelay: `${Math.min(i * 70, 900)}ms` }}
              aria-label={t.shop ? `Shop ${t.alt}` : t.alt}
            >
              <span className="lb-img">
                <img
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  draggable={false}
                  onError={(e) => { e.currentTarget.parentElement?.parentElement?.classList.add('noimg'); }}
                  style={{ objectPosition: t.crop || 'center' }}
                />
              </span>
              <span className="lb-ov" aria-hidden="true" />

              {t.mag && <span className={`lb-mag${t.magPos === 'br' ? ' br' : ''}`} aria-hidden="true">{t.mag}</span>}

              {t.shop && (
                <span className="lb-shop">
                  <span className="lb-shop-btn">Shop Now <ArrowRight size={12} strokeWidth={2.4} /></span>
                </span>
              )}

              {!t.shop && !t.mag && (
                <span className="lb-cap">{t.alt} <ArrowRight size={11} strokeWidth={2.2} /></span>
              )}
            </Link>
          ))}
        </div>
        </div>
      )}
    </section>
  );
}