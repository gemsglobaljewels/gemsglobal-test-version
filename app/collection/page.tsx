import { Metadata } from "next";
import { Suspense } from "react";
import CollectionDetails from "./CollectionDetails";
import { supabaseServer } from "@/lib/supabaseServer";

// Initial catalog list is non-personalized; cache it across requests (ISR) so
// every visit doesn't re-pull up to 1000 product rows from the DB. Live filtered
// results are still fetched client-side via /api/products on the client.
export const revalidate = 300;

async function getInitialProducts() {
  // Service role throughout: the anon reviews policy is unreliable, and SSR
  // must never come back empty because of an RLS hiccup.
  const supabase = supabaseServer;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return [];
  if (!data || data.length === 0) return [];

  // Fetch reviews for these products to calculate average rating and review count
  const productIds = data.map((p: any) => p.id);
  const { data: reviews } = await supabase
    .from("reviews")
    .select("product_id, rating")
    .in("product_id", productIds);

  // Calculate review stats per product
  const reviewStats: Record<string, { avg: number; count: number }> = {};
  if (reviews && reviews.length > 0) {
    reviews.forEach((r: any) => {
      const pid = String(r.product_id);
      if (!reviewStats[pid]) reviewStats[pid] = { avg: 0, count: 0 };
      reviewStats[pid].count++;
      reviewStats[pid].avg += Number(r.rating);
    });
    Object.keys(reviewStats).forEach((id) => {
      reviewStats[id].avg = Number(
        (reviewStats[id].avg / reviewStats[id].count).toFixed(1)
      );
    });
  }

  // Variant option tables live OUTSIDE the products row — without them the
  // cards can't resolve the first-variant price (they'd show the bare base,
  // e.g. ₹0). Same shape as /api/products (service role: RLS-proof).
  let allMetalOptions: any[] = [];
  let allSizeOptions: any[] = [];
  let allCaratOptions: any[] = [];
  let allVariantPrices: any[] = [];
  try {
    const [m, s, c] = await Promise.all([
      supabaseServer.from('product_metal_options').select('product_id, key, metal_name, price_modifier, is_default'),
      supabaseServer.from('product_size_options').select('product_id, key, size_name, price_modifier, is_default'),
      supabaseServer.from('product_carat_options').select('product_id, key, carat_name, price_modifier, is_default'),
    ]);
    if (!m.error) allMetalOptions = m.data || [];
    if (!s.error) allSizeOptions = s.data || [];
    if (!c.error) allCaratOptions = c.data || [];
  } catch { /* options stay empty — cards fall back to base price */ }
  try {
    const v = await supabaseServer.from('product_variant_prices').select('product_id, metal_key, carat_key, price_modifier');
    if (!v.error) allVariantPrices = v.data || [];
  } catch { /* per-row overrides unsupported — shared sums apply */ }

  // Attach rating and reviews count to each product
  return data.map((p: any) => {
    const pid = String(p.id);
    return {
      ...p,
      rating: reviewStats[pid] ? reviewStats[pid].avg : (Number(p.rating) || 0),
      reviews: reviewStats[pid] ? reviewStats[pid].count : (Number(p.reviews) || 0),
      metal_options: allMetalOptions.filter((mo: any) => mo.product_id === p.id).map((mo: any) => ({
        key: mo.key,
        name: mo.metal_name,
        price_modifier: mo.price_modifier,
        is_default: mo.is_default,
      })),
      size_options: allSizeOptions.filter((so: any) => so.product_id === p.id).map((so: any) => ({
        key: so.key,
        name: so.size_name,
        price_modifier: so.price_modifier,
        is_default: so.is_default,
      })),
      carat_options: allCaratOptions.filter((co: any) => co.product_id === p.id).map((co: any) => ({
        key: co.key,
        name: co.carat_name,
        price_modifier: co.price_modifier,
        is_default: co.is_default,
      })),
      variant_prices: allVariantPrices.filter((v: any) => v.product_id === p.id).map((v: any) => ({
        metal_key: v.metal_key,
        carat_key: v.carat_key,
        price_modifier: Number(v.price_modifier) || 0,
      })),
    };
  });
}

export const metadata: Metadata = {
  title: "Our Collections | Luxury Handcrafted Jewelry",
  description: "Explore Gems Global Jewels' exquisite collections of diamond rings, gold necklaces, and bridal jewelry. Find the perfect piece for your special moments.",
  keywords: "jewelry collections, diamond rings, gold necklaces, bridal jewelry, luxury jewelry surat, handcrafted jewelry india",
  openGraph: {
    title: "Our Collections | Gems Global Jewels",
    description: "Discover timeless elegance in our curated jewelry collections.",
    type: "website",
    url: "https://gemsglobaljewels.com/collection",
    images: [
      {
        url: "https://gemsglobaljewels.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Gems Global Jewels Collections",
      },
    ],
  },
};

export default async function Page() {
  const products = await getInitialProducts();
  return (
    <Suspense fallback={null}>
      <CollectionDetails initialProducts={products} />
    </Suspense>
  );
}
