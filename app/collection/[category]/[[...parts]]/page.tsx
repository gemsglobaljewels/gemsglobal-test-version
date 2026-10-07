import type { Metadata } from "next";
import { Suspense } from "react";
import CategoryDetails from "./CategoryDetails";
import { supabaseServer } from "@/lib/supabaseServer";

// Category landing pages are per-slug and cacheable (ISR) — the interactive
// grid itself stays fully client-side inside <CategoryDetails />.
export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gemsglobaljewels.com').replace(/\/+$/, '');

function prettyName(slug: string): string {
  return String(slug || 'Collection')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function getCategory(slug: string): Promise<{ name: string; description?: string | null } | null> {
  try {
    const { data, error } = await supabaseServer
      .from('categories')
      .select('name, header_description')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    return { name: (data as any).name, description: (data as any).header_description || null };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const slug = String(category || '').toLowerCase();
  const cat = await getCategory(slug);
  const name = cat?.name || prettyName(slug);
  const title = `${name} | Luxury Handcrafted Jewellery`;
  const description =
    cat?.description ||
    `Shop ${name} at Gems Global Jewels — handcrafted luxury jewellery in ethically sourced gold and certified diamonds. Free insured worldwide delivery.`;
  const url = `${SITE_URL}/collection/${slug}`;

  return {
    title,
    description,
    keywords: [`${name}`, 'luxury jewelry', 'diamond jewelry india', 'handcrafted rings', 'bridal jewelry', 'custom jewelry'].join(', '),
    openGraph: {
      title,
      description,
      type: 'website',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      // Filtered views (?shape=, ?metal= …) stay crawlable but never indexed
      // as duplicates — canonical (above) always points at the clean slug URL.
      index: true,
      follow: true,
    },
  };
}

export default function CategoryPage() {
  return (
    <Suspense fallback={null}>
      <CategoryDetails />
    </Suspense>
  );
}
