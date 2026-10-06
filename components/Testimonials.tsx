import { useState, useEffect, useRef, useCallback } from 'react';

const FONT_LINK_ID = 'testimonials-fonts';
function ensureFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

const COLORS = {
  bg: '#FAFAF8',
  ink: '#2D2621',
  inkSoft: '#6D6158',
  frame: '#F2EDE8',
  copper: '#A6785F',
  copperDeep: '#8F6A53',
  gold: '#D4A76A',
  green: '#10B981',
};

function SourceIcon({ source, size = 16 }: { source?: string | null, size?: number }) {
  const iconSource = (source || '').toLowerCase().trim();

  if (iconSource.includes('google')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }

  if (iconSource.includes('instagram')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="#E4405F" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="#E4405F" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1" fill="#E4405F" />
      </svg>
    );
  }

  if (iconSource.includes('facebook')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M15 8h-1.5A2.5 2.5 0 0011 10.5V12H9v2h2v8h2v-8h2l1-2h-3v-1.5C11 9.67 11.67 9 12.5 9H15V8z" fill="#1877F2" />
      </svg>
    );
  }

  return null;
}

function VerifiedPill({ size = 'md', isMobile }: { size?: 'sm' | 'md', isMobile?: boolean }) {
  const isSm = size === 'sm' || isMobile;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isSm ? 2 : 6,
      background: 'rgba(16,185,129,0.08)', padding: isSm ? '2px 6px' : '6px 10px',
      borderRadius: 999, color: COLORS.green, fontSize: isSm ? 8 : 12,
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
    }}>
      <svg width={isSm ? 8 : 14} height={isSm ? 8 : 14} viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20,6 9,17 4,12" />
      </svg>
      Verified
    </span>
  );
}

function Stars({ n = 5, size = 14 }: { n?: number, size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12">
          <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.7,11 6,8.8 2.3,11 3.5,7 0.5,4.5 4.5,4.5" fill={i < n ? '#F59E0B' : '#E5E1DA'} />
        </svg>
      ))}
    </span>
  );
}

interface Review {
  id: number | string;
  productImages: string[];
  avatar: string;
  name: string;
  location: string;
  rating: number;
  product: string;
  date: string;
  review: string;
  verified: boolean;
  tag: string;
  source: string;
}

const DEFAULT_REVIEWS: Review[] = [
  {
    id: 1,
    productImages: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=700&fit=crop',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=700&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&fit=crop',
    ],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&fit=crop',
    name: 'Kavitha Iyer',
    location: 'Chennai, Tamil Nadu',
    rating: 5,
    product: 'Bespoke Bangle Set',
    date: '6 weeks ago',
    review: "The bespoke concierge service is what sets this apart. I designed a custom bangle set and the team made the entire experience absolutely seamless — from the first sketch to the final fitting, nothing was rushed.",
    verified: true,
    tag: 'Bespoke Design',
    source: 'google',
  },
  {
    id: 2,
    productImages: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=700&fit=crop',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&fit=crop',
    ],
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=120&fit=crop',
    name: 'Ananya Reddy',
    location: 'Hyderabad, Telangana',
    rating: 5,
    product: 'Gold Hoop Earrings',
    date: '4 months ago',
    review: "The lifetime resizing guarantee here is unmatched. Two years on and they honoured it without a single question — that kind of follow-through is rare.",
    verified: true,
    tag: 'Lifetime Guarantee',
    source: 'instagram',
  },
  {
    id: 3,
    productImages: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=700&fit=crop',
    ],
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=120&fit=crop',
    name: 'Riya Shah',
    location: 'Surat, Gujarat',
    rating: 5,
    product: 'Diamond Solitaire Ring',
    date: '2 weeks ago',
    review: "I've shopped at many jewellers in Surat's diamond market but nothing compares to the finish and certification here. The GIA report gave me complete confidence.",
    verified: true,
    tag: 'GIA Certified',
    source: 'facebook',
  },
  {
    id: 4,
    productImages: [
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?q=80&w=700&fit=crop',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=700&fit=crop',
    ],
    avatar: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=120&fit=crop',
    name: 'Meera Nair',
    location: 'Kochi, Kerala',
    rating: 5,
    product: 'Bridal Mangalsutra',
    date: '3 months ago',
    review: "Ordered a custom mangalsutra for our wedding. Being from Kerala we have high standards for gold quality, and this exceeded every expectation.",
    verified: true,
    tag: 'Bridal Collection',
    source: 'google',
  },
];

function ReviewCard({
  review,
  onOpen,
  onHoverChange
}: {
  review: Review;
  onOpen: () => void;
  onHoverChange: (v: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => { setHovered(true); onHoverChange(true); }}
      onMouseLeave={() => { setHovered(false); onHoverChange(false); }}
      onTouchStart={() => onHoverChange(true)}
      onTouchEnd={() => onHoverChange(false)}
      style={{
        flex: isMobile ? '0 0 240px' : '0 0 350px',
        background: '#fff',
        borderRadius: isMobile ? 14 : 24,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, boxShadow 0.3s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      {/* image */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%', overflow: 'hidden' }}>
        <img
          src={review.productImages[0]}
          alt={review.product}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.6s ease', transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />

        {/* tag */}
        <div style={{
          position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16,
          background: '#fff',
          padding: isMobile ? '3px 8px' : '6px 14px',
          borderRadius: isMobile ? 6 : 12,
          fontSize: isMobile ? 9 : 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.copperDeep,
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          {review.tag}
        </div>

        {/* multiple images indicator */}
        {review.productImages.length > 1 && (
          <div style={{
            position: 'absolute', top: isMobile ? 8 : 16, right: isMobile ? 8 : 16,
            background: 'rgba(0,0,0,0.6)',
            padding: isMobile ? '3px 6px' : '6px 10px',
            borderRadius: isMobile ? 5 : 10,
            fontSize: isMobile ? 10 : 12,
            fontWeight: 600,
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <svg width={isMobile ? 10 : 14} height={isMobile ? 10 : 14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 4v2h8V4" />
            </svg>
            {review.productImages.length}
          </div>
        )}

        {/* date */}
        <div style={{
          position: 'absolute', bottom: isMobile ? 8 : 16, left: isMobile ? 8 : 16,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          padding: isMobile ? '3px 8px' : '6px 12px',
          borderRadius: isMobile ? 5 : 8,
          fontSize: isMobile ? 10 : 12,
          fontWeight: 500,
          color: '#fff',
          fontFamily: "'Inter', sans-serif",
        }}>
          {review.date}
        </div>
      </div>

      {/* content */}
      <div style={{ padding: isMobile ? '12px 12px 12px' : '22px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 8 : 14 }}>
          <img
            src={review.avatar}
            alt={review.name}
            style={{ width: isMobile ? 30 : 44, height: isMobile ? 30 : 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.frame}`, flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Fraunces', serif",
              fontSize: isMobile ? 13 : 17,
              fontWeight: 600,
              color: COLORS.ink,
              lineHeight: 1.2,
            }}>{review.name}</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: isMobile ? 10 : 12, color: COLORS.inkSoft,
              fontFamily: "'Inter', sans-serif", marginTop: 2,
            }}>
              {review.location}
              <SourceIcon source={review.source} size={isMobile ? 10 : 14} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginBottom: isMobile ? 8 : 12 }}>
          <Stars n={review.rating} size={isMobile ? 10 : 13} />
          {review.verified && <VerifiedPill size="sm" isMobile={isMobile} />}
        </div>

        <div style={{
          fontSize: isMobile ? 11.5 : 14.5,
          lineHeight: 1.65,
          color: COLORS.inkSoft,
          marginBottom: isMobile ? 10 : 18,
          fontFamily: "'Inter', sans-serif",
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{review.review}</div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '8px 10px' : '12px 18px',
          background: '#F2EDE8',
          borderRadius: isMobile ? 10 : 14,
          transition: 'all 0.3s ease',
          marginTop: isMobile ? 4 : 8,
        }}>
          <span style={{
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            color: COLORS.copperDeep,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontFamily: "'Inter', sans-serif",
          }}>
            View Review
          </span>
          <svg
            width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} viewBox="0 0 24 24"
            fill="none" stroke={COLORS.copperDeep}
            strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ transition: 'transform 0.25s ease', transform: hovered ? 'translateX(3px)' : 'none' }}
          >
            <polyline points="9,6 15,12 9,18" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal ---------- */
function ReviewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);
  const images = review.productImages.length > 0 ? review.productImages : [review.product];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t = requestAnimationFrame(() => setEntered(true));
    return () => { document.body.style.overflow = ''; cancelAnimationFrame(t); };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 220);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') setCurrentImage(i => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrentImage(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, handleClose]);

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(20,16,14,0.72)', backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 8 : 28,
        opacity: entered ? 1 : 0,
        transition: 'opacity 0.22s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: isMobile ? 16 : 28,
          overflow: 'hidden',
          maxWidth: isMobile ? '100%' : 1000,
          width: '100%',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          maxHeight: isMobile ? '95vh' : '90vh',
          boxShadow: '0 40px 80px rgba(0,0,0,0.35)',
          transform: entered ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(12px)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: isMobile ? 8 : 16, right: isMobile ? 8 : 16,
            width: isMobile ? 32 : 44,
            height: isMobile ? 32 : 44,
            background: '#fff',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <svg width={isMobile ? 16 : 22} height={isMobile ? 16 : 22} viewBox="0 0 24 24" fill="none" stroke="#2D2621" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* image side — velvet box mount */}
        <div style={{
          position: 'relative',
          flex: isMobile ? '0 0 auto' : '0 0 46%',
          background: `linear-gradient(160deg, ${COLORS.frame}, #E9E1D5)`,
          padding: isMobile ? 10 : 28,
          minHeight: isMobile ? 220 : 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            borderRadius: isMobile ? 12 : 18,
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(28,23,20,0.25)',
            minHeight: isMobile ? 180 : 360,
          }}>
            <img
              key={currentImage}
              src={images[currentImage]}
              alt={review.product}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeImg 0.35s ease' }}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i - 1 + images.length) % images.length); }}
                  style={{
                    position: 'absolute', left: isMobile ? 6 : 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? 28 : 38,
                    height: isMobile ? 28 : 38,
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <svg width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="#2D2621" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentImage(i => (i + 1) % images.length); }}
                  style={{
                    position: 'absolute', right: isMobile ? 6 : 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: isMobile ? 28 : 38,
                    height: isMobile ? 28 : 38,
                    background: 'rgba(255,255,255,0.92)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                >
                  <svg width={isMobile ? 14 : 18} height={isMobile ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="#2D2621" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: isMobile ? 5 : 8, marginTop: isMobile ? 8 : 14 }}>
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                  style={{
                    flex: 1, aspectRatio: '1 / 1', borderRadius: isMobile ? 8 : 12, overflow: 'hidden',
                    border: i === currentImage ? `2px solid ${COLORS.copper}` : '2px solid transparent',
                    opacity: i === currentImage ? 1 : 0.6, transition: 'all 0.25s ease', padding: 0, background: 'none',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* text side */}
        <div style={{
          flex: 1,
          padding: isMobile ? '16px 14px' : '40px 36px',
          background: '#fff',
          position: 'relative',
          overflowY: 'auto',
        }}>
          <div style={{
            marginBottom: isMobile ? 6 : 10,
            fontSize: isMobile ? 9 : 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.copperDeep,
          }}>{review.tag}</div>

          <div style={{ marginBottom: isMobile ? 12 : 22 }}>
            <Stars n={review.rating} size={isMobile ? 11 : 16} />
          </div>

          <p style={{
            fontSize: isMobile ? 13 : 18,
            lineHeight: 1.7,
            color: COLORS.ink,
            marginBottom: isMobile ? 18 : 32,
            fontFamily: "'Fraunces', serif",
          }}>“{review.review}”</p>

          <div style={{ height: 1, background: COLORS.frame, marginBottom: isMobile ? 14 : 24 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
            <img
              src={review.avatar}
              alt={review.name}
              style={{ width: isMobile ? 36 : 60, height: isMobile ? 36 : 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${COLORS.frame}` }}
            />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Fraunces', serif",
                fontSize: isMobile ? 15 : 20,
                fontWeight: 600,
                color: COLORS.ink,
              }}>{review.name}</div>
              <div style={{
                fontSize: isMobile ? 11 : 14,
                color: COLORS.inkSoft,
                marginBottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                {review.location}
                <SourceIcon source={review.source} size={isMobile ? 10 : 15} />
              </div>
              <div style={{
                fontSize: isMobile ? 9 : 12,
                color: '#A89E96',
                letterSpacing: '0.04em',
              }}>{review.date}</div>
            </div>
            {review.verified && <VerifiedPill size={isMobile ? 'sm' : 'md'} isMobile={isMobile} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main ---------- */
export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { ensureFonts(); }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch reviews from API
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch('/api/testimonials');
        let data;
        if (res.ok) {
          data = await res.json();
        }

        console.log('✅ API Response:', data); // Debug log

        if (Array.isArray(data) && data.length > 0) {
          const mappedReviews: Review[] = data.map((item: any) => {
            // Collect product images properly
            let productImages: string[] = [];

            // First check product_images (could be array or JSON string
            let rawProductImages = item.product_images;
            if (typeof rawProductImages === 'string') {
              try {
                rawProductImages = JSON.parse(rawProductImages);
              } catch (e) {
                console.log('Error parsing product_images string:', e);
                rawProductImages = null;
              }
            }

            if (rawProductImages && Array.isArray(rawProductImages) && rawProductImages.length > 0) {
              productImages = rawProductImages.filter((url: string) => url && url.trim().length > 0);
            }

            // If still empty, check product_image_url
            if (productImages.length === 0 && item.product_image_url && item.product_image_url.trim().length > 0) {
              productImages = [item.product_image_url];
            }

            // If still empty, use default from our default reviews (by index)
            if (productImages.length === 0) {
              const defaultIndex = (item.id || 0) % DEFAULT_REVIEWS.length;
              productImages = DEFAULT_REVIEWS[defaultIndex].productImages;
            }

            console.log('📸 Review', item.id, 'productImages:', productImages);

            return {
              id: item.id || Date.now() + Math.random(),
              productImages,
              avatar: item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&fit=crop',
              name: item.name || 'Anonymous',
              location: item.location || 'Surat, India',
              rating: item.rating || 5,
              product: item.product_name || 'Fine Jewelry',
              date: item.review_date ? getRelativeTime(item.review_date) : 'Recently',
              review: item.review || 'No review text',
              verified: item.is_verified !== undefined ? item.is_verified : true,
              tag: item.tag || 'Verified Buyer',
              source: item.source || 'google',
            };
          });
          setReviews(mappedReviews);
        }
      } catch (error) {
        console.error('❌ Error fetching testimonials:', error);
        // Keep default reviews if API fails
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  // Continuous auto-scroll using frame-delta (no restart on hover, no resume-snap glitch)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const speed = isMobile ? 20 : 32; // px/sec — even slower on mobile

    const tick = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      if (!isPausedRef.current) {
        const delta = (dt / 1000) * speed;
        const maxScroll = container.scrollWidth / 2;
        let next = container.scrollLeft + delta;
        if (next >= maxScroll) next -= maxScroll;
        container.scrollLeft = next;
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [loading, isMobile]);

  const displayReviews = [...reviews, ...reviews];

  if (loading) {
    return (
      <section style={{
        background: COLORS.bg, padding: '72px 0', position: 'relative', overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 18, color: COLORS.inkSoft }}>Loading reviews...</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeImg {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <section style={{
        background: COLORS.bg,
        padding: isMobile ? '32px 0' : '72px 0',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '0 12px' : '0 24px' }}>
          {/* Beautiful title like Rings by Style */}
          <p style={{
            margin: 0,
            padding: isMobile ? '48px 0 16px' : '56px 0 24px',
            textAlign: 'center',
            fontFamily: "var(--font-dmsans),'DM Sans',system-ui,sans-serif",
            fontSize: isMobile ? 12 : 15,
            fontWeight: 400,
            letterSpacing: isMobile ? '0.42em' : '0.55em',
            textTransform: 'uppercase',
            color: '#1a2e4a',
          }}>Testimonials</p>

          {/* Dynamic Rating Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 8,
            marginBottom: isMobile ? 24 : 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 28 : 48, fontWeight: 500, color: COLORS.ink }}>
                {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1) : '4.9'}
              </span>
              <span style={{ fontSize: isMobile ? 11 : 15, color: COLORS.inkSoft, fontWeight: 300, alignSelf: 'flex-end', paddingBottom: isMobile ? 3 : 12 }}>/5</span>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {[0, 1, 2, 3, 4].map(i => {
                const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length : 4.9;
                const isFilled = i < Math.round(avgRating);
                return (
                  <svg key={i} width={isMobile ? 12 : 20} height={isMobile ? 12 : 20} viewBox="0 0 12 12">
                    <polygon points="6,1 7.5,4.5 11.5,4.5 8.5,7 9.7,11 6,8.8 2.3,11 3.5,7 0.5,4.5 4.5,4.5" fill={isFilled ? '#F59E0B' : '#E5E1DA'} />
                  </svg>
                );
              })}
            </div>
            <div style={{ fontSize: isMobile ? 10 : 13, color: COLORS.inkSoft, fontFamily: "'Inter', sans-serif" }}>{reviews.length} reviews</div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: isMobile ? 24 : 90, height: '100%', zIndex: 10, pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 0, right: 0, width: isMobile ? 24 : 90, height: '100%', zIndex: 10, pointerEvents: 'none',
            }} />

            <div
              ref={scrollContainerRef}
              style={{
                display: 'flex',
                gap: isMobile ? 10 : 24,
                overflowX: 'auto',
                overflowY: 'hidden',
                padding: '6px 4px 20px',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
              onMouseEnter={() => { isPausedRef.current = true; }}
              onMouseLeave={() => { isPausedRef.current = false; }}
              onTouchStart={() => { isPausedRef.current = true; }}
              onTouchEnd={() => { isPausedRef.current = false; }}
            >
              {displayReviews.map((review, index) => (
                <ReviewCard
                  key={`${review.id}-${index}`}
                  review={review}
                  onOpen={() => setSelectedReview(review)}
                  onHoverChange={(v) => { isPausedRef.current = v; }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {selectedReview && <ReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} />}
    </>
  );
}

// Helper function to convert date string to relative time
function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (error) {
    return 'Recently';
  }
}
