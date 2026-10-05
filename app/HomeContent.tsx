"use client";

import Link from "next/link";
import HeaderMegaMenu from "@/components/HeaderMegaMenu";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Diamond,
} from "lucide-react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/HeroSection";
import ShopByCategories from "@/components/Categories";
import ShopByRecipient from "@/components/ShopByRecipient";
import RingsByStyle from "@/components/RingsByStyle";
import { ProductSlider } from "@/components/ProductSlider";
import InstagramFeed from "@/components/InstagramFeed";

const WhyChooseUs = dynamic(() => import("@/components/WhyChoose"), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse" />,
});

const DiamondShapes = dynamic(() => import("@/components/DiamondShapes"), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse" />,
});

const Testimonials = dynamic(() => import("@/components/Testimonials"), {
  ssr: false,
  loading: () => <div className="h-[400px] animate-pulse" />,
});

const ImgGallery = dynamic(() => import("@/components/ImgGallery"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] animate-pulse" />
  ),
});

export default function HomeContent({
  initialFeatured,
  heroData,
  initialStyles,
  initialDiamondShapes,
  initialCategories,
}: {
  initialFeatured: any[];
  heroData: any;
  initialStyles: any[];
  initialDiamondShapes: any[];
  initialCategories?: any[];
}) {
  const [featured, setFeatured] = useState<any[]>(initialFeatured || []);
  const [featuredLabel, setFeaturedLabel] = useState("Featured Products");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The Server Component parent already fetched featured products and passed
    // them in via `initialFeatured`. Only fall back to a client fetch when the
    // server returned nothing — otherwise every homepage visit triggered a
    // duplicate, uncached (`no-store`) /api/products request that re-pulled the
    // full featured payload the page already had. Behavior/UI is unchanged.
    if (initialFeatured && initialFeatured.length > 0) {
      return;
    }
    setLoading(true);
    loadFeatured();
  }, []);

  async function loadFeatured() {
    try {
      // Fetch specifically featured products
      const res = await fetch("/api/products?featured=true&limit=8", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Featured API failed");

      const data = await res.json();
      const products = data?.products || [];

      if (products.length > 0) {
        setFeaturedLabel("Featured Products");
        setFeatured(products);
      } else {
        // Fallback to latest products if no featured items exist
        const res2 = await fetch("/api/products?limit=8", {
          cache: "no-store",
        });
        if (!res2.ok) throw new Error("Latest API failed");

        const data2 = await res2.json();
        const products2 = data2?.products || [];

        if (products2.length > 0) {
          setFeaturedLabel("Latest Products");
          setFeatured(products2);
        }
      }
    } catch (e) {
      console.error("[Home] Load featured error:", e);
      // Keep initialFeatured if fetch fails
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-background dm-text relative"
      suppressHydrationWarning
    >
      <h1 className="sr-only">
        Best Gold and Diamond Jewelry in Surat - Gems Global Jewels
      </h1>
      <HeaderMegaMenu />
      <>
        <HeroSection initialHeroData={heroData} />
        <ShopByCategories initialCategories={initialCategories} />
        <ShopByRecipient />
        <RingsByStyle initialStyles={initialStyles} />
        <DiamondShapes initialDiamondShapes={initialDiamondShapes} />
        {/* Featured Products */}
        <section className="py-24 border-y border-[var(--c-accent)]/8">
          <div className="container mx-auto px-6 sm:px-4">
            {/* Simple elegant title like Rings by Style */}
            <p
              style={{
                margin: 0,
                padding: "0 0 48px",
                textAlign: "center",
                fontFamily:
                  "var(--font-main, Cormorant Garamond), Georgia, serif",
                fontSize: "clamp(12px, 2vw, 15px)",
                fontWeight: 400,
                letterSpacing: "0.55em",
                textTransform: "uppercase",
                color: "#1a2e4a",
              }}
            >
              {featuredLabel}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] bg-[var(--c-accent)]/5 animate-pulse rounded-sm"
                  />
                ))}
              </div>
            ) : (
              <ProductSlider products={featured} showHeader={false} />
            )}
          </div>
        </section>
        <InstagramFeed />
        <WhyChooseUs />
        <Testimonials />
        <ImgGallery />
      </>
      <Footer />
    </div>
  );
}
