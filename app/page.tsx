import { Metadata } from "next";
import HomeContent from "./HomeContent";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 60;

async function getHeroData() {
    try {
        const { data, error } = await supabaseServer
            .from('hero_sections')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('[Page] GET Hero Error:', error);
            return null;
        }
        return data || null;
    } catch (err) {
        console.error('[Page] GET Hero Catch Error:', err);
        return null;
    }
}

const DEFAULT_RING_STYLES = [
    { key: 'solitaire', name: 'Solitaire', sub: 'Pure Elegance', desc: 'One diamond. Infinite meaning. The solitaire distils jewellery to its purest form — a single stone suspended in timeless light.', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'three-stone', name: 'Three Stone', sub: 'Timeless Trinity', desc: 'Past, present and future — three stones united in one enduring symbol. A ring that carries your whole story.', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'halo', name: 'Halo', sub: 'Radiant Aura', desc: 'A crown of diamonds encircles the centre stone, amplifying its brilliance and creating an unmistakable aura of light.', image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'floral-inspired', name: 'Floral Inspired', sub: "Nature's Beauty", desc: 'Inspired by petals in bloom — organic curves and hand-set diamonds that celebrate the living beauty of nature.', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=700&fit=crop&q=90', is_enabled: true },
    { key: 'hidden-halo', name: 'Hidden Halo', sub: 'Secret Sparkle', desc: 'A whisper of diamonds hidden beneath the centre stone — visible only to those who know where to look.', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop&q=90', is_enabled: true },
];

async function getRingStyles() {
    try {
        const LEAN = 'key, name, sub, desc, image, is_enabled, position';
        let data: any = null;
        let error: any = null;
        ({ data, error } = await supabaseServer
            .from('ring_styles')
            .select(`${LEAN}, category_ids, section_id`)
            .order('position', { ascending: true }));
        if (error) {
            // Pre-migration DB (no category_ids / section_id column yet) — keep
            // serving the real admin-managed styles instead of the fallback.
            const retry = await supabaseServer
                .from('ring_styles')
                .select(`${LEAN}, category_ids`)
                .order('position', { ascending: true });
            data = retry.data;
            error = retry.error;
        }
        if (error) {
            // Pre-migration DB (no category_ids column yet) — keep serving the
            // real admin-managed styles instead of the built-in fallback.
            const retry2 = await supabaseServer
                .from('ring_styles')
                .select(LEAN)
                .order('position', { ascending: true });
            data = retry2.data;
            error = retry2.error;
        }
        if (error) {
            console.error('[Page getRingStyles] Error:', error);
            return DEFAULT_RING_STYLES;
        }
        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) return DEFAULT_RING_STYLES;
        // NULL/missing (legacy or pre-migration) = every category / unplaced.
        return rows.map((r: any) => ({
            ...r,
            category_ids: Array.isArray(r.category_ids) ? r.category_ids : [],
            section_id: r.section_id || null,
        }));
    } catch (e) {
        console.error('[Page getRingStyles] Catch Error:', e);
        return DEFAULT_RING_STYLES;
    }
}

/* Homepage style sections — "Rings By Style", "Bracelets By Style" … Each row
   carries its own title, order and a show-on-home switch (migration 120).
   Returns null when the table does not exist yet, so the homepage can fall
   back to grouping styles by category on its own. */
async function getStyleSections() {
    try {
        const { data, error } = await supabaseServer
            .from('style_sections')
            .select('id, key, title, category_ids, position, is_active')
            .order('position', { ascending: true });
        if (error) return null;
        return (Array.isArray(data) ? data : []).map((s: any) => ({
            id: String(s.id),
            key: String(s.key || ''),
            title: String(s.title || s.key || ''),
            category_ids: Array.isArray(s.category_ids) ? s.category_ids : [],
            position: typeof s.position === 'number' ? s.position : 0,
            is_active: s.is_active !== false,
        }));
    } catch {
        return null;
    }
}

/* Categories used to title the homepage style sections (Rings / Necklaces /
   Bracelets …). Kept separate from getHomeCategories: that one returns display
   ids for links, this one must return the real UUIDs for category_ids matching. */
async function getStyleCategories() {
    try {
        const { data, error } = await supabaseServer
            .from('categories')
            .select('id, name, slug')
            .order('name', { ascending: true });
        if (error || !Array.isArray(data)) return [];
        return data.map((c: any) => ({
            id: String(c.id),
            name: String(c.name || ''),
            slug: String(c.slug || ''),
        }));
    } catch {
        return [];
    }
}

const DEFAULT_SHAPES = [
    { key: 'round',    name: 'Round',    sub: 'Classic brilliance', image: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'cushion',  name: 'Cushion',  sub: 'Soft & romantic',    image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'princess', name: 'Princess', sub: 'Modern & bold',       image: 'https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'emerald',  name: 'Emerald',  sub: 'Elegant step-cut',    image: 'https://images.unsplash.com/photo-1630699144867-df71a60bae5f?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'oval',     name: 'Oval',     sub: 'Elongated sparkle',   image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'marquise', name: 'Marquise', sub: 'Regal & elongated',   image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'pear',     name: 'Pear',     sub: 'Teardrop beauty',     image: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'heart',    name: 'Heart',    sub: 'Symbol of love',      image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'radiant',  name: 'Radiant',  sub: 'Vibrant brilliance',  image: 'https://images.unsplash.com/photo-1630699144867-df71a60bae5f?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
    { key: 'asscher',  name: 'Asscher',  sub: 'Vintage step-cut',    image: 'https://images.unsplash.com/photo-1599459183200-59c7687a0c70?w=200&h=200&q=90&fit=crop&auto=format', is_enabled: true },
];

async function getHomeCategories() {
    try {
        // Show flagged categories PLUS any real collection (has image + products)
        // so new admin uploads surface automatically instead of hiding behind
        // an unticked flag. Empty/imageless rows (e.g. test stubs) stay hidden.
        const { data, error } = await supabaseServer
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) {
            console.error('[Page getHomeCategories] Error:', error);
            return [];
        }
        const rows = Array.isArray(data) ? data : [];
        let counts: Record<string, number> = {};
        try {
            const { data: prods } = await supabaseServer.from('products').select('id, category_id');
            (Array.isArray(prods) ? prods : []).forEach((p: any) => {
                if (p?.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
            });
        } catch { /* counts stay empty — flagged rows still show */ }
        return rows
            .filter((c: any) => c?.show_on_home === true || ((c?.image_url || '').trim() !== '' && (counts[c.id] || 0) > 0))
            .map((c: any, i: number) => ({
                id: Number(c.id) || i + 1,
                name: String(c.name || ''),
                slug: String(c.slug || String(c.name || '').toLowerCase().replace(/\s+/g, '-')),
                image: String(c.image_url || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=700&h=700&q=85&fit=crop'),
                tag: c.tag ? String(c.tag) : null,
            }))
            .filter((c) => c.name);
    } catch (e) {
        console.error('[Page getHomeCategories] Catch Error:', e);
        return [];
    }
}

async function getDiamondShapes() {
    try {
        const { data, error } = await supabaseServer
            .from('diamond_shapes')
            .select('*')
            // Don't order by position as it might not exist in the DB schema yet
            .order('name', { ascending: true });
            
        if (error) {
            console.error('[Page getDiamondShapes] Error:', error);
            return DEFAULT_SHAPES;
        }
        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) return DEFAULT_SHAPES;
        // NULL/missing = every category (a shape is a stone cut).
        return rows.map((r: any) => ({
            ...r,
            category_ids: Array.isArray(r.category_ids) ? r.category_ids : [],
        }));
    } catch (e) {
        console.error('[Page getDiamondShapes] Catch Error:', e);
        return DEFAULT_SHAPES;
    }
}

async function getFeaturedProducts() {
    // Try featured first — filter in the DB to avoid fetching the whole table.
    const { data: featuredRows, error } = await supabaseServer
        .from("products")
        .select("*")
        .eq("is_featured", true)
        .limit(12);

    let products: any[] = [];
    if (!error && featuredRows && featuredRows.length > 0) {
        products = featuredRows;
    } else if (error) {
        // Fallback: some schemas store is_featured as text/int. If the typed
        // .eq filter errors, fetch a small batch and filter leniently in JS so
        // featured products are still surfaced (no behavior change).
        const { data: featured } = await supabaseServer
            .from("products")
            .select("*")
            .limit(50);
        if (featured && featured.length > 0) {
            products = featured.filter(p =>
                p.is_featured === true ||
                p.is_featured === 'true' ||
                p.is_featured === 1 ||
                String(p.is_featured).toLowerCase() === 'true'
            );
        }
    }

    if (products.length === 0) {
        // Fallback to latest products if no featured ones are found
        const { data: latest } = await supabaseServer
            .from("products")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(12);
        products = latest || [];
    }

    if (products.length === 0) return [];

    const productIds = products.map((p: any) => p.id);

    // Fetch variant options so cards show the first-configured variant price
    // (metal + carat modifiers, per-combination overrides, size) instead of
    // falling back to the bare base price which is often stored as 0.
    const { data: allMetalOptions } = await supabaseServer
        .from('product_metal_options')
        .select('product_id, key, metal_name, price_modifier, is_default')
        .in('product_id', productIds);

    const { data: allSizeOptions } = await supabaseServer
        .from('product_size_options')
        .select('product_id, key, size_name, price_modifier, is_default')
        .in('product_id', productIds);

    let allCaratOptions: any[] | null = null;
    try {
        const caratRes = await supabaseServer
            .from('product_carat_options')
            .select('product_id, key, carat_name, price_modifier, is_default')
            .in('product_id', productIds);
        allCaratOptions = caratRes.data;
    } catch {
        allCaratOptions = [];
    }

    let allVariantPrices: any[] = [];
    try {
        const varRes = await supabaseServer
            .from('product_variant_prices')
            .select('product_id, metal_key, carat_key, price_modifier')
            .in('product_id', productIds);
        if (!(varRes as any).error) {
            allVariantPrices = (varRes as any).data || [];
        }
    } catch {
        allVariantPrices = [];
    }

    // Fetch reviews for these products to calculate average rating and review count
    const { data: reviews } = await supabaseServer
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

    // Attach rating, reviews count, and variant options to each product
    return products.map((p: any) => {
        const pid = String(p.id);
        return {
            ...p,
            rating: reviewStats[pid] ? reviewStats[pid].avg : (Number(p.rating) || 0),
            reviews: reviewStats[pid] ? reviewStats[pid].count : (Number(p.reviews) || 0),
            metal_options: (allMetalOptions || []).filter((mo: any) => String(mo.product_id) === pid).map((mo: any) => ({
                key: mo.key,
                name: mo.metal_name,
                price_modifier: mo.price_modifier,
                is_default: mo.is_default,
            })),
            size_options: (allSizeOptions || []).filter((so: any) => String(so.product_id) === pid).map((so: any) => ({
                key: so.key,
                name: so.size_name,
                price_modifier: so.price_modifier,
                is_default: so.is_default,
            })),
            carat_options: (allCaratOptions || []).filter((co: any) => String(co.product_id) === pid).map((co: any) => ({
                key: co.key,
                name: co.carat_name,
                price_modifier: co.price_modifier,
                is_default: co.is_default,
            })),
            variant_prices: (allVariantPrices || []).filter((v: any) => String(v.product_id) === pid).map((v: any) => ({
                metal_key: v.metal_key,
                carat_key: v.carat_key,
                price_modifier: Number(v.price_modifier) || 0,
            })),
        };
    });
}

export const metadata: Metadata = {
    title: "Best Gold & Diamond Jewelry in Surat | Gems Global Jewels",
    description: "Gems Global Jewels offers premium diamond jewelry, authentic gold ornaments, and exclusive bridal collections in Surat. Top-rated jewelry shop for handcrafted rings, necklaces, and custom designs.",
    keywords: "best gold in surat, best jewelry in surat, best jewels in surat, top jewelry shop in surat, luxury diamond jewelry, handcrafted rings surat, bridal jewelry collections, custom gold ornaments, gems global jewels, engagement rings india, authentic gold jewelry",
    openGraph: {
        title: "Gems Global Jewels | Luxury Jewelry in Surat",
        description: "Discover timeless elegance and handcrafted perfection. Shop our exclusive diamond and gold collections.",
        url: "https://gemsglobaljewels.com",
        siteName: "Gems Global Jewels",
        images: [
            {
                url: "https://gemsglobaljewels.com/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Gems Global Jewels",
            },
        ],
        locale: "en_IN",
        type: "website",
    },
};

export default async function Page() {
    const [products, heroData, initialStyles, initialDiamondShapes, initialCategories, styleCategories, styleSections] = await Promise.all([
        getFeaturedProducts(),
        getHeroData(),
        getRingStyles(),
        getDiamondShapes(),
        getHomeCategories(),
        getStyleCategories(),
        getStyleSections(),
    ]);

    // Organization Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'JewelryStore',
        name: 'Gems Global Jewels',
        image: 'https://gemsglobaljewels.com/logo.png',
        '@id': 'https://gemsglobaljewels.com',
        url: 'https://gemsglobaljewels.com',
        telephone: '+91-YOUR-PHONE',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Your Street Address',
            addressLocality: 'Surat',
            addressRegion: 'Gujarat',
            postalCode: '395006',
            addressCountry: 'IN',
        },
        geo: {
            '@type': 'GeoCoordinates',
            latitude: 21.1702,
            longitude: 72.8311,
        },
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday'
            ],
            opens: '10:00',
            closes: '20:00'
        },
        sameAs: [
            'https://www.facebook.com/gemsglobaljewels',
            'https://www.instagram.com/gemsglobaljewels'
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <HomeContent initialFeatured={products} heroData={heroData} initialStyles={initialStyles} initialDiamondShapes={initialDiamondShapes} initialCategories={initialCategories} styleCategories={styleCategories} styleSections={styleSections} />
        </>
    );
}
