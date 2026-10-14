'use client'

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    description?: string;
    price?: string;
    image?: string;
    link?: string;
    desc?: string;
    slug?: string;
}

interface Reel {
    id: string;
    videoUrl: string;
    thumbnail: string | null;
    productIds: string[];
    isEnabled: boolean;
}

interface Settings {
    username: string;
    instagramLink: string;
    logoUrl: string;
}

const DEFAULT_PRODUCTS: Product[] = [
    { id: "p1", name: "Pear Diamond Solitaire Ring", desc: "Lab-grown pear-cut diamond, 0.8ct. 18K white gold setting.", price: "₹28,500", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80", link: "/products/ring-pear-diamond", slug: "ring-pear-diamond" },
    { id: "p2", name: "Twisted Gold Band Ring", desc: "Handcrafted twisted 18K yellow gold band.", price: "₹18,900", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80", link: "/products/ring-twisted-band", slug: "ring-twisted-band" },
    { id: "p3", name: "Diamond Eternity Band", desc: "Full eternity band with 1.2ct total weight of brilliant-cut lab-grown diamonds.", price: "₹42,000", image: "https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=400&q=80", link: "/products/band-eternity", slug: "band-eternity" },
    { id: "p4", name: "Round Brilliant Solitaire", desc: "Classic 1ct round brilliant lab-grown diamond.", price: "₹35,000", image: "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=400&q=80", link: "/products/ring-round-solitaire", slug: "ring-round-solitaire" }
];

function IgIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <rect x="2" y="2" width="20" height="20" rx="5.5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1.1" fill="white" />
        </svg>
    );
}

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
    const router = useRouter();
    if (!product) return null;
    const imageUrl = product.image || '';
    const desc = product.description || product.desc || '';

    // Strip HTML tags from description
    const plainDesc = desc.replace(/<[^>]*>/g, '');
    // Shorten to 50 characters max
    const shortDesc = plainDesc.length > 50 ? plainDesc.substring(0, 50) + '...' : plainDesc;

    // Get product link
    const productLink = product.link || (product.slug ? `/products/${product.slug}` : '/');

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 1000,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.65)", padding: "16px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: "18px",
                    maxWidth: "340px",
                    overflow: "hidden", position: "relative",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.25)"
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: "10px", right: "10px", zIndex: 10,
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "rgba(0,0,0,0.45)", color: "#fff",
                        border: "none", cursor: "pointer", fontSize: "16px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.15s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.65)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.45)"}
                >×</button>

                <div style={{ width: "100%", height: "200px", background: "#f5f0eb", overflow: "hidden" }}>
                    <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>

                <div style={{ padding: "1rem 1.2rem 1.2rem" }}>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "#111", margin: "0 0 6px", lineHeight: 1.3 }}>{product.name}</p>
                    {shortDesc && <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.5, margin: "0 0 12px" }}>{shortDesc}</p>}
                    <div style={{ display: "flex" }}>
                        <button
                            onClick={() => {
                                router.push(productLink);
                            }}
                            style={{
                                flex: 1, padding: "10px", background: "#111", color: "#fff",
                                border: "none", borderRadius: "8px", fontSize: "13px",
                                fontWeight: 600, cursor: "pointer", textDecoration: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "background 0.15s"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#333"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#111"}
                        >View Product</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReelCard({ reel, products, onProductClick }: { reel: Reel; products: Product[]; onProductClick: (product: Product) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const productList = reel.productIds
        .map((pid: string) => products.find((p: Product) => p.id === pid))
        .filter(Boolean) as Product[];

    // Helper to get product image
    const getProductImage = (product: Product) => {
        return product.image || '';
    };

    const handleMouseEnter = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
            setPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setPlaying(false);
        }
    };

    const handleTap = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play().catch(() => { });
            setPlaying(true);
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    };

    return (
        <div
            style={{
                position: "relative", borderRadius: "12px", overflow: "hidden",
                aspectRatio: "9/16", cursor: "pointer", background: "#111", flexShrink: 0,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleTap}
        >
            <video
                ref={videoRef}
                src={reel.videoUrl}
                poster={reel.thumbnail || undefined}
                muted
                loop
                playsInline
                preload="metadata"
                style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover", display: "block",
                }}
            />

            <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)",
                pointerEvents: "none",
            }} />

            {!playing && (
                <div style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    pointerEvents: "none",
                }}>
                    <div style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        background: "rgba(0,0,0,0.38)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,4 20,12 6,20" />
                        </svg>
                    </div>
                </div>
            )}

            <div style={{ position: "absolute", top: "10px", right: "10px", opacity: 0.88 }}>
                <IgIcon />
            </div>

            {productList.length > 0 && (
                <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "8px 8px 10px",
                    display: "flex", gap: "5px", justifyContent: "center", flexWrap: "wrap",
                }}>
                    {productList.map((p) => (
                        <button
                            key={p.id}
                            title={p.name}
                            onClick={(e) => { e.stopPropagation(); onProductClick(p); }}
                            style={{
                                width: "32px", height: "32px", borderRadius: "6px",
                                background: "#fff", border: "1.5px solid rgba(255,255,255,0.95)",
                                padding: 0, cursor: "pointer", overflow: "hidden",
                                flexShrink: 0, transition: "transform 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            <img src={getProductImage(p)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function InstagramFeed() {
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [reels, setReels] = useState<Reel[]>([]);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);

    useEffect(() => {
        async function load() {
            try {
                const [feedRes, productsRes] = await Promise.all([
                    fetch('/api/instagram-feed', { cache: 'no-store' }),
                    fetch('/api/products?limit=100', { cache: 'no-store' })
                ]);

                let feedJ, productsJ;
                if (feedRes.ok) {
                    feedJ = await feedRes.json();
                }
                if (productsRes.ok) {
                    productsJ = await productsRes.json();
                }

                if (feedJ?.reels && Array.isArray(feedJ.reels)) {
                    setReels(feedJ.reels.filter((r: Reel) => r.isEnabled !== false));
                }
                if (feedJ?.settings) setSettings(feedJ.settings);

                // Handle both possible API response formats
                const productData = Array.isArray(productsJ)
                    ? productsJ
                    : Array.isArray(productsJ.products)
                        ? productsJ.products
                        : []
                if (productData.length > 0) {
                    // Add link field to each product
                    const productsWithLinks = productData.map((p: any) => {
                        const toSlug = (s: string) =>
                            String(s || '')
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                        const slug = p.slug || toSlug(p.name);
                        return {
                            ...p,
                            slug,
                            link: `/products/${slug}`,
                            image: p.image || p.images?.[0] || null
                        };
                    });
                    setProducts(productsWithLinks);
                }

            } catch (e) {
                console.error('Failed to load Instagram feed', e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Helper to get product image
    const getProductImage = (product: Product) => {
        return product.image || '';
    };

    // Helper to get product description
    const getProductDesc = (product: Product) => {
        return product.description || product.desc || '';
    };

    return (
        <section style={{ fontFamily: "sans-serif", padding: "clamp(48px,6vw,80px) 1rem", background: "#fff", width: "100%" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                    marginBottom: "40px", gap: "16px",
                }}>
                    <h2 className="home-sec-title">
                        Shop the Feed
                    </h2>

                    {settings && (
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                backgroundImage: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
                                width: "50px", height: "50px", borderRadius: "50%", padding: "2.5px"
                            }}>
                                <div style={{
                                    background: "#fff", width: "100%", height: "100%", borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
                                }}>
                                    {settings.logoUrl ? (
                                        <img src={settings.logoUrl} alt={settings.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#cc2366" }}>
                                            {settings.username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                <span style={{ fontSize: "12px", color: "#888" }}>@{settings.username}</span>
                                <a
                                    href={settings.instagramLink || `https://instagram.com/${settings.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "flex", alignItems: "center", gap: "5px",
                                        padding: "5px 12px", border: "1px solid #ddd",
                                        borderRadius: "20px", background: "#fff",
                                        cursor: "pointer", fontSize: "13px", color: "#111",
                                        fontFamily: "inherit", textDecoration: 'none'
                                    }}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <rect x="2" y="2" width="20" height="20" rx="5.5" />
                                        <circle cx="12" cy="12" r="4" />
                                        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
                                    </svg>
                                    Follow
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                        Loading Shop the Feed...
                    </div>
                ) : (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                        gap: "8px",
                        width: "100%",
                    }}>
                        {reels.map((reel) => (
                            <ReelCard key={reel.id} reel={reel} products={products} onProductClick={setActiveProduct} />
                        ))}
                    </div>
                )}
            </div>

            {activeProduct && <ProductModal product={activeProduct} onClose={() => setActiveProduct(null)} />}
        </section>
    );
}
