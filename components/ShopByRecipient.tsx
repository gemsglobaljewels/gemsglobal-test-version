'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Category {
  id: number | string;
  name: string;
  slug: string;
  image_url: string;
}

/* Fallback slug from the display name, in case a row has none. */
function nameToSlug(name: string) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ShopByRecipient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories?recipient=true')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Response not ok');
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error('Failed to fetch recipient categories:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="sbr-root" style={{ paddingBottom: 64 }}>
        <style>{CSS}</style>
        <p className="sbr-title">Shop by Recipient</p>
        <div className="sbr-track">
          {[1, 2].map(i => (
            <article key={i} className="sbr-card animate-pulse">
              <div className="sbr-img-box" style={{ background: '#EDE8DF' }} />
              <div className="sbr-info">
                <div style={{ height: 24, width: 120, background: '#EDE8DF' }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="sbr-root">
      <style>{CSS}</style>

      <p className="sbr-title">Shop by Recipient</p>

      <div className="sbr-track">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/collection/${cat.slug || nameToSlug(cat.name)}`}
            className="sbr-card"
            aria-label={`Shop ${cat.name}`}
          >
            <div className="sbr-img-box">
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&h=900&fit=crop&q=85'}
                alt={cat.name}
                className="sbr-img"
              />
            </div>

            <div className="sbr-info">
              <p className="sbr-name">{cat.name}</p>
              <span className="sbr-cta">
                SHOP NOW
                <svg
                  className="sbr-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const CSS = `
.sbr-root {
  width: 100%;
  background: #fff;
  padding: 0 0 clamp(24px, 4vw, 48px);
  box-sizing: border-box;
}

.sbr-title {
  margin: 0;
  padding: 48px 0 0;
  text-align: center;
  font-family: var(--font-main, 'Cormorant Garamond', Georgia, serif);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: #1a2e4a;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .sbr-title { 
    font-size: 11px; 
    letter-spacing: 0.4em; 
    padding: 36px 0 0; 
    margin-bottom: 24px;
  }
}

.sbr-track {
  display: flex;
  justify-content: center;
  gap: clamp(20px, 2.5vw, 32px);
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 clamp(16px, 3vw, 48px);
  box-sizing: border-box;
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
}

.sbr-card {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: clamp(12px, 1.4vw, 20px);
  background: #EDE8DF;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  -webkit-user-drag: none;
  flex-shrink: 0;
  flex: 1;
  max-width: 400px;
}

/* Mobile: still side-by-side, no slider */
@media (max-width: 768px) {
  .sbr-track {
    gap: clamp(12px, 3vw, 16px);
    padding: 0 clamp(12px, 3vw, 16px);
  }
  .sbr-card {
    max-width: 300px;
  }
}

@media (max-width: 480px) {
  .sbr-track {
    gap: 8px;
    padding: 0 12px;
  }
}

.sbr-card:hover {
  box-shadow: 0 8px 32px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}
.sbr-card:focus-visible {
  box-shadow: 0 0 0 3px #C4965A;
}

.sbr-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}
.sbr-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}
.sbr-card:hover .sbr-img {
  transform: scale(1.05);
}

.sbr-info {
  padding: clamp(14px, 1.8vw, 20px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #EDE8DF;
  align-items: center;
}

.sbr-name {
  margin: 0;
  font-family: 'Cormorant Garamond', 'Cormorant', Georgia, 'Times New Roman', serif;
  font-size: clamp(14px, 1.6vw, 18px);
  font-weight: 600;
  color: #1a1714;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.sbr-cta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: clamp(9px, 0.9vw, 11px);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1a1714;
  text-decoration: none;
  transition: gap 0.3s ease;
}
.sbr-card:hover .sbr-cta {
  gap: 8px;
}
.sbr-chevron {
  flex-shrink: 0;
  color: #1a1714;
  transition: transform 0.3s ease;
}
.sbr-card:hover .sbr-chevron {
  transform: translateX(3px);
}
`;
