"use client";

import { useEffect, useState } from "react";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/authStore";
import ProductCard from "@/components/ProductCard";

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const loadItems = () => {
      const recent = getRecentlyViewed();
      // Only show if there are at least 2 items (don't show just the current product)
      setItems(recent);
    };

    loadItems();
    window.addEventListener("recently-viewed-updated", loadItems);
    return () => window.removeEventListener("recently-viewed-updated", loadItems);
  }, []);

  if (items.length <= 1) return null;

  return (
    <section className="recent-viewed-section">
      <div className="recent-viewed-container">
        <div className="recent-viewed-header">
          <h2 className="recent-viewed-title">Recently <em>Viewed</em></h2>
          <div className="recent-viewed-line" />
        </div>

        <div className="recent-viewed-grid">
          {items.slice(1, 5).map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .recent-viewed-section {
          padding: 80px 56px;
          background: var(--c-bg, #FAF9F6);
          position: relative;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .recent-viewed-section { padding: 60px 24px; }
        }
        .recent-viewed-container {
          max-width: 1440px;
          margin: 0 auto;
        }
        .recent-viewed-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
        }
        .recent-viewed-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 300;
          color: var(--c-text, #2C231E);
          white-space: nowrap;
        }
        .recent-viewed-title em {
          font-style: italic;
          color: var(--c-accent, #8F7A70);
        }
        .recent-viewed-line {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, rgba(var(--c-accent-rgb, 143,122,112), 0.3), transparent);
        }
        .recent-viewed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }
      `}</style>
    </section>
  );
}
