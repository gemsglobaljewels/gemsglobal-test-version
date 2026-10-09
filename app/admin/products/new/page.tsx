"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, X, Plus, Upload, Video, Diamond, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/RichTextEditor";
import { resolveAdminFxRate } from "@/lib/adminRate";
import { extractDriveId, isDriveUrl } from "@/lib/video";
import { sizeAppliesToCategory, payloadStartingRetail } from "@/lib/variantPricing";
import { optionAppliesToCategory, defaultScopeFor } from "@/lib/categoryScope";
import { estimatedDeliveryText } from "@/lib/delivery";

interface CustomOptionItem {
  key: string;
  name: string;
  price_modifier: number;
  is_enabled?: boolean;
}

interface CustomOptionSection {
  id: string;
  title: string;
  items: CustomOptionItem[];
}

const DIAMOND_CUTS = ['Good', 'Very Good', 'Excellent', 'Ideal', '8X']
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']
const DISCOUNT_PRESETS = [0, 5, 10, 15, 20, 25, 30, 40, 50]
const LABEL_PRESETS = ['Popular', 'Limited', 'Featured', 'New', 'Best Seller', 'Sale', 'Exclusive']

function isVideo(u: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(u) || /youtube\.com|youtu\.be|vimeo\.com|drive\.google\.com|docs\.google\.com/i.test(u)
}

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState('')
  const moreFileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const mainFileRef = useRef<HTMLInputElement>(null)

  const [selectedRootCategoryId, setSelectedRootCategoryId] = useState<string>("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")

  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parent_category_id)
  }, [categories])

  const childCategories = useMemo(() => {
    if (!selectedRootCategoryId) return []
    return categories.filter(c => c.parent_category_id === selectedRootCategoryId)
  }, [categories, selectedRootCategoryId])

  // (Removed noisy dev-time console logs for category selection)

  useEffect(() => {
    const finalCategoryId = selectedSubCategoryId || selectedRootCategoryId;
    const finalCategoryObj = categories.find(c => c.id === finalCategoryId);
    const finalCategoryName = finalCategoryObj ? finalCategoryObj.name : '';
    setFormData(p => {
      if (p.category === finalCategoryName) return p;
      return { ...p, category: finalCategoryName };
    });
  }, [selectedRootCategoryId, selectedSubCategoryId, categories]);

  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'INR'>('USD')
  const [fxRate, setFxRate] = useState(83)

  const [formData, setFormData] = useState({
    name: '', category: '', price: '', description: '',
    carat: '', color: '', clarity: '', metal: '', style: '',
    diamond_shape: '', diamond_cut: '', is_featured: false,
    stock_quantity: 10,
    // Estimated delivery window — empty = "2–3 weeks from today" on the PDP.
    delivery_from: '', delivery_to: '',
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
  // Bulk-delete selection per global list (metals / carats / sizes) — tick
  // several, delete once, instead of one confirm per row.
  const [bulkDelMetals, setBulkDelMetals] = useState<string[]>([])
  const [bulkDelCarats, setBulkDelCarats] = useState<string[]>([])
  const [bulkDelSizes, setBulkDelSizes] = useState<string[]>([])
  // Per-category sizes: picker state. `newSizeCats` = categories for the size
  // being added: null = default (this product's category), [] = all categories.
  // `showAllSizes` lifts the category filter so every global size can still
  // be managed from any product.
  // `expandedSizeKey` opens the inline applies-to editor for one size row.
  const [newSizeCats, setNewSizeCats] = useState<string[] | null>(null)
  const [showAllSizes, setShowAllSizes] = useState(false)
  const [expandedSizeKey, setExpandedSizeKey] = useState<string | null>(null)
  // Draft applies-to selections while a size row's inline editor is open.
  const [editedSizeCats, setEditedSizeCats] = useState<Record<string, string[]>>({})

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
  const [customSections, setCustomSections] = useState<CustomOptionSection[]>([])
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({})
  const [newItemPrices, setNewItemPrices] = useState<Record<string, string>>({})

  const [images, setImages] = useState<string[]>([])
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [mainImgUrl, setMainImgUrl] = useState('')
  const [moreImgUrl, setMoreImgUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [model3d, setModel3d] = useState<string | null>(null)
  const [model3dUploading, setModel3dUploading] = useState(false)
  const [ringStyles, setRingStyles] = useState<{ key: string; name: string; is_enabled?: boolean; category_ids?: string[] }[]>([])
  const [newStyleName, setNewStyleName] = useState('')
  const [diamondShapes, setDiamondShapes] = useState<{ key: string; name: string; is_enabled?: boolean; model_3d?: string; category_ids?: string[] }[]>([])
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('admin_currency_pref') as 'USD' | 'INR'
      if (c) setPriceCurrency(c)
    }
    // Server is the single source of truth (fixed admin rate, else live).
    resolveAdminFxRate().then((r) => setFxRate(r))
    loadCategories(); loadStyles(); loadDiamondShapes(); loadMetalOptions(); loadSizeOptions(); loadCaratOptions()
  }, [])

  const showStatus = (type: 'success' | 'error', msg: string) => {
    setUploadStatus({ type, msg });
    setTimeout(() => setUploadStatus({ type: 'none', msg: '' }), 5000);
  }

  const loadCategories = async () => {
    try {
      const data = await fetch('/api/categories').then(r => r.json())
      setCategories(data)
      if (data.length > 0) {
        const firstParent = data.find((c: any) => !c.parent_category_id)
        if (firstParent) {
          setSelectedRootCategoryId(firstParent.id)
          setSelectedSubCategoryId("")
        }
      }
    } catch { setCategories([]) }
  }
  const loadStyles = async () => {
    try {
      const j = await fetch('/api/styles', { cache: "no-store" }).then(r => r.json())
      setRingStyles((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
    } catch { setRingStyles([]) }
  }
  const loadDiamondShapes = async () => {
    try {
      const j = await fetch('/api/diamond-shapes', { cache: "no-store" }).then(r => r.json())
      setDiamondShapes((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
    } catch { setDiamondShapes([]) }
  }
  const loadMetalOptions = async () => {
    try {
      const j = await fetch('/api/metal-options', { cache: "no-store" }).then(r => r.json())
      setMetalOptions(Array.isArray(j) ? j : [])
    } catch { setMetalOptions([]) }
  }
  const loadSizeOptions = async () => {
    try {
      const j = await fetch('/api/size-options', { cache: "no-store" }).then(r => r.json())
      setSizeOptions(Array.isArray(j) ? j : [])
    } catch { setSizeOptions([]) }
  }
  const loadCaratOptions = async () => {
    try {
      const j = await fetch('/api/carat-options', { cache: "no-store" }).then(r => r.json())
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
        showStatus('success', 'New carat option added successfully');
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
        showStatus('success', 'Carat option deleted globally');
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
    showStatus('success', `Added custom section "${title}"`);
  }

  const removeCustomSection = (secId: string) => {
    if (!confirm('Remove this custom option section?')) return
    setCustomSections(prev => prev.filter(s => s.id !== secId))
  }

  const addCustomOptionItem = (secId: string) => {
    const name = (newItemNames[secId] || '').trim(); if (!name) return
    // Held in DISPLAY currency (converted to USD only at save) — same model
    // as the metal/size/carat upcharge inputs.
    const rawPrice = parseFloat(newItemPrices[secId] || '0') || 0
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      const exists = sec.items.some(i => i.key === key)
      if (exists) return sec
      return {
        ...sec,
        items: [...sec.items, { key, name, price_modifier: rawPrice, is_enabled: true }]
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
    // Display currency in state; converted to USD at save.
    const rawPrice = parseFloat(priceStr) || 0
    setCustomSections(prev => prev.map(sec => {
      if (sec.id !== secId) return sec
      return {
        ...sec,
        items: sec.items.map(item => item.key === itemKey ? { ...item, price_modifier: rawPrice } : item)
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
    // Smart default: null = this product's category; explicit [] = all.
    const cats = newSizeCats === null ? (productCatId ? [productCatId] : []) : newSizeCats
    try {
      setLoading(true)
      const r = await fetch('/api/size-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ key, name, price_modifier: priceMod, is_enabled: true, position: sizeOptions.length, category_ids: cats }]
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
        setNewSizeCats(null)
        showStatus('success', 'New size option added successfully');
      } else {
        setError('Failed to add new size option');
      }
    } catch {
      setError('Failed to add new size option');
    } finally {
      setLoading(false)
    }
  }

  const addNewStyle = async () => {
    const name = newStyleName.trim(); if (!name) return
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    // Stamp the product's category so the style lands in the right homepage
    // section instead of the global "Featured" bucket.
    const category_ids = defaultScopeFor(productCatId)
    // …and place it in the homepage section that matches this category
    // ("Rings By Style" for a ring, "Necklaces By Style" for a necklace).
    let section_id: string | null = null
    try {
      const list = await fetch('/api/style-sections', { cache: 'no-store' }).then(r => r.json())
      const rows = Array.isArray(list) ? list : []
      // Matching section by category, else null → the API creates the right
      // box itself ("Necklaces By Style") for a category that has none yet.
      section_id =
        (productCatId ? rows.find((s: any) => s.id && (s.category_ids || []).includes(productCatId))?.id : undefined) || null
    } catch { section_id = null }
    try {
      const r = await fetch('/api/styles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ key, name, is_enabled: true, category_ids, section_id }] }) })
      if (r.ok) {
        const j = await r.json()
        setRingStyles((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
        setFormData(p => ({ ...p, style: key })); setNewStyleName('');
        showStatus('success', 'New style added successfully');
        return
      }
    } catch { }
    setRingStyles(p => p.find(s => s.key === key) ? p : [...p, { key, name, is_enabled: true, category_ids, section_id } as any])
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
        showStatus('success', 'New metal option added successfully');
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
        showStatus('success', 'Metal option deleted globally');
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
        showStatus('success', 'Size option deleted globally');
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

  // ── Bulk delete: one confirm for many rows, parallel API calls, then a
  // single state sweep per list (no per-row confirm/loading churn). ──
  const sweepCombosForKeys = (
    keys: Set<string>,
    setSel: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
    setHid: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void,
    setOv: (updater: (prev: Record<string, string>) => Record<string, string>) => void,
    matchMetal: boolean
  ) => {
    const drop = (prev: Record<string, any>) => {
      const next = { ...prev }
      Object.keys(next).forEach(vkey => {
        const parts = vkey.split('__')
        const hit = matchMetal ? keys.has(parts[0]) : keys.has(parts[1])
        if (hit) delete next[vkey]
      })
      return next
    }
    setSel(drop as any); setHid(drop as any); setOv(drop as any)
  }

  const bulkDeleteMetals = async (keys: string[]) => {
    if (keys.length === 0) return
    const names = metalOptions.filter(o => keys.includes(o.key)).map(o => o.name)
    if (!confirm(`Delete ${keys.length} metal option(s) globally?\n${names.slice(0, 8).join(', ')}${names.length > 8 ? '…' : ''}\nThis cannot be undone.`)) return
    try {
      setLoading(true)
      const results = await Promise.all(keys.map(k =>
        fetch(`/api/metal-options?key=${encodeURIComponent(k)}`, { method: 'DELETE' })
          .then(r => ({ k, ok: r.ok })).catch(() => ({ k, ok: false as boolean }))
      ))
      const okKeys = new Set(results.filter(r => r.ok).map(r => r.k))
      if (okKeys.size === 0) { setError('Failed to delete metal options'); return }
      setMetalOptions(prev => prev.filter(o => !okKeys.has(o.key)))
      setSelectedMetals(prev => prev.filter(k => !okKeys.has(k)))
      setProductMetalPrices(prev => { const n = { ...prev }; okKeys.forEach(k => { delete n[k] }); return n })
      sweepCombosForKeys(okKeys, setComboSel, setHiddenCombos, setVariantOverrides, true)
      setBulkDelMetals([])
      showStatus('success', `Deleted ${okKeys.size} metal option(s) globally`)
      if (okKeys.size < keys.length) setError(`${keys.length - okKeys.size} option(s) could not be deleted`)
    } catch { setError('Failed to delete metal options') }
    finally { setLoading(false) }
  }

  const bulkDeleteCarats = async (keys: string[]) => {
    if (keys.length === 0) return
    const names = caratOptions.filter(o => keys.includes(o.key)).map(o => o.name)
    if (!confirm(`Delete ${keys.length} diamond weight option(s) globally?\n${names.slice(0, 8).join(', ')}${names.length > 8 ? '…' : ''}\nThis cannot be undone.`)) return
    try {
      setLoading(true)
      const results = await Promise.all(keys.map(k =>
        fetch(`/api/carat-options?key=${encodeURIComponent(k)}`, { method: 'DELETE' })
          .then(r => ({ k, ok: r.ok })).catch(() => ({ k, ok: false as boolean }))
      ))
      const okKeys = new Set(results.filter(r => r.ok).map(r => r.k))
      if (okKeys.size === 0) { setError('Failed to delete carat options'); return }
      setCaratOptions(prev => prev.filter(o => !okKeys.has(o.key)))
      setSelectedCarats(prev => prev.filter(k => !okKeys.has(k)))
      setProductCaratPrices(prev => { const n = { ...prev }; okKeys.forEach(k => { delete n[k] }); return n })
      sweepCombosForKeys(okKeys, setComboSel, setHiddenCombos, setVariantOverrides, false)
      setBulkDelCarats([])
      showStatus('success', `Deleted ${okKeys.size} diamond weight option(s) globally`)
      if (okKeys.size < keys.length) setError(`${keys.length - okKeys.size} option(s) could not be deleted`)
    } catch { setError('Failed to delete carat options') }
    finally { setLoading(false) }
  }

  const bulkDeleteSizes = async (keys: string[]) => {
    if (keys.length === 0) return
    const names = sizeOptions.filter(o => keys.includes(o.key)).map(o => o.name)
    if (!confirm(`Delete ${keys.length} size option(s) globally?\n${names.slice(0, 8).join(', ')}${names.length > 8 ? '…' : ''}\nThis cannot be undone.`)) return
    try {
      setLoading(true)
      const results = await Promise.all(keys.map(k =>
        fetch(`/api/size-options?key=${encodeURIComponent(k)}`, { method: 'DELETE' })
          .then(r => ({ k, ok: r.ok })).catch(() => ({ k, ok: false as boolean }))
      ))
      const okKeys = new Set(results.filter(r => r.ok).map(r => r.k))
      if (okKeys.size === 0) { setError('Failed to delete size options'); return }
      setSizeOptions(prev => prev.filter(o => !okKeys.has(o.key)))
      setSelectedSizes(prev => prev.filter(k => !okKeys.has(k)))
      setProductSizePrices(prev => { const n = { ...prev }; okKeys.forEach(k => { delete n[k] }); return n })
      setBulkDelSizes([])
      showStatus('success', `Deleted ${okKeys.size} size option(s) globally`)
      if (okKeys.size < keys.length) setError(`${keys.length - okKeys.size} option(s) could not be deleted`)
    } catch { setError('Failed to delete size options') }
    finally { setLoading(false) }
  }

  // ── Per-category sizes ──────────────────────────────────────────────
  // This product's category id (child wins over root).
  const productCatId = selectedSubCategoryId || selectedRootCategoryId || ''
  // Style / shape dropdowns are category-aware too: a necklace form lists
  // necklace styles (and any universal ones), never ring-only entries.
  const visibleRingStyles = useMemo(
    () => ringStyles.filter(s => (s as any).is_enabled !== false && optionAppliesToCategory(s, productCatId)),
    [ringStyles, productCatId]
  )
  const visibleDiamondShapes = useMemo(
    () => diamondShapes.filter(s => optionAppliesToCategory(s, productCatId)),
    [diamondShapes, productCatId]
  )
  // Dropping a pick that no longer applies keeps the saved value honest when
  // the admin switches category mid-form. Never runs before the style list
  // itself has loaded, or it would wipe a valid pick.
  useEffect(() => {
    if (!productCatId || ringStyles.length === 0) return
    setFormData(p => {
      if (p.style && !ringStyles.some(s => s.key === p.style && optionAppliesToCategory(s, productCatId))) {
        return { ...p, style: '' }
      }
      return p
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCatId])
  // Rows shown in the picker: only sizes for this category (plus universal),
  // unless the admin lifts the filter to manage the whole global list.
  const visibleSizeOptions = useMemo(() => {
    const enabled = sizeOptions.filter(o => o.is_enabled !== false)
    if (showAllSizes || !productCatId) return enabled
    return enabled.filter(o => sizeAppliesToCategory(o, productCatId))
  }, [sizeOptions, showAllSizes, productCatId])
  // Name of the category being picked ("" = none) — drives the header chip
  // and the segmented control, so the admin always sees which category's
  // sizes are on screen.
  const sizeCatName = productCatId
    ? (categories.find((c: any) => String(c.id) === String(productCatId))?.name || '')
    : ''
  const totalSizeCount = sizeOptions.filter(o => o.is_enabled !== false).length
  // When the category changes, drop ticked sizes that no longer apply, so a
  // necklace can never keep a ring size ticked by accident.
  useEffect(() => {
    if (!productCatId) return
    setSelectedSizes(prev => prev.filter(k => {
      const o = sizeOptions.find(x => x.key === k)
      return !o || sizeAppliesToCategory(o, productCatId)
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCatId])
  // Human label for a size row's applies-to set.
  const sizeAppliesLabel = (o: any): string => {
    const cats: string[] = Array.isArray(o?.category_ids) ? o.category_ids : []
    if (cats.length === 0) return 'All categories'
    const names = cats
      .map(id => categories.find((c: any) => String(c.id) === String(id))?.name)
      .filter(Boolean) as string[]
    if (names.length === 0) return `${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}`
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`
  }
  // Persist an applies-to edit for one size (full row re-sent: the PUT
  // upserts by key and nulls any omitted scalar, so send everything).
  const saveSizeCats = async (opt: any, cats: string[]) => {
    try {
      setLoading(true)
      const r = await fetch('/api/size-options', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ key: opt.key, name: opt.name, price_modifier: Number(opt.price_modifier) || 0, is_enabled: opt.is_enabled !== false, position: Number(opt.position) || 0, category_ids: cats }] }),
      })
      if (!r.ok) { setError('Failed to save size categories'); return }
      setSizeOptions(prev => prev.map(o => o.key === opt.key ? { ...o, category_ids: cats } : o))
      setExpandedSizeKey(null)
      showStatus('success', 'Size categories saved');
    } catch { setError('Failed to save size categories') }
    finally { setLoading(false) }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCategory.trim() }) })
      if (res.ok) {
        const created = await res.json()
        const updated = [...categories, created].sort((a, b) => a.name.localeCompare(b.name))
        setCategories(updated)
        setSelectedRootCategoryId(created.id)
        setSelectedSubCategoryId("")
        setNewCategory('')
        showStatus('success', 'New category added');
      }
    } catch { }
  }

  // Upload a 3D model for THIS product. No diamond-shape / category
  // restriction — any product can optionally carry its own model_3d.
  async function uploadModel3d(file: File | null) {
    if (!file) return
    // Web viewer (<model-viewer>) only renders GLB/GLTF; USDZ/OBJ/FBX show blank.
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      showStatus('error', 'Only .glb / .gltf files work in the web 3D viewer. Please convert your model to GLB.');
      return
    }
    try {
      setModel3dUploading(true);
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload-3d', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) {
        showStatus('error', j?.error || '3D upload failed');
        return
      }
      setModel3d(j.url)
      showStatus('success', '3D model uploaded successfully');
    } catch (err) {
      showStatus('error', '3D upload failed - check connection');
    } finally {
      setModel3dUploading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

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
      // Custom-section items are display-currency in state too.
      setCustomSections(prev => prev.map(sec => ({
        ...sec,
        items: sec.items.map(it => {
          const n = parseFloat(String(it.price_modifier))
          return { ...it, price_modifier: !isFinite(n) ? it.price_modifier : Math.round(n * f * 100) / 100 }
        })
      })))
      setNewMetalPrice(v => conv(v))
      setNewSizePrice(v => conv(v))
      setNewCaratPrice(v => conv(v))
      setNewItemPrices(convMap)
    }
    setPriceCurrency(next)
    try { localStorage.setItem('admin_currency_pref', next) } catch { }
  }

  // Enter inside a field must NOT submit the form — an accidental save used to
  // fire mid-typing. Only the explicit "Save" button may submit.
  const stopEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return
    const el = e.target as HTMLElement
    if (el.tagName === 'TEXTAREA') return                 // newline in descriptions
    if (el.tagName === 'BUTTON') return                   // Enter = click on a focused button
    if ((el as HTMLInputElement).type === 'submit') return
    e.preventDefault()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    // Retail price is optional when variants are offered — each variant row
    // carries its own price and the base is stored as 0.
    const hasOfferedVariants = selectedMetals.length > 0 || selectedCarats.length > 0
    if (!formData.name || !formData.category || (!formData.price && !hasOfferedVariants)) {
      setError(hasOfferedVariants
        ? 'Please fill in required fields: Name and Category. (Retail price is optional when variants are offered.)'
        : 'Please fill in required fields: Name, Price, and Category.');
      setLoading(false);
      return;
    }

    const toSlug = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = toSlug(formData.name) || String(Date.now())

    try {
      const raw = parseFloat(formData.price)
      if (formData.price !== '' && isNaN(raw)) {
        setError('Invalid price format.');
        setLoading(false);
        return;
      }

      const priceUSD = isNaN(raw) ? 0 : (priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100)
      const catNorm = String(formData.category || '').toLowerCase()
      const styleFinal = catNorm.startsWith('diamond') ? (formData.diamond_shape || formData.style) : formData.style

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

      const toOptPayload = (list: any[], sel: string[], prices: Record<string, string>) =>
        list
          .filter(o => o.is_enabled !== false && sel.includes(o.key))
          .map(o => {
            const rawMod = parseFloat(prices[o.key] || '0')
            const modUSD = priceCurrency === 'USD' ? rawMod : Math.round((rawMod / fxRate) * 100) / 100
            return {
              key: o.key,
              name: o.name,
              price_modifier: isNaN(modUSD) ? 0 : modUSD
            }
          })
      const metalOut = toOptPayload(metalOptions, finalMetals, productMetalPrices)
      const sizeOut = toOptPayload(sizeOptions, selectedSizes, productSizePrices)
      const caratOut = toOptPayload(caratOptions, finalCarats, productCaratPrices)

      // ── Zero-price guard ── never create a product the shopper sees at 00.
      if (!(payloadStartingRetail(priceUSD, metalOut, caratOut, variantRows) > 0)) {
        const onlySingle = (finalMetals.length > 0) !== (finalCarats.length > 0)
        setError(onlySingle
          ? 'Set an upcharge on each material / diamond-weight row below, or set a retail price — otherwise this product would list at 00.'
          : (finalMetals.length > 0 || finalCarats.length > 0)
            ? 'Every variant totals 0 — set a per-row rate in the Material & Diamond Weight table, or set a retail price.'
            : 'Set a retail price — otherwise this product would list at 00 and stay hidden.');
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        category: formData.category,
        category_id: selectedSubCategoryId || selectedRootCategoryId || null,
        style: styleFinal,
        slug,
        price: priceUSD,
        discount_percent: discountPercent,
        label: label.trim(),
        model_3d: model3d,
        image: mainImage || images[0] || null,
        images: mainImage ? [mainImage, ...images.filter(u => u !== mainImage)] : images,
        metal_options: metalOut,
        size_options: sizeOut,
        carat_options: caratOut,
        // Custom items are held in DISPLAY currency in state — convert to USD.
        custom_options: customSections.map(sec => ({
          title: sec.title,
          items: sec.items.filter(i => i.is_enabled !== false).map(i => ({
            ...i,
            price_modifier: toUSD(String(i.price_modifier ?? '0')),
          }))
        })),
        variant_prices: variantRows
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const createdBody: any = await res.json().catch(() => ({}));
      if (res.ok) {
        if (createdBody.variant_saved === false && touchedVariants) {
          toast({ title: 'Migration needed', description: 'Product created, but per-row rates were NOT saved — run migration 116_product_variant_prices.sql, then set rates on the Edit page.' });
          router.push(`/admin/products/${createdBody.id}/edit`);
        } else {
          toast({ title: 'Creation Successful', description: 'Your masterpiece has been added to the vault.' });
          router.push('/admin/products');
        }
      } else {
        setError(createdBody.error || 'Failed to create product.');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false)
    }
  }

  const handleMainFile = async (file: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showStatus('error', data?.error || 'Main image upload failed'); return }
      setMainImage(data.url);
      setImages(p => p.filter(u => u !== data.url));
      showStatus('success', 'Main image uploaded successfully');
    } catch {
      showStatus('error', 'Upload failed');
    } finally {
      setLoading(false);
    }
  }
  const handleMoreFiles = async (files: FileList | null) => {
    if (!files) return;
    let count = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData(); fd.append('file', file)
        const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
        const data = await res.json()
        if (res.ok) {
          setImages(p => [...p, data.url]);
          count++;
        }
      } catch { }
    }
    if (count > 0) showStatus('success', `${count} additional images uploaded`);
  }
  const handleAddMoreUrl = async () => {
    const url = moreImgUrl.trim(); if (!url) return;
    try {
      setLoading(true);
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      const data = await res.json()
      if (!res.ok) { showStatus('error', 'Failed to import from URL'); return }
      setImages(p => [...p, data.url]); setMoreImgUrl('');
      showStatus('success', 'Image imported from URL');
    } finally {
      setLoading(false);
    }
  }
  const handleVideoFile = async (file: File | null) => {
    if (!file) return; setVideoUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/storage/upload-product-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { showStatus('error', 'Video upload failed'); return }
      setImages(p => [...p, data.url]);
      showStatus('success', 'Video uploaded successfully');
    } catch { showStatus('error', 'Video upload failed — file may be too large') }
    finally { setVideoUploading(false) }
  }
  const handleAddVideoUrl = () => {
    const url = videoUrl.trim(); if (!url) return
    // Google Drive links must carry an extractable file ID — otherwise the
    // storefront cannot embed them. Reject early with a clear message.
    if (isDriveUrl(url) && !extractDriveId(url)) {
      showStatus('error', 'This Google Drive link has no file ID. Open the file in Drive → Share → "Anyone with the link" → Copy link.');
      return
    }
    setImages(p => [...p, url]); setVideoUrl('');
    showStatus('success', isDriveUrl(url) ? 'Google Drive video added — plays inside our viewer' : 'Video link added');
  }
  const removeImage = (idx: number) => setImages(p => p.filter((_, i) => i !== idx))

  const isDia = (v: string) => String(v || '').toLowerCase().startsWith('diamond')

  const pricePreviewUSD = (() => {
    const raw = parseFloat(formData.price)
    if (!isFinite(raw)) return '0.00'
    return priceCurrency === 'USD' ? raw.toFixed(2) : (Math.round((raw / fxRate) * 100) / 100).toFixed(2)
  })()

  // Shopper-facing "Starting at" (USD) for the current form state — variant
  // products store base 0, so a base-only preview would wrongly show $0.00.
  const newStartingUSD = (() => {
    const raw = parseFloat(formData.price)
    const base = !isFinite(raw) ? 0 : (priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100)
    const cToUSD = (disp: string) => {
      const n = parseFloat(disp) || 0
      return priceCurrency === 'USD' ? n : Math.round((n / fxRate) * 100) / 100
    }
    const dispOf = (store: Record<string, string>, key: string, glob: any) =>
      store[key] ?? String((priceCurrency === 'USD' ? glob?.price_modifier : (glob?.price_modifier || 0) * fxRate) || 0)
    const ticked = Object.keys(comboSel).filter(k => comboSel[k] && !hiddenCombos[k])
    const rows = ticked.map(vkey => {
      const [mk, ck] = vkey.split('__')
      if (variantOverrides[vkey] !== undefined) return { price_modifier: cToUSD(variantOverrides[vkey]) }
      const m = metalOptions.find(o => o.key === mk)
      const c = caratOptions.find(o => o.key === ck)
      if (!m || !c) return null
      return { price_modifier: Math.round((cToUSD(dispOf(productMetalPrices, mk, m)) + cToUSD(dispOf(productCaratPrices, ck, c))) * 100) / 100 }
    }).filter(Boolean) as Array<{ price_modifier: number }>
    const metals = selectedMetals.map(k => {
      const g = metalOptions.find(o => o.key === k)
      return { price_modifier: g ? cToUSD(dispOf(productMetalPrices, k, g)) : 0 }
    })
    const carats = selectedCarats.map(k => {
      const g = caratOptions.find(o => o.key === k)
      return { price_modifier: g ? cToUSD(dispOf(productCaratPrices, k, g)) : 0 }
    })
    return payloadStartingRetail(base, metals, carats, rows)
  })()

  return (
    <div className="a-page">
      <style>{`
        .np-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 14px; margin-top: 24px; }
        .np-media-item {
          aspect-ratio: 1; border: 1px solid var(--c-border); border-radius: var(--radius);
          position: relative; background: var(--c-surface); overflow: hidden;
        }
        .np-media-item img, .np-media-item video { width: 100%; height: 100%; object-fit: cover; }
        .np-media-item--primary { border: 2px solid var(--c-accent); }
        .np-media-remove {
          position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
          background: rgba(44,35,30,0.55); color: #fff; border: none; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: background .2s ease;
        }
        .np-media-remove:hover { background: var(--c-danger); }
        .np-media-badge {
          position: absolute; bottom: 0; left: 0; right: 0; background: var(--c-accent); color: #fff;
          font-size: 8px; font-weight: 600; letter-spacing: .12em; text-align: center; padding: 3px 0;
          font-family: var(--font-dmsans);
        }
        .np-video-thumb { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--c-surface-2); }
        .np-dropzone {
          border: 1.5px dashed var(--c-border-strong); border-radius: var(--radius);
          padding: 32px; text-align: center; background: var(--c-surface); cursor: pointer;
          transition: .2s ease; color: var(--c-text-muted); font-family: var(--font-dmsans); font-size: 12px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 140px;
        }
        .np-dropzone:hover { border-color: var(--c-accent); background: #fff; }
        .np-dropzone svg { color: var(--c-accent); }
        .np-dropzone img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm); }
        .np-opt-grid { display: grid; grid-template-columns: 2.5fr 2fr 0.8fr 0.5fr; gap: 12px; align-items: center; }
        .np-opt-head {
          font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em;
          color: var(--c-text-muted); font-family: var(--font-dmsans);
          border-bottom: 1px solid var(--c-border); padding-bottom: 8px;
        }
        /* Flat option grid (5 cols) — materials / diamond weights / sizes */
        .np-mc-grid { display: grid; grid-template-columns: 0.5fr 1.6fr 1.4fr 1.6fr 0.5fr; gap: 12px; align-items: center; }
        .np-combo-toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
        .np-glob-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .np-glob-chip {
          display: inline-flex; align-items: center; gap: 6px;
          height: 28px; padding: 0 6px 0 12px;
          background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 999px;
          font-family: var(--font-dmsans); font-size: 11px; font-weight: 500; color: var(--c-text);
        }
        .np-glob-chip button {
          display: flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%; border: none; cursor: pointer;
          background: transparent; color: var(--c-danger);
        }
        .np-glob-chip button:hover { background: var(--c-danger); color: #fff; }
        .np-mc-head {
          font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em;
          color: var(--c-text-muted); font-family: var(--font-dmsans);
          border-bottom: 1px solid var(--c-border); padding: 0 4px 10px;
        }
        .np-mc-head {
          font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .1em;
          color: var(--c-text-muted); font-family: var(--font-dmsans);
          border-bottom: 1px solid var(--c-border); padding: 0 4px 10px;
        }
        .np-mc-row { padding: 6px 4px; border-bottom: 1px dashed rgba(0,0,0,0.06); }
        .np-mc-row:hover { background: rgba(140,116,86,0.04); border-radius: 6px; }
        .np-mc-cell { font-family: var(--font-dmsans); font-size: 13px; font-weight: 500; color: var(--c-text); }
        .np-mc-cell-muted { font-size: 12px; color: var(--c-text-muted); font-weight: 400; }
        .np-mc-check { display: flex; justify-content: center; }
        .np-mc-del { display: flex; justify-content: center; }

        /* ── Size-options picker (category-scoped) ───────────────────────────
           One line per size: tick · name(+scope) · upcharge · delete. The
           scope row only shows in "All categories" mode, so the default
           filtered view is clean — just sizes for the category in hand. */
        .sz-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 4px 0 10px; }
        .sz-seg { display: inline-flex; padding: 3px; border: 1px solid var(--c-border); border-radius: 999px; background: var(--c-surface); }
        .sz-seg-btn {
          border: none; background: transparent; cursor: pointer; border-radius: 999px;
          padding: 7px 15px; font-family: var(--font-dmsans); font-size: 11.5px; font-weight: 600;
          letter-spacing: .04em; color: var(--c-text-muted); transition: background .15s, color .15s;
        }
        .sz-seg-btn:hover:not(:disabled) { color: var(--c-text); }
        .sz-seg-btn:disabled { opacity: .5; cursor: not-allowed; }
        .sz-seg-btn.is-on { background: var(--c-text); color: #fff; }
        .sz-count { font-family: var(--font-dmsans); font-size: 10.5px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--c-text-muted); }
        .sz-actions-bar { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
        .sz-hint { font-family: var(--font-dmsans); font-size: 11px; color: var(--c-text-muted); }
        .sz-cat-chip {
          font-family: var(--font-dmsans); font-size: 10.5px; font-weight: 600; letter-spacing: .06em;
          text-transform: uppercase; color: var(--c-accent); background: var(--c-surface-2);
          border: 1px solid var(--c-border); border-radius: 999px; padding: 3px 11px;
        }
        .sz-grid { display: grid; grid-template-columns: 26px minmax(150px, 1.5fr) minmax(130px, 1fr) 92px; gap: 12px; align-items: center; }
        .sz-head {
          border-bottom: 1px solid var(--c-border); padding: 0 6px 10px;
          font-family: var(--font-dmsans); font-size: 10px; font-weight: 600;
          letter-spacing: .12em; text-transform: uppercase; color: var(--c-text-muted);
        }
        .sz-row { padding: 9px 6px; border-bottom: 1px dashed rgba(0,0,0,.07); }
        .sz-row:hover { background: rgba(140,116,86,.04); border-radius: 8px; }
        .sz-name { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .sz-name b { font-family: var(--font-dmsans); font-size: 13px; font-weight: 600; color: var(--c-text); }
        .sz-scope {
          font-family: var(--font-dmsans); font-size: 10.5px; color: var(--c-text-muted);
          background: var(--c-surface-2); border: 1px solid var(--c-border);
          border-radius: 999px; padding: 2px 9px; white-space: nowrap;
        }
        .sz-cell-end { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
        .sz-scope-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 0 6px 10px 44px; }
        .sz-editor { margin: 0 0 12px 44px; padding: 12px; border: 1px dashed var(--c-border); border-radius: var(--radius); background: var(--c-surface); }
        .np-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .np-chip {
          height: 34px; padding: 0 14px;
          background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 999px;
          font-family: var(--font-dmsans); font-size: 12px; font-weight: 500; color: var(--c-text-muted);
          cursor: pointer; transition: .2s cubic-bezier(.4,0,.2,1);
        }
        .np-chip:hover { border-color: var(--c-accent); color: var(--c-accent); }
        .np-chip.on { background: var(--c-accent); border-color: var(--c-accent); color: #fff; box-shadow: var(--shadow-sm); }
      `}</style>

      <Link href="/admin/products" className="a-back">
        <ArrowLeft size={14} /> Back to Vault
      </Link>

      <div className="a-head">
        <div>
          <span className="a-eyebrow">New Product</span>
          <h1 className="a-title">Add <em>New Creation</em></h1>
          <p className="a-subtitle">Design and document your latest masterpiece for the collection.</p>
        </div>
      </div>

      {error && (
        <div className="a-card" style={{ borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)', marginBottom: 20 }}>
          <div className="a-row a-row--between" style={{ padding: '14px 18px', color: 'var(--c-danger)' }}>
            <span className="a-row" style={{ gap: 10 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </span>
            <button type="button" className="a-icon-btn a-icon-btn--sm" onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {uploadStatus.type !== 'none' && (
        <div
          className="a-card"
          style={{
            marginBottom: 20,
            borderColor: uploadStatus.type === 'success' ? 'var(--c-success)' : 'var(--c-danger)',
            background: uploadStatus.type === 'success' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
          }}
        >
          <div className="a-row" style={{ gap: 10, padding: '14px 18px', color: uploadStatus.type === 'success' ? 'var(--c-success)' : 'var(--c-danger)' }}>
            {uploadStatus.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{uploadStatus.msg}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} onKeyDown={stopEnterSubmit}>
        <div className="a-grid-2">

          {/* ── MAIN CONTENT ── */}
          <div className="a-stack">

            {/* Section: Basic Identity */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Product <em>Identity</em></h2>
              </div>
              <div className="a-card-body">
                <div className="a-field">
                  <label className="a-label">Masterpiece Name <span className="a-req">*</span></label>
                  <input className="a-input" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Radiant Solitaire Ring" />
                </div>

                <div className="a-field" style={{ marginTop: 16 }}>
                  <label className="a-label">Collection / Category <span className="a-req">*</span></label>
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

                  <div className="a-row" style={{ gap: 8, marginTop: 12 }}>
                    <input className="a-input" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category..." />
                    <button type="button" className="a-btn a-btn--subtle" onClick={handleAddCategory}>Add</button>
                  </div>
                </div>

                <div className="a-field" style={{ marginTop: 24 }}>
                  <label className="a-label">Story / Description</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                    placeholder="The heritage and details of this piece..."
                  />
                </div>
              </div>
            </div>

            {/* Section: Pricing & Inventory */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Value & <em>Availability</em></h2>
              </div>
              <div className="a-card-body">
                <div className="a-form-grid a-form-grid--3">
                  <div className="a-field">
                    <label className="a-label">Retail Price ({priceCurrency}) {(selectedMetals.length === 0 && selectedCarats.length === 0) && <span className="a-req">*</span>}</label>
                    <input className="a-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" />
                    <p className="a-hint">Approx. ${pricePreviewUSD} USD
                      {(selectedMetals.length > 0 || selectedCarats.length > 0) && (
                        <span> · Shopper sees <span style={{ color: 'var(--c-accent)', fontWeight: 600 }}>starting at ${newStartingUSD.toFixed(2)}</span></span>
                      )}
                    </p>
                    {(selectedMetals.length > 0 || selectedCarats.length > 0) && (
                      <p className="a-hint" style={{ marginTop: 4 }}>Optional — variants below carry their own prices; empty is stored as 0 base.</p>
                    )}
                  </div>
                  <div className="a-field">
                    <label className="a-label">Preferred Currency</label>
                    <select className="a-select" value={priceCurrency} onChange={e => switchCurrency(e.target.value as 'USD' | 'INR')}>
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Stock Quantity</label>
                    <input className="a-input" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} />
                  </div>
                </div>

                <hr className="a-divider" />

                <div className="a-field">
                  <label className="a-label">Estimated delivery</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 170px' }}>
                      <span className="a-hint" style={{ display: 'block', marginBottom: 5 }}>Deliver from</span>
                      <input className="a-input" type="date" name="delivery_from" value={formData.delivery_from} onChange={handleChange} />
                    </div>
                    <div style={{ flex: '1 1 170px' }}>
                      <span className="a-hint" style={{ display: 'block', marginBottom: 5 }}>Deliver to</span>
                      <input className="a-input" type="date" name="delivery_to" value={formData.delivery_to} onChange={handleChange} />
                    </div>
                    <div style={{ flex: '1 1 210px', padding: '10px 12px', border: '1px dashed var(--c-border, #E6DCCB)', borderRadius: 10, background: 'var(--c-surface, #FBF8F3)', fontSize: 12, lineHeight: 1.5, color: 'var(--c-muted, #7A6E5F)' }}>
                      Shopper sees{' '}
                      <strong style={{ color: 'var(--c-accent)', fontWeight: 600 }}>{estimatedDeliveryText(formData)}</strong>
                    </div>
                  </div>
                  <p className="a-hint" style={{ marginTop: 8 }}>
                    Leave both empty → the product page automatically shows 2–3 weeks from today.
                  </p>
                </div>
              </div>
            </div>

            {/* Section: Discount & Label */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Discount & <em>Label</em></h2>
                <span className="a-card-sub">Put the piece on sale and tag it for the storefront</span>
              </div>
              <div className="a-card-body">
                <div className="a-field">
                  <label className="a-label">Discount</label>
                  <div className="np-chip-row">
                    {DISCOUNT_PRESETS.map(d => (
                      <button
                        type="button"
                        key={d}
                        className={`np-chip${discountPercent === d ? ' on' : ''}`}
                        onClick={() => setDiscountPercent(d)}
                      >
                        {d === 0 ? 'None' : `${d}% Off`}
                      </button>
                    ))}
                  </div>
                  <div className="a-row" style={{ gap: 8, marginTop: 12, alignItems: 'center' }}>
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
                    // Sale runs off the shopper-facing starting price (base +
                    // first variant), not the bare base — variant products
                    // store base 0, so a base-only preview always showed $0.00.
                    const orig = newStartingUSD
                    const sale = Math.round(orig * (1 - discountPercent / 100) * 100) / 100
                    const inr = (usd: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(usd * fxRate))
                    return (
                      <p className="a-hint" style={{ marginTop: 10 }}>
                        Sale price: <strong style={{ color: 'var(--c-accent)' }}>${sale.toFixed(2)}</strong>{' '}
                        <span>({inr(sale)})</span>{' '}
                        <span style={{ textDecoration: 'line-through' }}>${orig.toFixed(2)}</span>{' '}
                        <span>({inr(orig)})</span>{' '}
                        · {discountPercent}% off (USD, on the starting variant incl. upcharges)
                      </p>
                    )
                  })()}
                </div>

                <hr className="a-divider" />

                <div className="a-field">
                  <label className="a-label">Card Label</label>
                  <div className="np-chip-row">
                    <button type="button" className={`np-chip${!label ? ' on' : ''}`} onClick={() => setLabel('')}>None</button>
                    {LABEL_PRESETS.map(l => (
                      <button
                        type="button"
                        key={l}
                        className={`np-chip${label === l ? ' on' : ''}`}
                        onClick={() => setLabel(l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="a-row" style={{ gap: 8, marginTop: 12 }}>
                    <input className="a-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="Custom label (e.g., Bestseller)..." />
                  </div>
                  <p className="a-hint">Shown as a badge on the product card & product page.</p>
                </div>
              </div>
            </div>

            {/* Section: Media Manager */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-card-title">Media <em>Gallery</em></h2>
                <span className="a-card-sub">Upload images, videos, and models</span>
              </div>
              <div className="a-card-body">
                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Primary Portrait</label>
                    <div className="np-dropzone" onClick={() => mainFileRef.current?.click()}>
                      <input type="file" ref={mainFileRef} style={{ display: 'none' }} onChange={e => handleMainFile(e.target.files?.[0] || null)} />
                      {mainImage ? <img src={mainImage} alt="Main" /> : (
                        <>
                          <Upload size={30} strokeWidth={1} />
                          <p>Drop or click to upload main image</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Additional Views</label>
                    <div className="np-dropzone" style={{ minHeight: 96, padding: 18 }} onClick={() => moreFileRef.current?.click()}>
                      <input type="file" multiple ref={moreFileRef} style={{ display: 'none' }} onChange={e => handleMoreFiles(e.target.files)} />
                      <Plus size={22} strokeWidth={1} />
                      <p>Upload more angles</p>
                    </div>
                    <div className="a-row" style={{ gap: 8, marginTop: 12 }}>
                      <input className="a-input" value={moreImgUrl} onChange={e => setMoreImgUrl(e.target.value)} placeholder="Or paste image URL..." />
                      <button type="button" className="a-btn a-btn--subtle" onClick={handleAddMoreUrl}>Link</button>
                    </div>
                  </div>
                </div>

                <hr className="a-divider" />

                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Cinematic Videos</label>
                    <p className="a-hint" style={{ margin: '0 0 8px' }}>
                      Add as many as you like — repeat the upload or the link. Every video gets its own playable tile on the
                      product page (the first one is the main video).
                    </p>
                    <button type="button" className="a-btn a-btn--ghost a-btn--block" onClick={() => videoFileRef.current?.click()}>
                      <input type="file" accept="video/*" ref={videoFileRef} style={{ display: 'none' }} onChange={e => handleVideoFile(e.target.files?.[0] || null)} />
                      <Video size={16} /> {videoUploading ? 'Uploading...' : 'Upload Video File'}
                    </button>
                    <div className="a-row" style={{ gap: 8, marginTop: 12 }}>
                      <input className="a-input" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube / Vimeo / Google Drive / mp4 link…" />
                      <button type="button" className="a-btn a-btn--subtle" onClick={handleAddVideoUrl}>Add</button>
                    </div>
                    {videoUrl.trim() !== '' && isDriveUrl(videoUrl.trim()) && (
                      extractDriveId(videoUrl.trim())
                        ? <p className="a-hint" style={{ marginTop: 6, color: 'var(--c-success)' }}>✓ Google Drive video detected — will play inside our viewer. Keep sharing as “Anyone with the link”.</p>
                        : <p className="a-hint" style={{ marginTop: 6, color: 'var(--c-danger)' }}>This Drive link has no file ID — open the file → Share → “Anyone with the link” → Copy link.</p>
                    )}
                    <p className="a-hint" style={{ marginTop: 6 }}>Drive: right-click file → Share → “Anyone with the link can view” → Copy link.</p>
                  </div>
                  <div className="a-field">
                    <label className="a-label">3D Interaction (GLB/GLTF)</label>
                    <button type="button" className="a-btn a-btn--ghost a-btn--block" onClick={() => document.getElementById('3d-up')?.click()}>
                      <input id="3d-up" type="file" accept=".glb,.gltf" style={{ display: 'none' }} onChange={e => uploadModel3d(e.target.files?.[0] || null)} />
                      <Diamond size={16} /> {model3dUploading ? 'Uploading…' : model3d ? 'Replace 3D Model' : 'Upload 3D Model'}
                    </button>
                    {model3d && (
                      <div className="a-row a-row--between" style={{ gap: 8, marginTop: 8 }}>
                        <a href={model3d} target="_blank" rel="noreferrer" className="a-hint" style={{ color: 'var(--c-success)', margin: 0 }}>✓ 3D model attached</a>
                        <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => setModel3d(null)}>Remove</button>
                      </div>
                    )}
                    <p className="a-hint">Optional. Works with any product — shown as a rotatable 3D view on the product page.</p>
                  </div>
                </div>

                {/* Uploaded List */}
                {(mainImage || images.length > 0) && (
                  <div className="np-media-grid">
                    {mainImage && (
                      <div className="np-media-item np-media-item--primary">
                        <img src={mainImage} alt="" />
                        <button type="button" className="np-media-remove" onClick={() => setMainImage(null)}><X size={12} /></button>
                        <div className="np-media-badge">PRIMARY</div>
                      </div>
                    )}
                    {images.map((url, i) => (
                      <div key={i} className="np-media-item">
                        {isVideo(url) ? (
                          <div className="np-video-thumb">
                            <Video size={24} color="var(--c-text-muted)" />
                          </div>
                        ) : <img src={url} alt="" />}
                        <button type="button" className="np-media-remove" onClick={() => removeImage(i)}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div className="a-card">
              <div className="a-card-head"><h2 className="a-card-title">Technical <em>Specs</em></h2></div>
              <div className="a-card-body">
                {/* Style + Shape are available for every product, not just
                    rings / diamonds — so any piece can be tagged and filtered. */}
                <div className="a-field">
                  <label className="a-label">Style</label>
                  <div className="a-row" style={{ gap: 12 }}>
                    <select className="a-select" style={{ flex: 1 }} name="style" value={formData.style} onChange={handleChange}>
                      <option value="">Select a style</option>
                      {visibleRingStyles.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                    </select>
                    <input className="a-input" style={{ flex: 1 }} value={newStyleName} onChange={e => setNewStyleName(e.target.value)} placeholder="Custom style name..." />
                    <button type="button" className="a-btn a-btn--subtle" onClick={addNewStyle}>Add</button>
                  </div>
                </div>

                <div className="a-form-grid">
                  <div className="a-field">
                    <label className="a-label">Shape</label>
                    <select className="a-select" name="diamond_shape" value={formData.diamond_shape} onChange={handleChange}>
                      <option value="">Select shape</option>
                      {visibleDiamondShapes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Carat Weight</label>
                    <input className="a-input" name="carat" value={formData.carat} onChange={handleChange} placeholder="e.g., 1.50" />
                  </div>
                </div>

                <div className="a-form-grid a-form-grid--3">
                  <div className="a-field">
                    <label className="a-label">Cut / Quality</label>
                    <select className="a-select" name="diamond_cut" value={formData.diamond_cut} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_CUTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Color Grade</label>
                    <select className="a-select" name="color" value={formData.color} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="a-field">
                    <label className="a-label">Clarity</label>
                    <select className="a-select" name="clarity" value={formData.clarity} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_CLARITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Combined: Material & Diamond Weight — material + weight together, one row per variant */}
                <div className="a-field">
                  <div className="a-section-title" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      Per-row rates need DB migration <strong>116_product_variant_prices.sql</strong> (run once in Supabase SQL Editor, folder <span>.\migrations\</span>).
                      Until then rows show shared metal+weight sums and per-row edits and row selections won&apos;t persist.
                    </div>
                  )}
                  <div className="np-combo-toolbar">
                    <input
                      className="a-input"
                      style={{ flex: '2 1 200px', height: 36 }}
                      placeholder="Search material or diamond weight…"
                      value={comboSearch}
                      onChange={e => setComboSearch(e.target.value)}
                    />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: 'var(--font-dmsans)', fontSize: 12, fontWeight: 500, color: 'var(--c-text)' }}>
                      <input type="checkbox" className="a-check" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} />
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
                    <div className="np-mc-grid np-mc-head">
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
                              <div key={vkey} className="np-mc-grid np-mc-row" style={hidden ? { opacity: 0.45 } : undefined}>
                                <div className="np-mc-check">
                                  <input
                                    type="checkbox"
                                    checked={!!comboSel[vkey]}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
                                    title={hidden ? 'Hidden row — tick to restore' : 'Tick to offer this combination'}
                                    onChange={(e) => toggleCombo(m, c, vkey, e.target.checked)}
                                  />
                                </div>
                                <div className="np-mc-cell">{m.name}</div>
                                <div className="np-mc-cell">{c.name}</div>
                                <input
                                  type="number" step="0.01"
                                  className="a-input"
                                  style={{ height: 36, width: '100%' }}
                                  title="This exact variant's upcharge over base price — independent per row"
                                  placeholder={sharedDisp}
                                  value={variantOverrides[vkey] ?? sharedDisp}
                                  onChange={(e) => setVariantOverrides(prev => ({ ...prev, [vkey]: e.target.value }))}
                                />
                                <div className="np-mc-del">
                                  <button
                                    type="button" className="a-icon-btn a-icon-btn--danger a-icon-btn--sm"
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

                  {/* ── Single-sided variants ─────────────────────────────
                      With only materials (or only diamond weights) there are no
                      metal×carat combinations, so the grid above is empty. These
                      flat rows expose each option's upcharge (base + upcharge =
                      shopper price) — without them such products save at 00. */}
                  {(() => {
                    const metList = metalOptions.filter(o => o.is_enabled !== false);
                    const carList = caratOptions.filter(o => o.is_enabled !== false);
                    if (metList.length > 0 && carList.length === 0) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                          <div className="np-mc-grid np-mc-head" style={{ gridTemplateColumns: '0.5fr 2.5fr 1.6fr' }}>
                            <div style={{ textAlign: 'center' }}>SEL</div>
                            <div>MATERIAL</div>
                            <div>UPCHARGE ({priceCurrency})</div>
                          </div>
                          {metList.map((m: any) => {
                            const on = selectedMetals.includes(m.key);
                            const ph = ((priceCurrency === 'USD' ? m.price_modifier : (m.price_modifier || 0) * fxRate) || 0).toFixed(2);
                            return (
                              <div key={m.key} className="np-mc-grid np-mc-row" style={{ gridTemplateColumns: '0.5fr 2.5fr 1.6fr' }}>
                                <div className="np-mc-check">
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
                                    title="Offer this material for this product"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedMetals([...selectedMetals, m.key])
                                        if (!productMetalPrices[m.key]) {
                                          const g = priceCurrency === 'USD' ? m.price_modifier : (m.price_modifier || 0) * fxRate;
                                          setProductMetalPrices(pm => ({ ...pm, [m.key]: String(g || 0) }))
                                        }
                                      } else {
                                        setSelectedMetals(selectedMetals.filter(k => k !== m.key))
                                      }
                                    }}
                                  />
                                </div>
                                <div className="np-mc-cell">{m.name}</div>
                                <input
                                  type="number" step="0.01"
                                  className="a-input"
                                  style={{ height: 36, width: '100%' }}
                                  title="Upcharge over base price when a customer picks this material"
                                  placeholder={ph}
                                  value={productMetalPrices[m.key] ?? ''}
                                  onChange={(e) => setProductMetalPrices(prev => ({ ...prev, [m.key]: e.target.value }))}
                                />
                              </div>
                            );
                          })}
                          <div style={{ padding: '8px 4px', fontFamily: 'var(--font-dmsans)', fontSize: 11, color: 'var(--c-text-muted)' }}>
                            {selectedMetals.length} of {metList.length} materials offered. Shopper price = base + upcharge.
                          </div>
                        </div>
                      );
                    }
                    if (carList.length > 0 && metList.length === 0) {
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                          <div className="np-mc-grid np-mc-head" style={{ gridTemplateColumns: '0.5fr 2.5fr 1.6fr' }}>
                            <div style={{ textAlign: 'center' }}>SEL</div>
                            <div>DIAMOND WEIGHT</div>
                            <div>UPCHARGE ({priceCurrency})</div>
                          </div>
                          {carList.map((c: any) => {
                            const on = selectedCarats.includes(c.key);
                            const ph = ((priceCurrency === 'USD' ? c.price_modifier : (c.price_modifier || 0) * fxRate) || 0).toFixed(2);
                            return (
                              <div key={c.key} className="np-mc-grid np-mc-row" style={{ gridTemplateColumns: '0.5fr 2.5fr 1.6fr' }}>
                                <div className="np-mc-check">
                                  <input
                                    type="checkbox"
                                    checked={on}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--c-accent)' }}
                                    title="Offer this diamond weight for this product"
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCarats([...selectedCarats, c.key])
                                        if (!productCaratPrices[c.key]) {
                                          const g = priceCurrency === 'USD' ? c.price_modifier : (c.price_modifier || 0) * fxRate;
                                          setProductCaratPrices(pc => ({ ...pc, [c.key]: String(g || 0) }))
                                        }
                                      } else {
                                        setSelectedCarats(selectedCarats.filter(k => k !== c.key))
                                      }
                                    }}
                                  />
                                </div>
                                <div className="np-mc-cell">{c.name}</div>
                                <input
                                  type="number" step="0.01"
                                  className="a-input"
                                  style={{ height: 36, width: '100%' }}
                                  title="Upcharge over base price when a customer picks this diamond weight"
                                  placeholder={ph}
                                  value={productCaratPrices[c.key] ?? ''}
                                  onChange={(e) => setProductCaratPrices(prev => ({ ...prev, [c.key]: e.target.value }))}
                                />
                              </div>
                            );
                          })}
                          <div style={{ padding: '8px 4px', fontFamily: 'var(--font-dmsans)', fontSize: 11, color: 'var(--c-text-muted)' }}>
                            {selectedCarats.length} of {carList.length} weights offered. Shopper price = base + upcharge.
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Global option management — permanent deletion lives here. */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--c-border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>
                          Materials — global ({metalOptions.filter(o => o.is_enabled !== false).length})
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                            const all = metalOptions.filter(o => o.is_enabled !== false).map(o => o.key)
                            setBulkDelMetals(bulkDelMetals.length === all.length ? [] : all)
                          }}>
                            {bulkDelMetals.length === metalOptions.filter(o => o.is_enabled !== false).length && bulkDelMetals.length > 0 ? 'Clear selection' : 'Select all'}
                          </button>
                          {bulkDelMetals.length > 0 && (
                            <button type="button" className="a-btn a-btn--solid-danger a-btn--sm" onClick={() => bulkDeleteMetals(bulkDelMetals)}>
                              <Trash2 size={12} />&nbsp;Delete ({bulkDelMetals.length})
                            </button>
                          )}
                        </span>
                      </div>
                      <div className="np-glob-chips">
                        {metalOptions.filter(o => o.is_enabled !== false).map(m => (
                          <span key={m.key} className="np-glob-chip" style={bulkDelMetals.includes(m.key) ? { borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' } : undefined}>
                            <input type="checkbox" checked={bulkDelMetals.includes(m.key)} title="Select for bulk delete" onChange={() => setBulkDelMetals(prev => prev.includes(m.key) ? prev.filter(k => k !== m.key) : [...prev, m.key])} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--c-danger)' }} />
                            {m.name}
                            <button type="button" onClick={() => deleteGlobalMetalOption(m.key)} title={`Delete "${m.name}" globally (removes all its rows)`}>
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>
                          Diamond weights — global ({caratOptions.filter(o => o.is_enabled !== false).length})
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                            const all = caratOptions.filter(o => o.is_enabled !== false).map(o => o.key)
                            setBulkDelCarats(bulkDelCarats.length === all.length ? [] : all)
                          }}>
                            {bulkDelCarats.length === caratOptions.filter(o => o.is_enabled !== false).length && bulkDelCarats.length > 0 ? 'Clear selection' : 'Select all'}
                          </button>
                          {bulkDelCarats.length > 0 && (
                            <button type="button" className="a-btn a-btn--solid-danger a-btn--sm" onClick={() => bulkDeleteCarats(bulkDelCarats)}>
                              <Trash2 size={12} />&nbsp;Delete ({bulkDelCarats.length})
                            </button>
                          )}
                        </span>
                      </div>
                      <div className="np-glob-chips">
                        {caratOptions.filter(o => o.is_enabled !== false).map(c => (
                          <span key={c.key} className="np-glob-chip" style={bulkDelCarats.includes(c.key) ? { borderColor: 'var(--c-danger)', background: 'var(--c-danger-bg)' } : undefined}>
                            <input type="checkbox" checked={bulkDelCarats.includes(c.key)} title="Select for bulk delete" onChange={() => setBulkDelCarats(prev => prev.includes(c.key) ? prev.filter(k => k !== c.key) : [...prev, c.key])} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--c-danger)' }} />
                            {c.name}
                            <button type="button" onClick={() => deleteGlobalCaratOption(c.key)} title={`Delete "${c.name}" globally (removes all its rows)`}>
                              <Trash2 size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add new options */}
                  <div className="a-row" style={{ gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed var(--c-border)', paddingTop: 16, flexWrap: 'wrap' }}>
                    <input className="a-input" style={{ flex: '2 1 200px' }} value={newMetalName} onChange={e => setNewMetalName(e.target.value)} placeholder="New material/metal (e.g., 925 Silver+Lab Grown)" />
                    <input type="number" step="0.01" className="a-input" style={{ flex: '1 1 100px' }} value={newMetalPrice} onChange={e => setNewMetalPrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" onClick={addNewMetalOption}>
                      <Plus size={14} />&nbsp;Add Material
                    </button>
                  </div>
                  <div className="a-row" style={{ gap: 12, marginTop: 10, alignItems: 'center', flexWrap: 'wrap', paddingTop: 10, borderTop: '1px dashed rgba(0,0,0,0.06)' }}>
                    <input className="a-input" style={{ flex: '2 1 200px' }} value={newCaratName} onChange={e => setNewCaratName(e.target.value)} placeholder="New carat weight (e.g., 2.00 TCW)" />
                    <input type="number" step="0.01" className="a-input" style={{ flex: '1 1 100px' }} value={newCaratPrice} onChange={e => setNewCaratPrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" onClick={addNewCaratOption}>
                      <Plus size={14} />&nbsp;Add Carat
                    </button>
                  </div>
                </div>
                <hr className="a-divider" />

                <div className="a-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    Available Size Options
                    {sizeCatName && <span className="sz-cat-chip">for {sizeCatName}</span>}
                  </span>
                  <span className="sz-count">{visibleSizeOptions.length} of {totalSizeCount} shown</span>
                </div>
                <div className="sz-bar">
                  {/* Which sizes are listed: this category only (default), or
                      the whole global list — where the scope chips live. */}
                  <div className="sz-seg" role="group" aria-label="Which sizes to list">
                    <button
                      type="button"
                      className={`sz-seg-btn${showAllSizes ? '' : ' is-on'}`}
                      onClick={() => setShowAllSizes(false)}
                      disabled={!productCatId}
                      title={productCatId ? `Only sizes that apply to ${sizeCatName}` : 'Pick a product category above first'}
                    >
                      {sizeCatName || 'This category'}
                    </button>
                    <button
                      type="button"
                      className={`sz-seg-btn${showAllSizes ? ' is-on' : ''}`}
                      onClick={() => setShowAllSizes(true)}
                      title="Every size, whatever category it belongs to"
                    >
                      All categories
                    </button>
                  </div>
                  <span className="sz-hint">
                    {!productCatId ? 'Pick a product category to list only its sizes'
                      : showAllSizes ? 'Tick ✗ beside a size to delete several at once'
                        : `Only sizes for ${sizeCatName || 'this category'} are listed`}
                  </span>
                  <span className="sz-actions-bar">
                    <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => {
                      const all = visibleSizeOptions.map(o => o.key)
                      setBulkDelSizes(bulkDelSizes.length === all.length ? [] : all)
                    }}>
                      {bulkDelSizes.length === visibleSizeOptions.length && bulkDelSizes.length > 0 ? 'Clear selection' : 'Select all'}
                    </button>
                    {bulkDelSizes.length > 0 && (
                      <button type="button" className="a-btn a-btn--solid-danger a-btn--sm" onClick={() => bulkDeleteSizes(bulkDelSizes)}>
                        <Trash2 size={12} />&nbsp;Delete ({bulkDelSizes.length})
                      </button>
                    )}
                  </span>
                </div>
                <div className="a-field">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div className="sz-grid sz-head">
                      <div style={{ textAlign: 'center' }}>✓</div>
                      <div>Size</div>
                      <div>Upcharge ({priceCurrency})</div>
                      <div style={{ textAlign: 'right' }}>Remove</div>
                    </div>

                    {visibleSizeOptions.length === 0 && (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 12, fontFamily: 'var(--font-dmsans)' }}>
                        {sizeOptions.filter((opt) => opt.is_enabled !== false).length === 0
                          ? 'No size options yet. Add one below.'
                          : showAllSizes
                            ? 'No size options yet — add one below.'
                            : `No sizes for this category yet — add one below (it saves for this category automatically), or switch to “All categories” to see the full list.`}
                      </div>
                    )}

                    {visibleSizeOptions.map((opt) => {
                      const isSelected = selectedSizes.includes(opt.key);
                      const currentPriceMod = productSizePrices[opt.key] ?? '';
                      const expanded = expandedSizeKey === opt.key;
                      const editCats: string[] = expanded && (editedSizeCats as any)[opt.key] !== undefined ? (editedSizeCats as any)[opt.key] : (Array.isArray(opt.category_ids) ? opt.category_ids : []);
                      return (
                        <Fragment key={opt.key}>
                        <div className="sz-grid sz-row">
                          <div className="np-mc-check">
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
                          <div className="sz-name">
                            <b>{opt.name}</b>
                            {showAllSizes && <span className="sz-scope">{sizeAppliesLabel(opt)}</span>}
                          </div>
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
                          <div className="sz-cell-end">
                            <input
                              type="checkbox"
                              checked={bulkDelSizes.includes(opt.key)}
                              title="Select for bulk delete"
                              onChange={() => setBulkDelSizes(prev => prev.includes(opt.key) ? prev.filter(k => k !== opt.key) : [...prev, opt.key])}
                              style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--c-danger)' }}
                            />
                            <button
                              type="button"
                              className="a-icon-btn a-icon-btn--danger a-icon-btn--sm"
                              onClick={() => deleteGlobalSizeOption(opt.key)}
                              title="Delete option globally"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {showAllSizes && (
                          <div className="sz-scope-row">
                            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, color: 'var(--c-text-muted)' }}>
                              Applies to: <strong style={{ color: 'var(--c-text)', fontWeight: 600 }}>{sizeAppliesLabel(opt)}</strong>
                            </span>
                            <button
                              type="button"
                              className="a-btn a-btn--subtle a-btn--sm"
                              onClick={() => {
                                if (expanded) { setExpandedSizeKey(null); }
                                else {
                                  setEditedSizeCats(prev => ({ ...prev, [opt.key]: Array.isArray(opt.category_ids) ? [...opt.category_ids] : [] }));
                                  setExpandedSizeKey(opt.key);
                                }
                              }}
                            >
                              {expanded ? 'Close' : 'Edit categories'}
                            </button>
                          </div>
                        )}
                        {expanded && (
                          <div className="sz-editor">
                            <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: 8 }}>
                              Show “{opt.name}” for — empty means all categories
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {categories.map((c: any) => {
                                const on = editCats.includes(String(c.id));
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setEditedSizeCats(prev => {
                                      const cur = prev[opt.key] ?? [];
                                      return { ...prev, [opt.key]: on ? cur.filter(id => id !== String(c.id)) : [...cur, String(c.id)] };
                                    })}
                                    className={`a-btn a-btn--sm ${on ? 'a-btn--solid-danger' : 'a-btn--subtle'}`}
                                    style={on ? undefined : { borderStyle: 'dashed' }}
                                    title={c.name}
                                  >
                                    {on ? <Check size={12} /> : null}&nbsp;{c.name}
                                  </button>
                                );
                              })}
                              {categories.length === 0 && (
                                <span style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>No categories found.</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                              <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => saveSizeCats(opt, editCats)}>
                                <Check size={12} />&nbsp;Save
                              </button>
                              <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setExpandedSizeKey(null)}>
                                Cancel
                              </button>
                              <button type="button" className="a-btn a-btn--subtle a-btn--sm" onClick={() => setEditedSizeCats(prev => ({ ...prev, [opt.key]: [] }))}>
                                All categories
                              </button>
                            </div>
                          </div>
                        )}
                        </Fragment>
                      );
                    })}
                  </div>
                  <div className="a-row" style={{ gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed var(--c-border)', paddingTop: 16 }}>
                    <input className="a-input" style={{ flex: 2 }} value={newSizeName} onChange={e => setNewSizeName(e.target.value)} placeholder="New size option (e.g., 8.5 or 16 inch)..." />
                    <input type="number" step="0.01" className="a-input" style={{ flex: 1 }} value={newSizePrice} onChange={e => setNewSizePrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="a-btn a-btn--subtle" onClick={addNewSizeOption}>
                      <Plus size={14} />&nbsp;Add Size
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: 11, color: 'var(--c-text-muted)' }}>
                      New size applies to:
                    </span>
                    <button
                      type="button"
                      className={`a-btn a-btn--sm ${newSizeCats === null ? 'a-btn--solid-danger' : 'a-btn--subtle'}`}
                      onClick={() => setNewSizeCats(null)}
                    >
                      {newSizeCats === null ? <Check size={12} /> : null}&nbsp;{productCatId ? 'This category only' : 'This category (pick one above)'}
                    </button>
                    <button
                      type="button"
                      className={`a-btn a-btn--sm ${newSizeCats !== null ? 'a-btn--solid-danger' : 'a-btn--subtle'}`}
                      onClick={() => setNewSizeCats([])}
                    >
                      {newSizeCats !== null ? <Check size={12} /> : null}&nbsp;All categories
                    </button>
                  </div>
                </div>

                <hr className="a-divider" />



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
                        <div key={item.key} className="np-opt-grid">
                          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-dmsans)' }}>{item.name}</span>
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
                            <button type="button" className="a-icon-btn a-icon-btn--danger a-icon-btn--sm" onClick={() => removeCustomOptionItem(sec.id, item.key)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="a-row" style={{ gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--c-border)' }}>
                      <input
                        className="a-input"
                        style={{ flex: 2 }}
                        value={newItemNames[sec.id] || ''}
                        onChange={(e) => setNewItemNames(prev => ({ ...prev, [sec.id]: e.target.value }))}
                        placeholder="Option choice name (e.g., 2.0mm / VVS1)..."
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="a-input"
                        style={{ flex: 1 }}
                        value={newItemPrices[sec.id] || '0'}
                        onChange={(e) => setNewItemPrices(prev => ({ ...prev, [sec.id]: e.target.value }))}
                        placeholder={`Price (${priceCurrency})`}
                      />
                      <button type="button" className="a-btn a-btn--subtle" onClick={() => addCustomOptionItem(sec.id)}>
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
          </div>

          {/* ── SIDEBAR ── */}
          <div>
            <div style={{ position: 'sticky', top: 24 }} className="a-stack">
              <div className="a-card">
                <div className="a-card-head"><h2 className="a-card-title">Publish</h2></div>
                <div className="a-card-body">
                  <div className="a-row a-row--between" style={{ gap: 12 }}>
                    <div>
                      <label htmlFor="feat_new" className="a-label" style={{ marginBottom: 4 }}>Feature on Homepage</label>
                      <p className="a-hint" style={{ marginTop: 0 }}>Mark this piece as a spotlight creation.</p>
                    </div>
                    <label className="a-switch">
                      <input id="feat_new" type="checkbox" checked={formData.is_featured} onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))} />
                      <span className="a-switch-slider" />
                    </label>
                  </div>
                </div>
                <div className="a-card-foot" style={{ flexDirection: 'column', gap: 12 }}>
                  <button type="submit" className="a-btn a-btn--primary a-btn--lg a-btn--block" disabled={loading}>
                    {loading ? 'Curating...' : 'Store Creation'}
                  </button>
                  <Link href="/admin/products" className="a-btn a-btn--ghost a-btn--block">Cancel</Link>
                </div>
              </div>

              <div className="a-card" style={{ background: 'var(--c-surface)', boxShadow: 'none' }}>
                <div className="a-card-body" style={{ textAlign: 'center', color: 'var(--c-text-muted)' }}>
                  <Diamond size={24} strokeWidth={1} style={{ marginBottom: 12, color: 'var(--c-accent)' }} />
                  <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-dmsans)' }}>Gems Global Jewels Admin</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
