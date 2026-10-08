import { Metadata } from "next";
import ProductDetails from "./ProductDetails";
import { supabaseServer } from "@/lib/supabaseServer";
import { loadGlobalSizes, buildProductSizes } from "@/lib/productSizes";

// Product detail is non-personalized; cache each rendered page (ISR) instead of
// re-running 4 Supabase queries (product + all categories + metal/size options)
// on every visit. Prices/stock refresh on the revalidate interval.
export const revalidate = 300;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categoryHierarchy?: string[];
  slug: string;
  images: string[];
  image?: string;
  rating: number;
  reviews: number;
  metal: string;
  style: string;
  stock_quantity: number;
  details: Record<string, any>;
  tags: string[];
  diamond_shape?: string;
  color?: string;
  carat?: string | number;
  clarity?: string;
  sku?: string;
  stock?: number;
  updated_at?: string;
  created_at?: string;
  metal_options?: any[];
  size_options?: any[];
  carat_options?: any[];
  variant_prices?: Array<{ metal_key: string; carat_key: string; price_modifier: number }>;
  discount_percent?: number;
  label?: string | null;
}

async function getProduct(slug: string): Promise<Product | null> {
  const { data, error } = await supabaseServer
    .from("products")
    .select("*, categories:categories(*)")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  // Fetch all categories for hierarchy — only the fields the parent-walk uses.
  const { data: allCategories } = await supabaseServer
    .from('categories')
    .select('id, name, parent_category_id');

  let categoryHierarchy: string[] = [];
  let categoryName = data.category || (data.categories?.name) || 'Fine Jewelry';

  if (allCategories && data.categories) {
    let current = data.categories;
    categoryHierarchy = [current.name];
    while (current?.parent_category_id) {
      const parent = allCategories.find(c => c.id === current.parent_category_id);
      if (parent) {
        categoryHierarchy.unshift(parent.name);
        current = parent;
      } else break;
    }
    // Show just the most specific category instead of joining
    if (categoryHierarchy.length > 0) {
      categoryName = categoryHierarchy[categoryHierarchy.length - 1];
    }
  }

  const { data: metalOptions } = await supabaseServer
    .from('product_metal_options')
    .select('*')
    .eq('product_id', data.id)
    .order('created_at', { ascending: true });

  const { data: sizeOptions } = await supabaseServer
    .from('product_size_options')
    .select('*')
    .eq('product_id', data.id)
    .order('created_at', { ascending: true });

  // Category-aware sizes: saved per-product rows win, otherwise the global
  // sizes that apply to this category (so a necklace offers 14–24 inch even
  // when admin never ticked sizes for it). See lib/productSizes.ts.
  const globalSizes = await loadGlobalSizes();
  const sizeRows = buildProductSizes(sizeOptions || [], data.category_id, globalSizes);

  const { data: caratOptions } = await supabaseServer
    .from('product_carat_options')
    .select('*')
    .eq('product_id', data.id)
    .order('created_at', { ascending: true });

  // Per-variant (metal x carat) price overrides (migration 116). Missing table
  // or no rows simply means shared metal+carat sums apply.
  let variantPrices: any[] = [];
  try {
    const res = await supabaseServer
      .from('product_variant_prices')
      .select('metal_key, carat_key, price_modifier')
      .eq('product_id', data.id);
    if (!res.error) variantPrices = res.data || [];
  } catch {
    variantPrices = [];
  }

  return {
    ...data,
    category: categoryName,
    categoryHierarchy,
    metal_options: (metalOptions || []).map((mo: any) => ({
      key: mo.key,
      name: mo.metal_name,
      price_modifier: Number(mo.price_modifier) || 0,
      is_default: mo.is_default
    })),
    size_options: sizeRows,
    carat_options: (caratOptions || []).map((co: any) => ({
      key: co.key,
      name: co.carat_name,
      price_modifier: Number(co.price_modifier) || 0,
      is_default: co.is_default
    })),
    variant_prices: (variantPrices || []).map((v: any) => ({
      metal_key: v.metal_key,
      carat_key: v.carat_key,
      price_modifier: Number(v.price_modifier) || 0
    }))
  } as Product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com';

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested jewelry piece could not be found."
    };
  }

  const title = `${product.name} | Luxury Handcrafted Jewelry`;
  const description = product.description.substring(0, 160) || `Buy ${product.name} handcrafted jewelry at Gems Global Jewels. Premium quality, ethically sourced materials.`;
  const image = product.images?.[0] || product.image || `${siteUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category,
      product.metal,
      product.style,
      'luxury jewelry surat',
      'diamond jewelry india',
      'custom jewelry',
      'handcrafted rings',
      'bridal jewelry',
      ...product.tags || []
    ].join(', '),
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${siteUrl}/products/${product.slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${siteUrl}/products/${product.slug}`,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com';

  if (!product) {
    return <div>Product not found</div>;
  }

  // JSON-LD Structured Data
  // Variant products quote the FIRST-variant (default configuration) price —
  // the same row the PDP opens with — never the bare base.
  const startingRetail = (() => {
    const base = Number(product.price) || 0;
    const metals: any[] = Array.isArray(product.metal_options) ? product.metal_options : [];
    const carats: any[] = Array.isArray(product.carat_options) ? product.carat_options : [];
    const saved: any[] = Array.isArray(product.variant_prices) ? product.variant_prices : [];
    const dispM = (o: any) => String(o?.name ?? o?.metal_name ?? '');
    const dispC = (o: any) => String(o?.name ?? o?.carat_name ?? '');
    if (metals.length > 0 && carats.length > 0) {
      const metalByKey: Record<string, any> = {};
      metals.forEach((m: any) => { if (m?.key) metalByKey[m.key] = m; });
      const caratByKey: Record<string, any> = {};
      carats.forEach((c: any) => { if (c?.key) caratByKey[c.key] = c; });
      const valid = saved.filter((v: any) => v && metalByKey[v.metal_key] && caratByKey[v.carat_key]);
      if (valid.length > 0) {
        const dm = dispM(metals.find((m: any) => m?.is_default));
        const dc = dispC(carats.find((c: any) => c?.is_default));
        const hit = (dm && dc)
          ? valid.find((v: any) => dispM(metalByKey[v.metal_key]) === dm && dispC(caratByKey[v.carat_key]) === dc)
          : undefined;
        const row = hit ?? valid[0];
        return base + (Number(row.price_modifier) || 0);
      }
      const m = metals.find((x: any) => x?.is_default) ?? metals[0];
      const c = carats.find((x: any) => x?.is_default) ?? carats[0];
      return base + (Number(m?.price_modifier) || 0) + (Number(c?.price_modifier) || 0);
    }
    if (metals.length > 0) {
      const m = metals.find((x: any) => x?.is_default) ?? metals[0];
      return base + (Number(m?.price_modifier) || 0);
    }
    if (carats.length > 0) {
      const c = carats.find((x: any) => x?.is_default) ?? carats[0];
      return base + (Number(c?.price_modifier) || 0);
    }
    return base;
  })();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images || [product.image],
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Gems Global Jewels',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: 'USD',
      // Expose the actual sale price customers pay when the item is discounted.
      price: (() => {
        const d = Math.round(Number(product.discount_percent))
        const pct = Number.isFinite(d) ? Math.max(0, Math.min(95, d)) : 0
        return pct > 0 ? Math.round(startingRetail * (1 - pct / 100) * 100) / 100 : startingRetail
      })(),
      availability: (product.stock_quantity ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Gems Global Jewels',
      },
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviews || 0,
    } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetails initialProduct={product} slug={slug} />
    </>
  );
}
