"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, X, Plus, Upload, Video, Diamond, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";
import { resolveAdminFxRate } from "@/lib/adminRate";

const CSS = `
.ep-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ep-chip {
  height: 34px; padding: 0 14px;
  background: #fff; border: 1px solid var(--c-border); border-radius: 999px;
  font-family: var(--font-dmsans);
  font-size: 12px; font-weight: 500; color: var(--c-text-muted);
  cursor: pointer; transition: .2s cubic-bezier(.4,0,.2,1);
}
.ep-chip:hover { border-color: var(--c-accent); color: var(--c-accent); }
.ep-chip.on {
  background: var(--c-accent); border-color: var(--c-accent); color: #fff;
  box-shadow: var(--shadow-sm);
}

.ep-opt-grid { display: grid; grid-template-columns: 2.5fr 2fr 0.8fr 0.5fr; gap: 12px; align-items: center; }
.ep-opt-head {
  border-bottom: 1px solid var(--c-border); padding-bottom: 8px;
  font-family: var(--font-dmsans);
  font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  color: var(--c-text-muted);
}
.ep-opt-name { font-family: var(--font-dmsans); font-size: 13px; cursor: pointer; font-weight: 500; color: var(--c-text); }
.ep-opt-add { border-top: 1px dashed var(--c-border); padding-top: 16px; margin-top: 16px; }
.ep-icon-del {
  background: none; border: none; cursor: pointer; color: var(--c-danger);
  display: flex; align-items: center; justify-content: center; padding: 4px;
}

/* Flat option grid (5 cols) — materials / diamond weights / sizes */
.ep-mc-grid { display: grid; grid-template-columns: 0.5fr 1.6fr 1.4fr 1.6fr 0.5fr; gap: 12px; align-items: center; }
.ep-combo-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
.ep-glob-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.ep-glob-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 6px 0 12px;
  background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 999px;
  font-family: var(--font-dmsans); font-size: 11px; font-weight: 500; color: var(--c-text);
}
.ep-glob-chip button {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%; border: none; cursor: pointer;
  background: transparent; color: var(--c-danger);
}
.ep-glob-chip button:hover { background: var(--c-danger); color: #fff; }
.ep-mc-head {
  border-bottom: 1px solid var(--c-border); padding: 0 4px 10px;
  font-family: var(--font-dmsans);
  font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
  color: var(--c-text-muted);
}
.ep-mc-row { padding: 6px 4px; border-bottom: 1px dashed rgba(0,0,0,0.06); }
.ep-mc-row:hover { background: rgba(140,116,86,0.04); border-radius: 6px; }
.ep-mc-cell { font-family: var(--font-dmsans); font-size: 13px; font-weight: 500; color: var(--c-text); }
.ep-mc-cell-muted { font-size: 12px; color: var(--c-text-muted); font-weight: 400; }
.ep-mc-check { display: flex; justify-content: center; }
.ep-mc-del { display: flex; justify-content: center; }

/* Main image zone */
.ep-img-main-zone {
  position: relative;
  aspect-ratio: 1; width: 100%;
  border: 1px dashed var(--c-border-strong); border-radius: var(--radius-lg);
  background: var(--c-surface); overflow: hidden; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: .2s cubic-bezier(.4,0,.2,1);
}
.ep-img-main-zone:hover { border-color: var(--c-accent); }
.ep-img-main-zone img { width: 100%; height: 100%; object-fit: cover; }
.ep-img-main-hint {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  font-family: var(--font-dmsans);
  color: var(--c-text-muted); font-size: 12px;
}
.ep-img-main-hint svg { color: var(--c-accent); }
.ep-img-remove, .ep-thumb-remove {
  position: absolute; top: 6px; right: 6px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(44,35,30,.55); color: #fff; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: .2s cubic-bezier(.4,0,.2,1);
}
.ep-img-remove:hover, .ep-thumb-remove:hover { background: var(--c-danger); }

/* Thumbnails */
.ep-thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 10px; }
.ep-thumb-add {
  aspect-ratio: 1;
  border: 1px dashed var(--c-border-strong); border-radius: var(--radius);
  background: var(--c-surface); cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  font-family: var(--font-dmsans);
  font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
  color: var(--c-text-muted); transition: .2s cubic-bezier(.4,0,.2,1);
}
.ep-thumb-add:hover { border-color: var(--c-accent); color: var(--c-accent); }
.ep-thumb {
  position: relative; aspect-ratio: 1;
  border: 1px solid var(--c-border); border-radius: var(--radius);
  background: var(--c-surface); overflow: hidden;
}
.ep-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ep-thumb-video { width: 100%; height: 100%; background: var(--c-surface); display: flex; align-items: center; justify-content: center; }

/* Uploading indicator */
.ep-uploading {
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
  font-family: var(--font-dmsans);
  font-size: 12px; color: var(--c-text-muted);
}
.ep-uploading-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--c-accent); animation: epDotPulse 1s infinite;
}
.ep-save-dot {
  width: 6px; height: 6px; border-radius: 50%; background: #fff;
  animation: epDotPulse 1s infinite;
}

/* Sticky actions */
.ep-actions-card { position: sticky; top: 24px; }

@keyframes epSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.ep-loading-gem { color: var(--c-accent); animation: epSpin 2s linear infinite; }
@keyframes epDotPulse { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
`

const DIAMOND_CUTS = ['Good', 'Very Good', 'Excellent', 'Ideal', '8X']
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30, 40, 50]
const LABEL_PRESETS = ['Popular', 'Limited', 'Featured', 'New', 'Best Seller', 'Sale', 'Exclusive']

function isVideo(u: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(u) || /youtube\.com|youtu\.be|vimeo\.com/i.test(u)
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const mainFileRef = useRef<HTMLInputElement>(null)

  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<string>("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")
  const [productData, setProductData] = useState<any>(null)

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category_id)
  }, [categories])

  const childCategories = useMemo(() => {
    if (!selectedRootCategoryId) return []
    return categories.filter(c => c.parent_category_id === selectedRootCategoryId)
  }, [categories, selectedRootCategoryId])

  useEffect(() => {
    const finalCategoryId = selectedSubCategoryId || selectedRootCategoryId;
    const finalCategoryObj = categories.find(c => c.id === finalCategoryId);
    const finalCategoryName = finalCategoryObj ? finalCategoryObj.name : '';
    setFormData(p => {
      if (p.category === finalCategoryName) return p;
      return { ...p, category: finalCategoryName };
    });
  }, [selectedRootCategoryId, selectedSubCategoryId, categories]);

  useEffect(() => {
    if (!productData || categories.length === 0) return

    let activeCategory = categories.find(c => c.id === productData.category_id)
    if (!activeCategory && productData.category) {
      activeCategory = categories.find(c => c.name === productData.category)
    }

    if (activeCategory) {
      if (activeCategory.parent_category_id) {
        setSelectedRootCategoryId(activeCategory.parent_category_id)
        setSelectedSubCategoryId(activeCategory.id)
      } else {
        setSelectedRootCategoryId(activeCategory.id)
        setSelectedSubCategoryId("")
      }
    } else {
      // Fallback
      const firstParent = categories.find(c => !c.parent_category_id)
      if (firstParent) {
        setSelectedRootCategoryId(firstParent.id)
        setSelectedSubCategoryId("")
      }
    }
  }, [productData, categories])
  const moreFileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: '', category: '', price: '', description: '',
    carat: '', color: '', clarity: '', metal: '', style: '',
    diamond_shape: '', diamond_cut: '', is_featured: false, sku: '', slug: '',
  })
  const [discountPercent, setDiscountPercent] = useState(0)
  const [label, setLabel] = useState('')
  const [metalOptions, setMetalOptions] = useState<any[]>([])
  const [selectedMetals, setSelectedMetals] = useState<string[]>([])
  const [productMetalPrices, setProductMetalPrices] = useState<Record<string, string>>({})
  const [newMetalName, setNewMetalName] = useState('')
  const [newMetalPrice, setNewMetalPrice] = useState('0')
  const [sizeOptions, setSizeOptions] = useState<any[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [productSizePrices, setProductSizePrices] = useState<Record<string, string>>({})
  const [newSizeName, setNewSizeName] = useState('')
  const [newSizePrice, setNewSizePrice] = useState('0')

  // Carat Options
  const [caratOptions, setCaratOptions] = useState<any[]>([])
  const [selectedCarats, setSelectedCarats] = useState<string[]>([])
  const [productCaratPrices, setProductCaratPrices] = useState<Record<string, string>>({})
  const [newCaratName, setNewCaratName] = useState('')
  const [newCaratPrice, setNewCaratPrice] = useState('0')

  // Combined Metal × Carat view helpers: per-row hide (trash/untick),
  // search, and show-hidden toggle. Selection itself stays flat
  // (selectedMetals / selectedCarats) — same model the storefront uses.
  const [hiddenCombos, setHiddenCombos] = useState<Record<string, boolean>>({})
  const [comboSearch, setComboSearch] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  // Per-row independent selection: one checkbox toggles ONE variant only.
  // Flat selectedMetals/selectedCarats stay synced as the union (storefront model).
  const [comboSel, setComboSel] = useState<Record<string, boolean>>({})
  const recomputeFlat = (sel: Record<string, boolean>, hid: Record<string, boolean>) => {
    const mSet = new Set<string>();
    const cSet = new Set<string>();
    Object.keys(sel).forEach(k => {
      if (sel[k] && !hid[k]) {
        const parts = k.split('__');
        if (parts[0]) mSet.add(parts[0]);
        if (parts[1]) cSet.add(parts[1]);
      }
    });
    setSelectedMetals(Array.from(mSet));
    setSelectedCarats(Array.from(cSet));
  };
  const toggleCombo = (m: any, c: any, vkey: string, on: boolean) => {
    const nSel = { ...comboSel };
    const nHid = { ...hiddenCombos };
    if (on) {
      nSel[vkey] = true;
      delete nHid[vkey];
      if (selectedMetals.indexOf(m.key) === -1) setSelectedMetals([...selectedMetals, m.key]);
      if (selectedCarats.indexOf(c.key) === -1) setSelectedCarats([...selectedCarats, c.key]);
      if (!productMetalPrices[m.key]) {
        const g = priceCurrency === 'USD' ? m.price_modifier : (m.price_modifier || 0) * fxRate;
        setProductMetalPrices(pm => ({ ...pm, [m.key]: String(g || 0) }));
      }
      if (!productCaratPrices[c.key]) {
        const g = priceCurrency === 'USD' ? c.price_modifier : (c.price_modifier || 0) * fxRate;
        setProductCaratPrices(pc => ({ ...pc, [c.key]: String(g || 0) }));
      }
    } else {
      delete nSel[vkey];
      nHid[vkey] = true;
    }
    setComboSel(nSel);
    setHiddenCombos(nHid);
    recomputeFlat(nSel, nHid);
  };
  const hideCombo = (vkey: string) => {
    const nSel = { ...comboSel };
    const nHid = { ...hiddenCombos };
    delete nSel[vkey];
    nHid[vkey] = true;
    setComboSel(nSel);
    setHiddenCombos(nHid);
    recomputeFlat(nSel, nHid);
  };
  // Per-row variant rates (independent per Metal x Carat combo), display-currency strings.
  const [variantOverrides, setVariantOverrides] = useState<Record<string, string>>({})
  // False until migration 116_product_variant_prices.sql has run (then per-row rates persist).
  const [variantSupported, setVariantSupported] = useState(true)

  // Dynamic Custom Option / Spec Sections
  const [customSections, setCustomSections] = useState<{
    id: string;
    title: string;
    items: { key: string; name: string; price_modifier: number; is_enabled?: boolean }[];
  }[]>([])
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({})
  const [newItemPrices, setNewItemPrices] = useState<Record<string, string>>({})

  const [productId, setProductId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [mainImgUrl, setMainImgUrl] = useState('')
  const [moreImgUrl, setMoreImgUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [model3d, setModel3d] = useState<string | null>(null)
  const [model3dUploading, setModel3dUploading] = useState(false)
  const [ringStyles, setRingStyles] = useState<{ key: string; name: string; is_enabled?: boolean }[]>([])
  const [newStyleName, setNewStyleName] = useState('')
  const [diamondShapes, setDiamondShapes] = useState<{ key: string; name: string; is_enabled?: boolean; model_3d?: string }[]>([])
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'INR'>('USD')
  const [fxRate, setFxRate] = useState(83)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('admin_currency_pref') as 'USD' | 'INR'
      if (c) setPriceCurrency(c)
    }
    // Server is the single source of truth (fixed admin rate, else live).
    resolveAdminFxRate().then((r) => setFxRate(r))
  }, [])

  useEffect(() => {
    params.then(({ id }) => setProductId(id))
  }, [params])

  useEffect(() => {
    if (!productId) return
    fetchProduct(); loadCategories(); loadStyles(); loadDiamondShapes(); loadMetalOptions(); loadSizeOptions(); loadCaratOptions()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setFetching(true)
      setError('')
      const res = await fetch(`/api/products/${productId}`)
      let json: any = null
      let serverError: string | null = null
      try {
        json = await res.json()
      } catch {
        json = null
      }
      if (!res.ok) {
        serverError = json?.error || null
      }
      let prod: any = res.ok ? json : null
      if (!prod && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('mock_products') || '[]'
          const fb = JSON.parse(raw)
          prod = Array.isArray(fb) ? (fb.find((p: any) => p.id === productId) || null) : null
        } catch { prod = null }
      }
      if (prod) {
        setProductData(prod)
        const prefCurr = (typeof window !== 'undefined' ? localStorage.getItem('admin_currency_pref') : 'USD') as 'USD' | 'INR' || 'USD'
        // Same server rate the state uses — so loaded display prices match it exactly.
        const currentFx = await resolveAdminFxRate()
        setFxRate(currentFx)
        const initialPrice = prefCurr === 'USD' ? prod.price : Math.round((Number(prod.price) || 0) * currentFx)
        setFormData({
          name: prod.name || '', category: prod.category || '', price: String(initialPrice ?? ''),
          description: prod.description || '', carat: prod.carat || '', color: prod.color || '',
          clarity: prod.clarity || '', metal: prod.metal || '', style: prod.style || '',
          diamond_shape: prod.diamond_shape || '', diamond_cut: prod.diamond_cut || '',
          is_featured: !!prod.is_featured, sku: prod.sku || '', slug: prod.slug || ''
        })
        setDiscountPercent(Number(prod.discount_percent) || 0)
        setLabel(prod.label || '')
        setModel3d(prod.model_3d || null)
        const imgs = Array.isArray(prod.images) ? prod.images : []
        const primary = prod.image || imgs[0] || null
        setMainImage(primary)
        setImages(imgs.filter((u: string) => u !== primary))
        if (prod.metal_options && prod.metal_options.length > 0) {
          setSelectedMetals(prod.metal_options.map((mo: any) => mo.key || mo.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''))
          const prices: Record<string, string> = {}
          prod.metal_options.forEach((mo: any) => {
            const key = mo.key || mo.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''
            if (key) {
              const priceVal = prefCurr === 'USD' ? (Number(mo.price_modifier) || 0) : Math.round((Number(mo.price_modifier) || 0) * currentFx)
              prices[key] = String(priceVal || 0)
            }
          })
          setProductMetalPrices(prices)
        }
        if (prod.size_options && prod.size_options.length > 0) {
          setSelectedSizes(prod.size_options.map((so: any) => so.key || so.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''))
          const prices: Record<string, string> = {}
          prod.size_options.forEach((so: any) => {
            const key = so.key || so.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''
            if (key) {
              const priceVal = prefCurr === 'USD' ? (Number(so.price_modifier) || 0) : Math.round((Number(so.price_modifier) || 0) * currentFx)
              prices[key] = String(priceVal || 0)
            }
          })
          setProductSizePrices(prices)
        }
        if (prod.carat_options && prod.carat_options.length > 0) {
          setSelectedCarats(prod.carat_options.map((co: any) => co.key || co.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''))
          const prices: Record<string, string> = {}
          prod.carat_options.forEach((co: any) => {
            const key = co.key || co.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || ''
            if (key) {
              const priceVal = prefCurr === 'USD' ? (Number(co.price_modifier) || 0) : Math.round((Number(co.price_modifier) || 0) * currentFx)
              prices[key] = String(priceVal || 0)
            }
          })
          setProductCaratPrices(prices)
        }
        // Per-row variant rates saved earlier (migration 116) — display currency.
        setVariantSupported(prod.variant_prices_supported !== false)
        {
          const vo: Record<string, string> = {}
            ; (Array.isArray(prod.variant_prices) ? prod.variant_prices : []).forEach((v: any) => {
              const k = String(v.metal_key || '') + '__' + String(v.carat_key || '')
              if (!v.metal_key || !v.carat_key) return
              const usd = Number(v.price_modifier) || 0
              vo[k] = String(prefCurr === 'USD' ? usd : Math.round(usd * currentFx * 100) / 100)
            })
          setVariantOverrides(vo)
        }
        // Per-row selection init: saved variant rows win; otherwise the full
        // cross of the product's saved metals x carats starts ticked.
        setHiddenCombos({})
        {
          const init: Record<string, boolean> = {}
          const saved = Array.isArray(prod.variant_prices) ? prod.variant_prices : []
          if (saved.length > 0) {
            saved.forEach((v: any) => {
              if (v && v.metal_key && v.carat_key) init[String(v.metal_key) + '__' + String(v.carat_key)] = true
            })
          } else {
            const mks: string[] = Array.isArray(prod.metal_options)
              ? prod.metal_options.map((mo: any) => mo.key || mo.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '').filter((k: string) => !!k)
              : []
            const cks: string[] = Array.isArray(prod.carat_options)
              ? prod.carat_options.map((co: any) => co.key || co.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '').filter((k: string) => !!k)
              : []
            mks.forEach(mk => { cks.forEach(ck => { init[mk + '__' + ck] = true }) })
          }
          setComboSel(init)
        }
        if (prod.custom_options && Array.isArray(prod.custom_options)) {
          setCustomSections(prod.custom_options.map((sec: any, idx: number) => ({
            id: 'sec-' + idx + '-' + Date.now(),
            title: sec.title || 'Custom Section',
            items: Array.isArray(sec.items) ? sec.items.map((it: any) => ({
              key: it.key || it.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              name: it.name,
              price_modifier: prefCurr === 'USD' ? (Number(it.price_modifier) || 0) : Math.round((Number(it.price_modifier) || 0) * currentFx),
              is_enabled: it.is_enabled !== false
            })) : []
          })))
        }
      } else {
        setError(serverError || 'Failed to load product')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load product')
    }
    finally { setFetching(false) }
  }

  const loadCategories = async () => {
    try { const r = await fetch('/api/categories'); setCategories(await r.json()) } catch { setCategories([]) }
  }
  const loadStyles = async () => {
    try {
      const j = await fetch('/api/styles', { cache: 'no-store' }).then(r => r.json())
      setRingStyles((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
    } catch { setRingStyles([]) }
  }
  const loadDiamondShapes = async () => {
    try {
      const j = await fetch('/api/diamond-shapes', { cache: 'no-store' }).then(r => r.json())
      setDiamondShapes((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
    } catch { setDiamondShapes([]) }
  }
  const loadMetalOptions = async () => {
    try {
      const j = await fetch('/api/metal-options', { cache: 'no-store' }).then(r => r.json())
      setMetalOptions(Array.isArray(j) ? j : [])
    } catch { setMetalOptions([]) }
  }
  const loadSizeOptions = async () => {
    try {
      const j = await fetch('/api/size-options', { cache: 'no-store' }).then(r => r.json())
      setSizeOptions(Array.isArray(j) ? j : [])
    } catch { setSizeOptions([]) }
  }
  const loadCaratOptions = async () => {
    try {
      const j = await fetch('/api/carat-options', { cache: 'no-store' }).then(r => r.json())
      setCaratOptions(Array.isArray(j) ? j : [])
    } catch { setCaratOptions([]) }
  }

  const addNewCaratOption = async () => {
    const name = newCaratName.trim(); if (!name) return
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const pm = parseFloat(newCaratPrice) || 0
    const priceMod = priceCurrency === 'USD' ? pm : Math.round((pm / fxRate) * 100) / 100
    try {
      setLoading(true)
      const r = await fetch('/api/carat-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ key, name, price_modifier: priceMod, is_enabled: true, position: caratOptions.length }]
        }),
      })
      if (r.ok) {
        const resLoad = await fetch('/api/carat-options', { cache: 'no-store' })
        if (resLoad.ok) {
          const list = await resLoad.json()
          setCaratOptions(Array.isArray(list) ? list : [])
        }
        setSelectedCarats(prev => [...prev, key])
        setProductCaratPrices(prev => ({ ...prev, [key]: newCaratPrice }))
        setNewCaratName('')
        setNewCaratPrice('0')
      } else {
        setError('Failed to add new carat option');
      }
    } catch {
      setError('Failed to add new carat option');
    } finally {
      setLoading(false)
    }
  }

  const deleteGlobalCaratOption = async (key: string) => {
    if (!confirm(`Delete carat option "${key}" globally? This cannot be undone.`)) return
    try {
      setLoading(true)
      const r = await fetch(`/api/carat-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (r.ok) {
        setCaratOptions(prev => prev.filter(o => o.key !== key))
        setSelectedCarats(prev => prev.filter(k => k !== key))
        setProductCaratPrices(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        setHiddenCombos(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(k => {
            if (k === key || k.endsWith('__' + key)) delete next[k]
          })
          return next
        })
        setVariantOverrides(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(k => {
            if (k === key || k.endsWith('__' + key)) delete next[k]
          })
          return next
        })
      } else {
        const data = await r.json().catch(() => ({}))
        setError(data.error || 'Failed to delete carat option');
      }
    } catch {
      setError('Failed to delete carat option');
    } finally {
      setLoading(false)
    }
  }

  // Dynamic Custom Option Sections
  const addCustomSection = () => {
    const title = newSectionTitle.trim(); if (!title) return
    const secId = 'sec-' + Date.now()
    setCustomSections(prev => [...prev, { id: secId, title, items: [] }])
    setNewSectionTitle('')
  }

  const removeCustomSection = (secId: string) => {
    if (!confirm('Remove this custom option section?')) return
    setCustomSections(prev => prev.filter(s => s.id !== secId))
  }

  const addCustomOptionItem = (secId: string) => {
    const name = (newItemNames[secId] || '').trim(); if (!name) return
    const rawPrice = parseFloat(newItemPrices[secId] || '0') || 0
    const priceMod = priceCurrency === 'USD' ? rawPrice : Math.round((rawPrice / fxRate) * 100) / 100
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      const exists = sec.items.some(i => i.key === key)
      if (exists) return sec
      return {
        ...sec,
        items: [...sec.items, { key, name, price_modifier: priceMod, is_enabled: true }]
      }
    }))
    setNewItemNames(prev => ({ ...prev, [secId]: '' }))
    setNewItemPrices(prev => ({ ...prev, [secId]: '0' }))
  }

  const toggleCustomOptionItem = (secId: string, itemKey: string) => {
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: sec.items.map(item => item.key === itemKey ? { ...item, is_enabled: !item.is_enabled } : item)
      }
    }))
  }

  const updateCustomOptionPrice = (secId: string, itemKey: string, priceStr: string) => {
    const rawPrice = parseFloat(priceStr) || 0
    const priceMod = priceCurrency === 'USD' ? rawPrice : Math.round((rawPrice / fxRate) * 100) / 100
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: sec.items.map(item => item.key === itemKey ? { ...item, price_modifier: priceMod } : item)
      }
    }))
  }

  const removeCustomOptionItem = (secId: string, itemKey: string) => {
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: sec.items.filter(item => item.key !== itemKey)
      }
    }))
  }
  const addNewSizeOption = async () => {
    const name = newSizeName.trim(); if (!name) return
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const pm = parseFloat(newSizePrice) || 0
    const priceMod = priceCurrency === 'USD' ? pm : Math.round((pm / fxRate) * 100) / 100
    try {
      setLoading(true)
      const r = await fetch('/api/size-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ key, name, price_modifier: priceMod, is_enabled: true, position: sizeOptions.length }]
        }),
      })
      if (r.ok) {
        const resLoad = await fetch('/api/size-options', { cache: 'no-store' })
        if (resLoad.ok) {
          const list = await resLoad.json()
          setSizeOptions(Array.isArray(list) ? list : [])
        }
        setSelectedSizes(prev => [...prev, key])
        setProductSizePrices(prev => ({ ...prev, [key]: newSizePrice }))
        setNewSizeName('')
        setNewSizePrice('0')
      } else {
        setError('Failed to add new size option');
      }
    } catch {
      setError('Failed to add new size option');
    } finally {
      setLoading(false)
    }
  }

  // Upload a 3D model for THIS product. No diamond-shape / category
  // restriction — any product can optionally carry its own model_3d.
  // Persist immediately, consistent with how images auto-save on this page.
  async function uploadModel3d(file: File | null) {
    if (!file) return; setError('')
    // Web viewer (<model-viewer>) only renders GLB/GLTF; USDZ/OBJ/FBX show blank.
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      setError('Only .glb / .gltf files work in the web 3D viewer. Please convert your model to GLB.')
      return
    }
    try {
      setModel3dUploading(true)
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload-3d', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) { setError(j?.error || '3D upload failed'); return }
      setModel3d(j.url)
      const save = await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_3d: j.url })
      })
      if (!save.ok) setError((await save.json().catch(() => ({})))?.error || 'Model uploaded but failed to save — click Save Changes to retry')
    } catch { setError('3D upload failed') }
    finally { setModel3dUploading(false) }
  }

  const addNewStyle = async () => {
    const name = newStyleName.trim(); if (!name) return
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    try {
      const r = await fetch('/api/styles', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ key, name, is_enabled: true }] })
      })
      if (r.ok) {
        const j = await r.json()
        setRingStyles((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
        setFormData(p => ({ ...p, style: key })); setNewStyleName(''); return
      }
    } catch { }
    setRingStyles(p => p.find(s => s.key === key) ? p : [...p, { key, name, is_enabled: true }])
    setFormData(p => ({ ...p, style: key })); setNewStyleName('')
  }

  const addNewMetalOption = async () => {
    const name = newMetalName.trim(); if (!name) return
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const pm = parseFloat(newMetalPrice) || 0
    const priceMod = priceCurrency === 'USD' ? pm : Math.round((pm / fxRate) * 100) / 100
    try {
      setLoading(true)
      const r = await fetch('/api/metal-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ key, name, price_modifier: priceMod, is_enabled: true, position: metalOptions.length }]
        }),
      })
      if (r.ok) {
        const resLoad = await fetch('/api/metal-options', { cache: 'no-store' })
        if (resLoad.ok) {
          const list = await resLoad.json()
          setMetalOptions(Array.isArray(list) ? list : [])
        }
        setSelectedMetals(prev => [...prev, key])
        setProductMetalPrices(prev => ({ ...prev, [key]: newMetalPrice }))
        setNewMetalName('')
        setNewMetalPrice('0')
      } else {
        setError('Failed to add new metal option');
      }
    } catch {
      setError('Failed to add new metal option');
    } finally {
      setLoading(false)
    }
  }

  const deleteGlobalMetalOption = async (key: string) => {
    if (!confirm(`Delete metal option "${key}" globally? This cannot be undone.`)) return
    try {
      setLoading(true)
      const r = await fetch(`/api/metal-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (r.ok) {
        setMetalOptions(prev => prev.filter(o => o.key !== key))
        setSelectedMetals(prev => prev.filter(k => k !== key))
        setProductMetalPrices(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        setHiddenCombos(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(k => {
            if (k === key || k.startsWith(key + '__')) delete next[k]
          })
          return next
        })
        setVariantOverrides(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(k => {
            if (k === key || k.startsWith(key + '__')) delete next[k]
          })
          return next
        })
      } else {
        const data = await r.json().catch(() => ({}))
        setError(data.error || 'Failed to delete metal option');
      }
    } catch {
      setError('Failed to delete metal option');
    } finally {
      setLoading(false)
    }
  }

  const deleteGlobalSizeOption = async (key: string) => {
    if (!confirm(`Delete size option "${key}" globally? This cannot be undone.`)) return
    try {
      setLoading(true)
      const r = await fetch(`/api/size-options?key=${encodeURIComponent(key)}`, { method: 'DELETE' })
      if (r.ok) {
        setSizeOptions(prev => prev.filter(o => o.key !== key))
        setSelectedSizes(prev => prev.filter(k => k !== key))
        setProductSizePrices(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        const data = await r.json().catch(() => ({}))
        setError(data.error || 'Failed to delete size option');
      }
    } catch {
      setError('Failed to delete size option');
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  // Switching display currency converts EVERY visible price so the underlying
  // USD value stays exactly the same (1532.4 USD -> ~144965 INR, not 1532.4 INR).
  const switchCurrency = (next: 'USD' | 'INR') => {
    if (next === priceCurrency) return
    const rate = Number(fxRate)
    if (isFinite(rate) && rate > 0) {
      const f = next === 'INR' ? rate : 1 / rate
      const conv = (s: string) => {
        const n = parseFloat(s)
        if (!isFinite(n)) return s
        return String(Math.round(n * f * 100) / 100)
      }
      const convMap = (prev: Record<string, string>) => {
        const out: Record<string, string> = {}
        Object.keys(prev).forEach(k => { out[k] = conv(prev[k]) })
        return out
      }
      setFormData(p => ({ ...p, price: conv(p.price) }))
      setProductMetalPrices(convMap)
      setProductCaratPrices(convMap)
      setProductSizePrices(convMap)
      setVariantOverrides(convMap)
      setNewMetalPrice(v => conv(v))
      setNewSizePrice(v => conv(v))
      setNewCaratPrice(v => conv(v))
      setNewItemPrices(convMap)
    }
    setPriceCurrency(next)
    try { localStorage.setItem('admin_currency_pref', next) } catch { }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    // Retail price is optional when variants are offered — each variant row
    // carries its own price and the base is stored as 0.
    const hasOfferedVariants = selectedMetals.length > 0 || selectedCarats.length > 0
    if (!formData.name || (!formData.price && !hasOfferedVariants)) { setError(hasOfferedVariants ? 'Please fill in required fields: Name. (Retail price is optional when variants are offered.)' : 'Please fill in required fields'); setLoading(false); return }
    try {
      const raw = parseFloat(formData.price)
      if (formData.price !== '' && isNaN(raw)) { setError('Invalid price format.'); setLoading(false); return }
      const priceUSD = isNaN(raw) ? 0 : (priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100)

      let finalMetals = selectedMetals;
      let finalCarats = selectedCarats;
      // Flat lists are kept as the union of ticked rows (recomputeFlat), so no
      // extra filtering is needed here.

      // Per-row variant rates (USD). Each row owns its rate; untouched rows
      // fall back to their shared metal+carat sum.
      const toUSD = (disp: string) => {
        const n = parseFloat(disp) || 0
        return priceCurrency === 'USD' ? n : Math.round((n / fxRate) * 100) / 100
      }
      const optUsd = (o: any, store: Record<string, string>) => {
        const disp = store[o.key] ?? String((priceCurrency === 'USD' ? o.price_modifier : (o.price_modifier || 0) * fxRate) || 0)
        const n = toUSD(disp)
        return isNaN(n) ? 0 : n
      }
      const metalByKey: Record<string, any> = {}
      metalOptions.forEach(o => { metalByKey[o.key] = o })
      const caratByKey: Record<string, any> = {}
      caratOptions.forEach(o => { caratByKey[o.key] = o })
      const variantRows: Array<{ metal_key: string; carat_key: string; price_modifier: number }> = []
      // Only ticked (offered) combos are saved — one row ticked = one variant saved.
      Object.keys(comboSel).forEach(vkey => {
        if (!comboSel[vkey] || hiddenCombos[vkey]) return
        const parts = vkey.split('__')
        const mk = parts[0]
        const ck = parts[1]
        if (!mk || !ck || !finalMetals.includes(mk) || !finalCarats.includes(ck)) return
        const m = metalByKey[mk]
        const c = caratByKey[ck]
        if (!m || !c) return
        const disp = variantOverrides[vkey]
        const usd = disp !== undefined
          ? toUSD(disp)
          : Math.round((optUsd(m, productMetalPrices) + optUsd(c, productCaratPrices)) * 100) / 100
        variantRows.push({ metal_key: mk, carat_key: ck, price_modifier: isNaN(usd) ? 0 : usd })
      })
      const touchedVariants = Object.keys(variantOverrides).length > 0

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: formData.category,
          category_id: selectedSubCategoryId || selectedRootCategoryId || null,
          price: priceUSD,
          discount_percent: discountPercent,
          label: label.trim(),
          model_3d: model3d,
          image: mainImage || images[0] || null,
          images: mainImage ? [mainImage, ...images.filter(u => u !== mainImage)] : images,
          metal_options: metalOptions
            .filter(o => o.is_enabled !== false && finalMetals.includes(o.key))
            .map(o => {
              const rawMod = parseFloat(productMetalPrices[o.key] || '0')
              const modUSD = priceCurrency === 'USD' ? rawMod : Math.round((rawMod / fxRate) * 100) / 100
              return {
                key: o.key,
                name: o.name,
                price_modifier: isNaN(modUSD) ? 0 : modUSD
              }
            }),
          size_options: sizeOptions
            .filter(o => o.is_enabled !== false && selectedSizes.includes(o.key))
            .map(o => {
              const rawMod = parseFloat(productSizePrices[o.key] || '0')
              const modUSD = priceCurrency === 'USD' ? rawMod : Math.round((rawMod / fxRate) * 100) / 100
              return {
                key: o.key,
                name: o.name,
                price_modifier: isNaN(modUSD) ? 0 : modUSD
              }
            }),
          carat_options: caratOptions
            .filter(o => o.is_enabled !== false && finalCarats.includes(o.key))
            .map(o => {
              const rawMod = parseFloat(productCaratPrices[o.key] || '0')
              const modUSD = priceCurrency === 'USD' ? rawMod : Math.round((rawMod / fxRate) * 100) / 100
              return {
                key: o.key,
                name: o.name,
                price_modifier: isNaN(modUSD) ? 0 : modUSD
              }
            }),
          custom_options: customSections.map(sec => ({
            title: sec.title,
            items: sec.items.filter(i => i.is_enabled !== false)
          })),
          variant_prices: variantRows
        }),
      })
      const savedBody: any = await res.json().catch(() => ({}))
      if (res.ok) {
        if (savedBody.variant_saved === false && touchedVariants) {
          setError('Product saved, but per-row rates were NOT saved — run migration 116_product_variant_prices.sql in Supabase SQL Editor, then re-enter the row rates and Save again.')
        } else {
          router.push('/admin/products')
        }
      }
      else setError(savedBody?.error || 'Failed to update product')
    } catch { setError('Error updating product') }
    finally { setLoading(false) }
  }

  const handleMainFile = async (file: File | null) => {
    if (!file) return; setError('')
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setError(data?.error || 'Upload failed'); return }
    setMainImage(data.url)
    const combined = [data.url, ...images.filter(u => u !== data.url)]
    await fetch(`/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: data.url, images: combined })
    })
  }

  const handleMoreFiles = async (files: FileList | null) => {
    if (!files) return; setError('')
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || 'Upload failed'); continue }
      setImages(prev => {
        const next = [...prev, data.url]
        fetch(`/api/products/${productId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: mainImage ? [mainImage, ...next.filter(u => u !== mainImage)] : next, image: mainImage || next[0] || null })
        })
        return next
      })
    }
  }

  const handleAddMoreUrl = async () => {
    const url = moreImgUrl.trim(); if (!url) return; setError('')
    const res = await fetch('/api/storage/upload-product-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
    const data = await res.json()
    if (!res.ok) { setError(data?.error || 'Import failed'); return }
    const next = [...images, data.url]; setImages(next); setMoreImgUrl('')
    await fetch(`/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: mainImage ? [mainImage, ...next.filter(u => u !== mainImage)] : next, image: mainImage || next[0] || null })
    })
  }

  const handleVideoFile = async (file: File | null) => {
    if (!file) return; setError(''); setVideoUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || 'Video upload failed'); return }
      const next = [...images, data.url]; setImages(next)
      await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: mainImage ? [mainImage, ...next.filter(u => u !== mainImage)] : next, image: mainImage || next[0] || null })
      })
    } catch { setError('Video upload failed — file may be too large') }
    finally { setVideoUploading(false) }
  }

  const handleAddVideoUrl = async () => {
    const url = videoUrl.trim(); if (!url) return
    const next = [...images, url]; setImages(next); setVideoUrl('')
    await fetch(`/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: mainImage ? [mainImage, ...next.filter(u => u !== mainImage)] : next, image: mainImage || next[0] || null })
    })
  }

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx); setImages(next)
    fetch(`/api/products/${productId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: mainImage ? [mainImage, ...next.filter(u => u !== mainImage)] : next, image: mainImage || next[0] || null })
    })
  }

  const isDia = (v: string) => String(v || '').toLowerCase().startsWith('diamond')

  if (fetching) return (
    <div className="a-page">
      <style>{CSS}</style>
      <div className="a-loader-row">
        <Diamond size={28} strokeWidth={1.2} className="ep-loading-gem" />
        <span className="a-loader-label">Loading product…</span>
      </div>
    </div>
  )

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <Link href="/admin/products" className="a-back">
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to Products
      </Link>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Catalogue</div>
          <h1 className="a-title">Edit <em>Product</em></h1>
          <p className="a-subtitle">Update product details, specifications and media for your live catalogue.</p>
        </div>
        <div className="a-head-actions">
          <Link href="/admin/products" className="a-btn a-btn--ghost">Cancel</Link>
          <button type="submit" form="product-edit-form" className="a-btn a-btn--primary" disabled={loading}>
            {loading
              ? <><span className="ep-save-dot" /> Saving…</>
              : <><Check size={14} strokeWidth={2} /> Save Changes</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="a-card" style={{ marginBottom: 20, borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' }}>
          <div className="a-card-body" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--c-danger)' }}>
            <AlertCircle size={16} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, margin: 0, fontFamily: 'var(--font-dmsans)', fontSize: 13 }}>{error}</p>
            <button className="a-icon-btn a-icon-btn--sm" type="button" onClick={() => setError('')} aria-label="Dismiss"><X size={14} strokeWidth={1.5} /></button>
          </div>
        </div>
      )}

      <form id="product-edit-form" onSubmit={handleSubmit}>
        <div className="a-grid-2">

          {/* ── Left (main) column ── */}
          <div className="a-stack">

            {/* Basic Info */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Basic <em>Info</em></h2>
              </div>
              <div className="a-card-body">
                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Product ID</label>
                    <input className="a-input" value={productId} disabled />
                  </div>
                  <div className="a-field">
                    <label className="a-label">SKU</label>
                    <input className="a-input" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g., RING-1234" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Product Name <span className="a-req">*</span></label>
                    <input className="a-input" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Emerald Cut Diamond Ring" />
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">URL Slug</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input className="a-input" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g., emerald-cut-ring" style={{ flex: 1 }} />
                      <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                        const toSlug = (s: string) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        setFormData(p => ({ ...p, slug: toSlug(p.name) }))
                      }}>Auto-Gen</button>
                    </div>
                    <p className="a-hint">This is the product's unique web address.</p>
                  </div>

                  <div className="a-field">
                    <label className="a-label">Category <span className="a-req">*</span></label>
                    <select
                      className="a-select"
                      value={selectedRootCategoryId}
                      onChange={(e) => {
                        setSelectedRootCategoryId(e.target.value);
                        setSelectedSubCategoryId("");
                      }}
                    >
                      <option value="">Select Root Category</option>
                      {parentCategories.map(parent => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                    </select>

                    {childCategories.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <label className="a-label">Sub Category</label>
                        <select
                          className="a-select"
                          value={selectedSubCategoryId}
                          onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                        >
                          <option value="">Select Sub Category</option>
                          {childCategories.map(child => (
                            <option key={child.id} value={child.id}>
                              {child.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="a-field">
                    <label className="a-label">Price ({priceCurrency}) {(selectedMetals.length === 0 && selectedCarats.length === 0) && <span className="a-req">*</span>}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="a-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" style={{ flex: 1 }} />
                      <select className="a-select" style={{ width: 90 }} value={priceCurrency} onChange={e => switchCurrency(e.target.value as 'USD' | 'INR')}>
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                    <p className="a-hint">
                      Saved as USD: <span style={{ color: 'var(--c-accent)', fontWeight: 600 }}>${(() => {
                        const raw = parseFloat(formData.price)
                        if (!isFinite(raw)) return '0.00'
                        return priceCurrency === 'USD' ? raw.toFixed(2) : (Math.round((raw / fxRate) * 100) / 100).toFixed(2)
                      })()}</span>
                    </p>
                    {(selectedMetals.length > 0 || selectedCarats.length > 0) && (
                      <p className="a-hint" style={{ marginTop: 4 }}>Optional — variants carry their own prices; empty is stored as 0 base.</p>
                    )}
                  </div>

                  <div className="a-field a-col-span-2">
                    <label className="a-label">Description</label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                      placeholder="Product description…"
                    />
                  </div>
                </div>

                <hr className="a-divider" />

                <label className="a-check">
                  <input type="checkbox" checked={formData.is_featured}
                    onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))} />
                  <span>Visible at Home</span>
                </label>
              </div>
            </div>

            {/* Discount & Label */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Discount &amp; Label</h2>
              </div>
              <div className="a-card-body">
                <div className="a-field">
                  <label className="a-label">Discount</label>
                  <div className="ep-chips">
                    {DISCOUNT_PRESETS.map(d => (
                      <button
                        type="button"
                        key={d}
                        className={`ep-chip${discountPercent === d ? ' on' : ''}`}
                        onClick={() => setDiscountPercent(d)}
                      >
                        {d === 0 ? 'None' : `${d}% Off`}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                    <input
                      className="a-input"
                      type="number"
                      min={0}
                      max={95}
                      step={1}
                      style={{ maxWidth: 160 }}
                      value={discountPercent ? String(discountPercent) : ''}
                      onChange={e => {
                        const n = Math.round(Number(e.target.value))
                        setDiscountPercent(Number.isFinite(n) ? Math.max(0, Math.min(95, n)) : 0)
                      }}
                      placeholder="Custom %"
                    />
                    <span className="a-hint" style={{ margin: 0 }}>Any value 0–95%</span>
                  </div>
                  {discountPercent > 0 && (() => {
                    const raw = parseFloat(formData.price)
                    const orig = !isFinite(raw) ? 0 : (priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100)
                    const sale = Math.round(orig * (1 - discountPercent / 100) * 100) / 100
                    const inr = (usd: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(usd * fxRate))
                    return (
                      <p className="a-hint" style={{ marginTop: 10 }}>
                        Sale price: <strong style={{ color: 'var(--c-accent)' }}>${sale.toFixed(2)}</strong>{' '}
                        <span>({inr(sale)})</span>{' '}
                        <span style={{ textDecoration: 'line-through' }}>${orig.toFixed(2)}</span>{' '}
                        <span>({inr(orig)})</span>{' '}
                        · {discountPercent}% off (USD, before metal/size upcharges)
                      </p>
                    )
                  })()}
                </div>

                <hr className="a-divider" />

                <div className="a-field">
                  <label className="a-label">Card Label</label>
                  <div className="ep-chips">
                    <button type="button" className={`ep-chip${!label ? ' on' : ''}`} onClick={() => setLabel('')}>None</button>
                    {LABEL_PRESETS.map(l => (
                      <button
                        type="button"
                        key={l}
                        className={`ep-chip${label === l ? ' on' : ''}`}
                        onClick={() => setLabel(l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <input className="a-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Custom label (e.g., Bestseller)..." />
                  </div>
                  <p className="a-hint">Shown as a badge on the product card &amp; product page.</p>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Specifications</h2>
              </div>
              <div className="a-card-body">

                {/* Style + Shape are available for every product, not just
                    rings / diamonds — so any piece can be tagged and filtered. */}
                <div className="a-field">
                  <label className="a-label">Style</label>
                  <select className="a-select" name="style" value={formData.style} onChange={handleChange}>
                    <option value="">Select style</option>
                    {ringStyles.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <input className="a-input" style={{ flex: 1 }} value={newStyleName} onChange={e => setNewStyleName(e.target.value)}
                      placeholder="Add new style…" />
                    <button type="button" className="a-btn a-btn--subtle" onClick={addNewStyle}>
                      <Plus size={14} strokeWidth={1.5} /> Add
                    </button>
                  </div>
                </div>

                <div className="a-field">
                  <label className="a-label">Shape</label>
                  <select className="a-select" name="diamond_shape" value={formData.diamond_shape} onChange={handleChange}>
                    <option value="">Select shape</option>
                    {diamondShapes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                  </select>
                </div>

                {/* 3D model — available for EVERY product. Optional, no shape/category gate. */}
                <div className="a-field">
                  <label className="a-label">3D Model (GLB/GLTF)</label>
                  <input type="file" accept=".glb,.gltf" style={{ display: 'none' }} id="3dfile"
                    onChange={e => uploadModel3d(e.target.files?.[0] || null)} />
                  <label htmlFor="3dfile" className="a-btn a-btn--subtle" style={{ cursor: 'pointer' }}>
                    <Upload size={14} strokeWidth={1.5} /> {model3dUploading ? 'Uploading…' : model3d ? 'Replace 3D Model' : 'Upload 3D Model'}
                  </label>
                  {model3d && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                      <a href={model3d} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-dmsans)', fontSize: 12, color: 'var(--c-accent)', letterSpacing: '.04em' }}>View current 3D model ↗</a>
                      <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={async () => {
                        setModel3d(null)
                        await fetch(`/api/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model_3d: null }) })
                      }}>Remove</button>
                    </div>
                  )}
                  <p className="a-hint">Optional — works with any product. Shown as a rotatable 3D view on the product page.</p>
                </div>

                {/* Diamond-specific grading: cut / colour / clarity */}
                {isDia(formData.category) && (
                  <>
                    <div className="a-field">
                      <label className="a-label">Cut Grade</label>
                      <div className="ep-chips">
                        {DIAMOND_CUTS.map(c => (
                          <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, diamond_cut: p.diamond_cut === c ? '' : c }))}
                            className={`ep-chip${formData.diamond_cut === c ? ' on' : ''}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                    <div className="a-form-grid">
                      <div className="a-field">
                        <label className="a-label">Color Grade</label>
                        <div className="ep-chips">
                          {DIAMOND_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: p.color === c ? '' : c }))}
                              className={`ep-chip${formData.color === c ? ' on' : ''}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                      <div className="a-field">
                        <label className="a-label">Clarity Grade</label>
                        <div className="ep-chips">
                          {DIAMOND_CLARITIES.map(c => (
                            <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, clarity: p.clarity === c ? '' : c }))}
                              className={`ep-chip${formData.clarity === c ? ' on' : ''}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="a-field">
                  <label className="a-label">Carat {isDia(formData.category) ? <span className="a-req">*</span> : '(if applicable)'}</label>
                  <input className="a-input" name="carat" value={formData.carat} onChange={handleChange} placeholder="e.g., 2.5" />
                </div>

                {!isDia(formData.category) && (
                  <div className="a-form-grid">
                    <div className="a-field">
                      <label className="a-label">Color</label>
                      <input className="a-input" name="color" value={formData.color} onChange={handleChange} placeholder="e.g., D" />
                    </div>
                    <div className="a-field">
                      <label className="a-label">Clarity</label>
                      <input className="a-input" name="clarity" value={formData.clarity} onChange={handleChange} placeholder="e.g., IF" />
                    </div>
                  </div>
                )}

                <hr className="a-divider" />

                {/* Combined: Material & Diamond Weight — material + weight together, one row per variant */}
                <div className="a-field">
                  <div className="a-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Material &amp; Total Diamond Weight</span>
                    {metalOptions.filter(o => o.is_enabled !== false).length > 0 && caratOptions.filter(o => o.is_enabled !== false).length > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: 'var(--c-text-muted)' }}>
                        {metalOptions.filter(o => o.is_enabled !== false).length * caratOptions.filter(o => o.is_enabled !== false).length} variants
                      </span>
                    )}
                  </div>
                  <p className="a-hint" style={{ margin: '8px 0 0' }}>Untick/hide removes a row from THIS product only. Trash on a row hides it instantly — Save to apply. To delete a material / weight GLOBALLY (every product), use the global lists below.</p>
                  {!variantSupported && (
                    <div style={{ marginTop: 12, padding: '10px 14px', border: '1px solid var(--c-warning)', background: 'var(--c-warning-bg)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-dmsans)', fontSize: 12, color: 'var(--c-warning)' }}>
                      Per-row rates need DB migration <strong>116_product_variant_prices.sql</strong> (run once in Supabase SQL Editor, folder <span className="a-mono">migrations/</span>).
                      Until then rows show shared metal+weight sums and per-row edits and row selections won&apos;t persist.
                    </div>
                  )}
                  <div className="ep-combo-toolbar">
                    <input
                      className="a-input"
                      style={{ flex: '2 1 200px', height: 36 }}
                      placeholder="Search material or diamond weight…"
                      value={comboSearch}
                      onChange={e => setComboSearch(e.target.value)}
                    />
                    <label className="a-check" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
                      <span>Show hidden</span>
                    </label>
                    <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                      setSelectedMetals(metalOptions.filter(o => o.is_enabled !== false).map(o => o.key))
                      setComboSel(() => { const n: Record<string, boolean> = {}; metalOptions.filter(o => o.is_enabled !== false).forEach(mm => { caratOptions.filter(o => o.is_enabled !== false).forEach(cc => { n[mm.key + '__' + cc.key] = true; }); }); return n; })
                      setSelectedCarats(caratOptions.filter(o => o.is_enabled !== false).map(o => o.key))
                      setHiddenCombos({})
                    }}>
                      Select all
                    </button>
                    <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                      setSelectedMetals([])
                      setComboSel({})
                      setSelectedCarats([])
                      setHiddenCombos({})
                    }}>
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div className="ep-mc-grid ep-mc-head">
                      <div style={{ textAlign: 'center' }}>SEL</div>
                      <div>MATERIAL</div>
                      <div>DIAMOND WEIGHT</div>
                      <div>UPCHARGE ({priceCurrency})</div>
                      <div></div>
                    </div>
                    {(() => {
                      const metList = metalOptions.filter(o => o.is_enabled !== false);
                      const carList = caratOptions.filter(o => o.is_enabled !== false);
                      const upPh = (o: any) => ((priceCurrency === 'USD' ? o.price_modifier : (o.price_modifier || 0) * fxRate) || 0).toFixed(2);
                      if (metList.length === 0 && carList.length === 0) {
                        return (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 12, fontFamily: 'var(--font-dmsans)' }}>
                            No variants yet. Add options below to get started.
                          </div>
                        );
                      }
                      const q = comboSearch.trim().toLowerCase();
                      const hiddenCount = Object.keys(hiddenCombos).filter(k => hiddenCombos[k]).length;
                      const rows: any[] = [];
                      metList.forEach((m) => {
                        carList.forEach((c) => {
                          const vkey = m.key + '__' + c.key;
                          const hidden = !!hiddenCombos[vkey];
                          if (hidden && !showHidden) return;
                          if (q && (m.name + ' ' + c.name).toLowerCase().indexOf(q) === -1) return;
                          rows.push({ vkey, m, c, hidden });
                        });
                      });
                      const selCount = rows.filter(r => !!comboSel[r.vkey] && !r.hidden).length;
                      return (
                        <>
                          {rows.map(({ vkey, m, c, hidden }) => {
                            const mNum = parseFloat(productMetalPrices[m.key] ?? upPh(m)) || 0;
                            const cNum = parseFloat(productCaratPrices[c.key] ?? upPh(c)) || 0;
                            const sharedDisp = (mNum + cNum).toFixed(2);
                            return (
                              <div key={vkey} className="ep-mc-grid ep-mc-row" style={hidden ? { opacity: 0.45 } : undefined}>
                                <div className="ep-mc-check">
                                  <input
                                    type="checkbox"
                                    checked={!!comboSel[vkey]}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
                                    title={hidden ? 'Hidden row — tick to restore' : 'Tick to offer this combination'}
                                    onChange={(e) => toggleCombo(m, c, vkey, e.target.checked)}
                                  />
                                </div>
                                <div className="ep-mc-cell">{m.name}</div>
                                <div className="ep-mc-cell">{c.name}</div>
                                <input
                                  type="number" step="0.01"
                                  className="a-input"
                                  style={{ height: 36, width: '100%' }}
                                  title="This exact variant's upcharge over base price — independent per row"
                                  placeholder={sharedDisp}
                                  value={variantOverrides[vkey] ?? sharedDisp}
                                  onChange={(e) => setVariantOverrides(prev => ({ ...prev, [vkey]: e.target.value }))}
                                />
                                <div className="ep-mc-del">
                                  <button
                                    type="button" className="ep-icon-del"
                                    onClick={() => {
                                      if (confirm('Hide ' + m.name + ' + ' + c.name + ' for this product? (Save to apply. Use the global lists below to delete permanently.)')) {
                                        hideCombo(vkey);
                                      }
                                    }}
                                    title="Hide this row for this product (shows again only if its material/weight stays selected — delete globally below for permanent removal)"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ padding: '8px 4px', fontFamily: 'var(--font-dmsans)', fontSize: 11, color: 'var(--c-text-muted)' }}>
                            Showing {rows.length} of {metList.length * carList.length} combinations · {selCount} offered · {hiddenCount} hidden.
                            Unticked / hidden rows are not offered and are not saved — tick a row to offer that exact variant only.
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Global option management — permanent deletion lives here. */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--c-border)' }}>
                    <div>
                      <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>
                        Materials — global ({metalOptions.filter(o => o.is_enabled !== false).length})
                      </span>
                      <div className="ep-glob-chips">
                        {metalOptions.filter(o => o.is_enabled !== false).map(m => (
                          <span key={m.key} className="ep-glob-chip">
                            {m.name}
                            <button type="button" onClick={() => deleteGlobalMetalOption(m.key)} title={`Delete "${m.name}" globally (removes all its rows)`}>
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>
                        Diamond weights — global ({caratOptions.filter(o => o.is_enabled !== false).length})
                      </span>
                      <div className="ep-glob-chips">
                        {caratOptions.filter(o => o.is_enabled !== false).map(c => (
                          <span key={c.key} className="ep-glob-chip">
                            {c.name}
                            <button type="button" onClick={() => deleteGlobalCaratOption(c.key)} title={`Delete "${c.name}" globally (removes all its rows)`}>
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add new option row: Metal */}
                  <div className="ep-opt-add" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      className="a-input" style={{ flex: '2 1 200px', height: 40 }}
                      value={newMetalName} onChange={e => setNewMetalName(e.target.value)}
                      placeholder="New material/metal (e.g., 925 Silver+Lab Grown)"
                    />
                    <input type="number" step="0.01" className="a-input" style={{ flex: '1 1 100px', height: 40 }}
                      value={newMetalPrice} onChange={e => setNewMetalPrice(e.target.value)}
                      placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" style={{ height: 40 }} onClick={addNewMetalOption}>
                      <Plus size={14} />&nbsp;Add Material
                    </button>
                  </div>
                  {/* Add new option row: Carat */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                    <input
                      className="a-input" style={{ flex: '2 1 200px', height: 40 }}
                      value={newCaratName} onChange={e => setNewCaratName(e.target.value)}
                      placeholder="New carat weight (e.g., 2.00 TCW)"
                    />
                    <input type="number" step="0.01" className="a-input" style={{ flex: '1 1 100px', height: 40 }}
                      value={newCaratPrice} onChange={e => setNewCaratPrice(e.target.value)}
                      placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" style={{ height: 40 }} onClick={addNewCaratOption}>
                      <Plus size={14} />&nbsp;Add Carat
                    </button>
                  </div>
                </div>
                <hr className="a-divider" />

                <div className="a-field">
                  <div className="a-section-title">Available Size Options</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                    <div className="ep-mc-grid ep-mc-head">
                      <div style={{ textAlign: 'center' }}>SEL</div>
                      <div>SIZE</div>
                      <div></div>
                      <div>UPCHARGE ({priceCurrency})</div>
                      <div></div>
                    </div>

                    {sizeOptions.filter((opt) => opt.is_enabled !== false).length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 12, fontFamily: 'var(--font-dmsans)' }}>
                        No size options yet. Add one below.
                      </div>
                    )}

                    {sizeOptions.filter((opt) => opt.is_enabled !== false).map((opt) => {
                      const isSelected = selectedSizes.includes(opt.key);
                      const currentPriceMod = productSizePrices[opt.key] ?? '';
                      return (
                        <div key={opt.key} className="ep-mc-grid ep-mc-row">
                          <div className="ep-mc-check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSizes([...selectedSizes, opt.key])
                                  if (!productSizePrices[opt.key]) {
                                    const globalPriceVal = (priceCurrency === 'USD' ? opt.price_modifier : (opt.price_modifier || 0) * fxRate) || 0;
                                    setProductSizePrices(prev => ({ ...prev, [opt.key]: String(globalPriceVal) }))
                                  }
                                } else {
                                  setSelectedSizes(selectedSizes.filter(k => k !== opt.key))
                                }
                              }}
                            />
                          </div>
                          <div className="ep-mc-cell">{opt.name}</div>
                          <div className="ep-mc-cell-muted">—</div>
                          <input
                            type="number"
                            step="0.01"
                            className="a-input"
                            style={{ height: 36, width: '100%' }}
                            placeholder={((priceCurrency === 'USD' ? opt.price_modifier : (opt.price_modifier || 0) * fxRate) || 0).toFixed(2)}
                            value={currentPriceMod}
                            title="Upcharge over base price when a customer picks this size"
                            onChange={(e) => {
                              setProductSizePrices(prev => ({ ...prev, [opt.key]: e.target.value }))
                            }}
                          />
                          <div className="ep-mc-del">
                            <button
                              type="button"
                              onClick={() => deleteGlobalSizeOption(opt.key)}
                              className="ep-icon-del"
                              title="Delete option globally"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="ep-opt-add" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <input className="a-input" style={{ flex: 2, height: 40 }} value={newSizeName} onChange={e => setNewSizeName(e.target.value)} placeholder="New size option (e.g., 8.5)..." />
                    <input type="number" step="0.01" className="a-input" style={{ flex: 1, height: 40 }} value={newSizePrice} onChange={e => setNewSizePrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" style={{ height: 40 }} onClick={addNewSizeOption}>
                      <Plus size={14} />&nbsp;Add Size
                    </button>
                  </div>
                </div>

                {/* Dynamic Custom Spec / Option Sections Builder */}
                <div className="a-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Custom Technical Specs &amp; Choice Sections</span>
                  <span style={{ fontSize: 11, fontWeight: 400, textTransform: 'none', color: 'var(--c-text-muted)' }}>Admin can create any new spec option dynamically</span>
                </div>

                {customSections.map((sec) => (
                  <div key={sec.id} style={{ marginBottom: 20, padding: 16, border: '1px solid var(--c-border)', borderRadius: 'var(--radius)', background: 'var(--c-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <strong style={{ fontSize: 13, fontFamily: 'var(--font-dmsans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sec.title}</strong>
                      <button type="button" className="a-btn a-btn--danger a-btn--sm" onClick={() => removeCustomSection(sec.id)}>
                        Remove Section
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sec.items.map((item) => (
                        <div key={item.key} className="ep-opt-grid">
                          <span className="ep-opt-name">{item.name}</span>
                          <input
                            type="number"
                            step="0.01"
                            className="a-input"
                            value={item.price_modifier}
                            onChange={(e) => updateCustomOptionPrice(sec.id, item.key, e.target.value)}
                            placeholder={`Price (${priceCurrency})`}
                          />
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              className="a-check"
                              checked={!(item.is_enabled === false)}
                              onChange={() => toggleCustomOptionItem(sec.id, item.key)}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button type="button" className="ep-icon-del" onClick={() => removeCustomOptionItem(sec.id, item.key)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="ep-opt-add" style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 12 }}>
                      <input
                        className="a-input"
                        style={{ flex: 2, height: 40 }}
                        value={newItemNames[sec.id] || ''}
                        onChange={(e) => setNewItemNames(prev => ({ ...prev, [sec.id]: e.target.value }))}
                        placeholder="Option choice name (e.g., 2.0mm / VVS1)..."
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="a-input"
                        style={{ flex: 1, height: 40 }}
                        value={newItemPrices[sec.id] || '0'}
                        onChange={(e) => setNewItemPrices(prev => ({ ...prev, [sec.id]: e.target.value }))}
                        placeholder={`Price (${priceCurrency})`}
                      />
                      <button type="button" className="a-btn a-btn--subtle" style={{ height: 40 }} onClick={() => addCustomOptionItem(sec.id)}>
                        Add Choice
                      </button>
                    </div>
                  </div>
                ))}

                <div className="a-row" style={{ gap: 10, marginTop: 12 }}>
                  <input
                    className="a-input"
                    style={{ flex: 1 }}
                    value={newSectionTitle}
                    onChange={(e) => setNewSectionTitle(e.target.value)}
                    placeholder="New custom section title (e.g., Clarity Grade, Band Width, Certificate)..."
                  />
                  <button type="button" className="a-btn a-btn--primary" onClick={addCustomSection}>
                    + Add Custom Spec Section
                  </button>
                </div>

              </div>
            </div>

            {/* Images */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Media <em>&amp; Images</em></h2>
              </div>
              <div className="a-card-body">
                <div className="a-form-grid">
                  {/* Main image */}
                  <div className="a-field">
                    <label className="a-label">Main Image</label>
                    <div className="ep-img-main-zone" onClick={() => mainFileRef.current?.click()}>
                      {mainImage
                        ? <>
                          <img src={mainImage} alt="main" />
                          <button type="button" className="ep-img-remove" onClick={e => {
                            e.stopPropagation(); setMainImage(null);
                            fetch(`/api/products/${productId}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ image: images[0] || null, images })
                            });
                          }}>
                            <X size={11} strokeWidth={1.5} />
                          </button>
                        </>
                        : <div className="ep-img-main-hint">
                          <Upload size={22} strokeWidth={1} />
                          <span>Click to upload</span>
                        </div>
                      }
                    </div>
                    <input ref={mainFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleMainFile(e.target.files?.[0] || null)} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input className="a-input" style={{ flex: 1 }} placeholder="Or paste image URL…" value={mainImgUrl}
                        onChange={e => setMainImgUrl(e.target.value)} />
                      <button type="button" className="a-btn a-btn--subtle" onClick={async () => {
                        const url = mainImgUrl.trim(); if (!url) return;
                        const res = await fetch('/api/storage/upload-product-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
                        const d = await res.json(); if (!res.ok) { setError(d?.error || 'Failed'); return; }
                        setMainImage(d.url); setMainImgUrl('');
                        await fetch(`/api/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: d.url, images: [d.url, ...images.filter(u => u !== d.url)] }) });
                      }}>Import</button>
                    </div>
                  </div>

                  {/* More images */}
                  <div className="a-field">
                    <label className="a-label">Gallery</label>
                    <div className="ep-thumb-grid">
                      <button type="button" className="ep-thumb-add" onClick={() => moreFileRef.current?.click()}>
                        <Plus size={16} strokeWidth={1.5} style={{ color: 'var(--c-accent)' }} />
                        <span>Add</span>
                      </button>
                      {images.map((url, idx) => (
                        <div key={idx} className="ep-thumb">
                          {isVideo(url)
                            ? <div className="ep-thumb-video">
                              <Video size={16} style={{ color: 'var(--c-accent)' }} />
                            </div>
                            : <img src={url} alt="" />
                          }
                          <button type="button" className="ep-thumb-remove" onClick={() => removeImage(idx)}>
                            <X size={10} strokeWidth={1.5} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <input ref={moreFileRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                      onChange={e => handleMoreFiles(e.target.files)} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input className="a-input" style={{ flex: 1 }} placeholder="Image URL…" value={moreImgUrl}
                        onChange={e => setMoreImgUrl(e.target.value)} />
                      <button type="button" className="a-btn a-btn--subtle" onClick={handleAddMoreUrl}>Add</button>
                    </div>
                  </div>
                </div>

                {/* Video */}
                <hr className="a-divider" />
                <div className="a-field">
                  <label className="a-label">Video</label>
                  <button type="button" className="a-btn a-btn--subtle" onClick={() => videoFileRef.current?.click()}>
                    <Video size={14} strokeWidth={1.5} /> Upload Video File
                  </button>
                  <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }}
                    onChange={e => handleVideoFile(e.target.files?.[0] || null)} disabled={videoUploading} />
                  {videoUploading && (
                    <div className="ep-uploading">
                      <div className="ep-uploading-dot" /> Uploading video…
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <input className="a-input" style={{ flex: 1 }} placeholder="YouTube / Vimeo / mp4 URL…" value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)} />
                    <button type="button" className="a-btn a-btn--subtle" onClick={handleAddVideoUrl}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column (sticky actions) ── */}
          <div>
            <div className="a-card ep-actions-card">
              <div className="a-card-head">
                <div className="a-eyebrow">Save Changes</div>
                <p className="a-card-sub">All changes will be applied immediately to your live catalogue.</p>
              </div>
              <div className="a-card-body a-stack">
                <button type="submit" className="a-btn a-btn--primary a-btn--lg a-btn--block" disabled={loading}>
                  {loading
                    ? <><span className="ep-save-dot" /> Saving…</>
                    : <><Check size={14} strokeWidth={2} /> Save Changes</>
                  }
                </button>
                <Link href="/admin/products" className="a-btn a-btn--ghost a-btn--block">Cancel</Link>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
