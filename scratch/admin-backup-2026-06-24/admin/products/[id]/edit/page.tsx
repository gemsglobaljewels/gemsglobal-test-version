"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, X, Plus, Upload, Video, Diamond, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/RichTextEditor";

const CSS = `
.np-root {
  --c-gold: #8F7A70;
  --c-ivory: #FAF9F6;
  --c-dark: #1A1614;
  --c-soft: #F2EDE8;
  --c-border: rgba(143, 122, 112, 0.12);
  --radius: 4px;
  --font-serif: var(--font-main);
  --font-sans: var(--font-montserrat);
  
  min-height: 100vh;
  background: var(--c-ivory);
  font-family: var(--font-sans);
  padding: 80px 40px 100px;
  color: var(--c-dark);
}
@media (max-width: 768px) { .np-root { padding: 40px 20px 80px; } }

.np-back {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
  color: var(--c-gold); text-decoration: none; margin-bottom: 40px;
  transition: 0.3s;
}
.np-back:hover { color: var(--c-dark); transform: translateX(-4px); }

.np-hdr { margin-bottom: 60px; border-bottom: 1px solid var(--c-border); padding-bottom: 40px; }
.np-title { font-family: var(--font-serif); font-size: 48px; font-weight: 300; letter-spacing: -0.02em; }
.np-title em { font-style: italic; color: var(--c-gold); }

/* Layout */
.np-form-grid { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
@media (max-width: 1100px) { .np-form-grid { grid-template-columns: 1fr; } }

/* Cards */
.np-card {
  background: #fff;
  border: 1px solid var(--c-border);
  margin-bottom: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
}
.np-card-hdr {
  padding: 24px 32px;
  border-bottom: 1px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.np-card-title { font-family: var(--font-serif); font-size: 22px; font-weight: 400; color: var(--c-dark); }
.np-card-body { padding: 32px; }

/* Fields */
.np-field { margin-bottom: 24px; }
.np-label { 
  display: block; 
  font-size: 11px; 
  font-weight: 700; 
  text-transform: uppercase; 
  letter-spacing: 0.1em; 
  color: var(--c-gold);
  margin-bottom: 10px;
}
.np-input, .np-textarea, .np-select {
  width: 100%;
  height: 52px;
  background: #fff;
  border: 1px solid var(--c-border);
  padding: 0 16px;
  font-size: 15px;
  color: var(--c-dark);
  outline: none;
  transition: 0.3s;
  border-radius: 4px;
}
.np-textarea { height: auto; min-height: 120px; padding: 16px; }
.np-input:focus, .np-textarea:focus, .np-select:focus {
  border-color: var(--c-gold);
  box-shadow: 0 0 0 4px rgba(143, 122, 112, 0.05);
}

/* Buttons */
.np-btn {
  height: 52px;
  padding: 0 24px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid transparent;
}
.np-btn-primary { background: var(--c-dark); color: #fff; }
.np-btn-primary:hover { background: var(--c-gold); transform: translateY(-2px); }
.np-btn-secondary { background: #fff; border-color: var(--c-border); color: var(--c-dark); }
.np-btn-secondary:hover { border-color: var(--c-gold); color: var(--c-gold); }

/* Media Gallery */
.np-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 16px; margin-top: 24px; }
.np-media-item {
  aspect-ratio: 1;
  border: 1px solid var(--c-border);
  position: relative;
  background: var(--c-soft);
  overflow: hidden;
}
.np-media-item img, .np-media-item video { width: 100%; height: 100%; object-fit: cover; }
.np-media-remove {
  position: absolute; top: 4px; right: 4px;
  width: 24px; height: 24px; background: rgba(0,0,0,0.5);
  color: #fff; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; cursor: pointer;
}

/* Upload Dropzone */
.np-dropzone {
  border: 2px dashed var(--c-border);
  padding: 40px;
  text-align: center;
  background: var(--c-soft);
  cursor: pointer;
  transition: 0.3s;
}
.np-dropzone:hover { border-color: var(--c-gold); background: #fff; }
.np-dropzone svg { color: var(--c-gold); margin-bottom: 12px; }

/* Feedback */
.np-feedback {
  padding: 12px 20px;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.np-feedback-success { background: #ECFDF5; color: #059669; border: 1px solid #10B981; }
.np-feedback-error { background: #FEF2F2; color: #DC2626; border: 1px solid #EF4444; }

/* Sticky Actions */
.np-sticky-actions {
  position: sticky;
  top: 120px;
}
.ep-loading {
  min-height: 60vh; display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 14px;
}
@keyframes epSpin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
.ep-loading-gem { color: var(--c-gold); animation: epSpin 2s linear infinite; }
`

const DIAMOND_CUTS = ['Good', 'Very Good', 'Excellent', 'Ideal', '8X']
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']

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

  // Temporary console logs for verification
  console.log('Selected root category id:', selectedRootCategoryId)
  console.log('Root categories result:', parentCategories)
  console.log('Child categories result:', childCategories)

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
  const [productId, setProductId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [mainImgUrl, setMainImgUrl] = useState('')
  const [moreImgUrl, setMoreImgUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [ringStyles, setRingStyles] = useState<{ key: string; name: string; is_enabled?: boolean }[]>([])
  const [newStyleName, setNewStyleName] = useState('')
  const [diamondShapes, setDiamondShapes] = useState<{ key: string; name: string; is_enabled?: boolean; model_3d?: string }[]>([])
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'INR'>('USD')
  const [fxRate, setFxRate] = useState(83)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('admin_currency_pref') as 'USD' | 'INR'
      if (c) setPriceCurrency(c)
      const fx = Number(localStorage.getItem('admin_fx_rate') || '83')
      if (Number.isFinite(fx) && fx > 0) setFxRate(fx)
    }
  }, [])

  useEffect(() => {
    params.then(({ id }) => setProductId(id))
  }, [params])

  useEffect(() => {
    if (!productId) return
    fetchProduct(); loadCategories(); loadStyles(); loadDiamondShapes(); loadMetalOptions(); loadSizeOptions()
  }, [productId])

  const fetchProduct = async () => {
    try {
      setFetching(true)
      const res = await fetch(`/api/products/${productId}`)
      const prod = res.ok ? await res.json() : (() => {
        const fb = JSON.parse(typeof window !== 'undefined' ? (localStorage.getItem('mock_products') || '[]') : '[]')
        return fb.find((p: any) => p.id === productId) || null
      })()
      if (prod) {
        setProductData(prod)
        const prefCurr = (typeof window !== 'undefined' ? localStorage.getItem('admin_currency_pref') : 'USD') as 'USD' | 'INR' || 'USD'
        const currentFx = Number(typeof window !== 'undefined' ? localStorage.getItem('admin_fx_rate') : '83') || 83
        const initialPrice = prefCurr === 'USD' ? prod.price : Math.round(prod.price * currentFx)
        setFormData({
          name: prod.name || '', category: prod.category || '', price: String(initialPrice ?? ''),
          description: prod.description || '', carat: prod.carat || '', color: prod.color || '',
          clarity: prod.clarity || '', metal: prod.metal || '', style: prod.style || '',
          diamond_shape: prod.diamond_shape || '', diamond_cut: prod.diamond_cut || '',
          is_featured: !!prod.is_featured, sku: prod.sku || '', slug: prod.slug || ''
        })
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
              const priceVal = prefCurr === 'USD' ? mo.price_modifier : Math.round(mo.price_modifier * currentFx)
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
              const priceVal = prefCurr === 'USD' ? so.price_modifier : Math.round(so.price_modifier * currentFx)
              prices[key] = String(priceVal || 0)
            }
          })
          setProductSizePrices(prices)
        }
      } else {
        setError('Failed to load product')
      }
    } catch { setError('Failed to load product') }
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

  async function uploadDiamondShape3D(file: File | null) {
    if (!file) return
    if (!formData.diamond_shape) { setError('Select diamond shape first'); return }
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload-3d', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) { setError(j?.error || '3D upload failed'); return }
      const upd = await fetch('/api/diamond-shapes', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ key: formData.diamond_shape, model_3d: j.url }] })
      })
      if (!upd.ok) { setError((await upd.json().catch(() => ({})))?.error || 'Save failed'); return }
      setDiamondShapes(p => p.map(s => s.key === formData.diamond_shape ? { ...s, model_3d: j.url } : s))
    } catch { setError('3D upload failed') }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    if (!formData.name || !formData.price) { setError('Please fill in required fields'); setLoading(false); return }
    try {
      const raw = parseFloat(formData.price)
      const priceUSD = priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category: formData.category,
          category_id: selectedSubCategoryId || selectedRootCategoryId || null,
          price: priceUSD,
          image: mainImage || images[0] || null,
          images: mainImage ? [mainImage, ...images.filter(u => u !== mainImage)] : images,
          metal_options: metalOptions
            .filter(o => o.is_enabled !== false && selectedMetals.includes(o.key))
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
            })
        }),
      })
      if (res.ok) router.push('/admin/products')
      else setError((await res.json().catch(() => ({})))?.error || 'Failed to update product')
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
    <div className="ep-root">
      <style>{CSS}</style>
      <div className="ep-loading">
        <Diamond size={28} strokeWidth={1.2} className="ep-loading-gem" />
        <p className="ep-loading-txt">Loading product…</p>
      </div>
    </div>
  )

  return (
    <div className="ep-root">
      <style>{CSS}</style>

      <Link href="/admin/products" className="ep-back">
        <ArrowLeft size={12} strokeWidth={1.5} /> Back to Products
      </Link>

      <div className="ep-hdr">
        <div className="ep-hdr-eyebrow">
          <div className="ep-hdr-line" />
          <span className="ep-hdr-tag">Catalogue</span>
        </div>
        <h1 className="ep-hdr-title">Edit <em>Product</em></h1>
      </div>

      {error && (
        <div className="ep-error">
          <AlertCircle size={14} strokeWidth={1.5} className="ep-error-ico" />
          <p className="ep-error-txt">{error}</p>
          <button className="ep-error-close" onClick={() => setError('')}><X size={12} strokeWidth={1.5} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="ep-form">

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Basic Info */}
            <div className="ep-card">
              <div className="ep-card-hdr">
                <h2 className="ep-card-title">Basic <em>Info</em></h2>
              </div>
              <div className="ep-card-body">
                <div className="ep-grid-2">
                  <div className="ep-field">
                    <label className="ep-label">Product ID</label>
                    <input className="ep-input" value={productId} disabled />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">SKU</label>
                    <input className="ep-input" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g., RING-1234" />
                  </div>
                </div>
                <div className="ep-field">
                  <label className="ep-label">Product Name <span className="ep-label-req">*</span></label>
                  <input className="ep-input" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Emerald Cut Diamond Ring" />
                </div>
                <div className="ep-field">
                  <label className="ep-label">URL Slug</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input className="ep-input" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g., emerald-cut-ring" style={{ flex: 1 }} />
                    <button type="button" className="ep-add-btn" style={{ height: 32, fontSize: 8 }} onClick={() => {
                      const toSlug = (s: string) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      setFormData(p => ({ ...p, slug: toSlug(p.name) }))
                    }}>Auto-Gen</button>
                  </div>
                  <p style={{ fontSize: 8, color: 'rgba(212,175,55,.4)', marginTop: 4, letterSpacing: '.05em' }}>This is the product's unique web address.</p>
                </div>
                <div className="ep-grid-2">
                  <div className="ep-field">
                    <label className="ep-label">Category <span className="ep-label-req">*</span></label>
                    <select
                      className="ep-select"
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
                        <label className="ep-label">Sub Category</label>
                        <select
                          className="ep-select"
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
                  <div className="ep-field">
                    <label className="ep-label">Price ({priceCurrency}) <span className="ep-label-req">*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="ep-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" style={{ flex: 1 }} />
                      <select className="ep-select" style={{ width: 80 }} value={priceCurrency} onChange={e => {
                        const v = e.target.value as 'USD' | 'INR'
                        setPriceCurrency(v)
                        localStorage.setItem('admin_currency_pref', v)
                      }}>
                        <option value="USD">USD</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                    <p style={{ fontSize: 9, color: 'rgba(212,175,55,.5)', marginTop: 6, letterSpacing: '.05em' }}>
                      Saved as USD: <span style={{ color: '#D4AF37' }}>${(() => {
                        const raw = parseFloat(formData.price)
                        if (!isFinite(raw)) return '0.00'
                        return priceCurrency === 'USD' ? raw.toFixed(2) : (Math.round((raw / fxRate) * 100) / 100).toFixed(2)
                      })()}</span>
                    </p>
                  </div>
                </div>

                <div className="ep-field">
                  <label className="ep-label">Description</label>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                    placeholder="Product description…"
                  />
                </div>

                <div className="ep-sep" />

                <div className="ep-check-row">
                  <input id="feat" type="checkbox" className="ep-check" checked={formData.is_featured}
                    onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))} />
                  <label htmlFor="feat" className="ep-check-lbl">Visible at Home</label>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="ep-card">
              <div className="ep-card-hdr">
                <h2 className="ep-card-title">Specifications</h2>
              </div>
              <div className="ep-card-body">

                {/* Ring style */}
                {formData.category.toLowerCase() === 'rings' && (
                  <div className="ep-field">
                    <label className="ep-label">Ring Style</label>
                    <select className="ep-select" name="style" value={formData.style} onChange={handleChange}>
                      <option value="">Select style</option>
                      {ringStyles.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                    </select>
                    <div className="ep-add-row">
                      <input className="ep-input" style={{ flex: 1 }} value={newStyleName} onChange={e => setNewStyleName(e.target.value)}
                        placeholder="Add new style…" />
                      <button type="button" className="ep-add-btn" onClick={addNewStyle}>
                        <Plus size={11} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} />Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Diamond fields */}
                {isDia(formData.category) && (
                  <>
                    <div className="ep-field">
                      <label className="ep-label">Diamond Shape</label>
                      <select className="ep-select" name="diamond_shape" value={formData.diamond_shape} onChange={handleChange}>
                        <option value="">Select shape</option>
                        {diamondShapes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="ep-field">
                      <label className="ep-label">3D Model (GLB/GLTF/USDZ)</label>
                      <input type="file" accept=".glb,.gltf,.usdz,model/*" style={{ display: 'none' }} id="3dfile"
                        onChange={e => uploadDiamondShape3D(e.target.files?.[0] || null)} />
                      <label htmlFor="3dfile" className="ep-file-btn" style={{ cursor: 'pointer' }}>
                        <Upload size={12} strokeWidth={1.5} /> Upload 3D Model
                      </label>
                      {formData.diamond_shape && (() => {
                        const cur = diamondShapes.find(s => s.key === formData.diamond_shape)
                        return cur?.model_3d
                          ? <a href={cur.model_3d} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'rgba(212,175,55,.6)', letterSpacing: '.1em', marginTop: 4, display: 'block' }}>View current 3D model ↗</a>
                          : null
                      })()}
                    </div>
                    <div className="ep-field">
                      <label className="ep-label">Cut Grade</label>
                      <div className="ep-chips">
                        {DIAMOND_CUTS.map(c => (
                          <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, diamond_cut: p.diamond_cut === c ? '' : c }))}
                            className={`ep-chip${formData.diamond_cut === c ? ' on' : ''}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                    <div className="ep-grid-2">
                      <div className="ep-field">
                        <label className="ep-label">Color Grade</label>
                        <div className="ep-chips">
                          {DIAMOND_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setFormData(p => ({ ...p, color: p.color === c ? '' : c }))}
                              className={`ep-chip${formData.color === c ? ' on' : ''}`}>{c}</button>
                          ))}
                        </div>
                      </div>
                      <div className="ep-field">
                        <label className="ep-label">Clarity Grade</label>
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

                <div className="ep-field">
                  <label className="ep-label">Carat {isDia(formData.category) ? <span className="ep-label-req">*</span> : '(if applicable)'}</label>
                  <input className="ep-input" name="carat" value={formData.carat} onChange={handleChange} placeholder="e.g., 2.5" />
                </div>

                {!isDia(formData.category) && (
                  <div className="ep-grid-2">
                    <div className="ep-field">
                      <label className="ep-label">Color</label>
                      <input className="ep-input" name="color" value={formData.color} onChange={handleChange} placeholder="e.g., D" />
                    </div>
                    <div className="ep-field">
                      <label className="ep-label">Clarity</label>
                      <input className="ep-input" name="clarity" value={formData.clarity} onChange={handleChange} placeholder="e.g., IF" />
                    </div>
                  </div>
                )}

                <div className="ep-field">
                  <label className="ep-label">Available Metal Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, borderBottom: '1px solid rgba(212,175,55,.1)', paddingBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: 'rgba(212,175,55,.6)' }}>
                      <div>METAL OPTION</div>
                      <div>UPCHARGE / PRICE MODIFIER ({priceCurrency})</div>
                      <div style={{ textAlign: 'center' }}>VISIBLE</div>
                      <div></div>
                    </div>
                    {metalOptions.filter((opt) => opt.is_enabled !== false).map((opt) => {
                      const isSelected = selectedMetals.includes(opt.key);
                      const currentPriceMod = productMetalPrices[opt.key] ?? '';
                      return (
                        <div key={opt.key} style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, alignItems: 'center' }}>
                          <label htmlFor={`metal-${opt.key}`} style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#ebd1a7' }}>
                            {opt.name}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="ep-input"
                            style={{ height: 36, padding: '0 8px', fontSize: 13 }}
                            placeholder={((priceCurrency === 'USD' ? opt.price_modifier : (opt.price_modifier || 0) * fxRate) || 0).toFixed(2)}
                            value={currentPriceMod}
                            disabled={!isSelected}
                            onChange={(e) => {
                              setProductMetalPrices(prev => ({ ...prev, [opt.key]: e.target.value }))
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              id={`metal-${opt.key}`}
                              checked={isSelected}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMetals([...selectedMetals, opt.key])
                                  if (!productMetalPrices[opt.key]) {
                                    const globalPriceVal = (priceCurrency === 'USD' ? opt.price_modifier : (opt.price_modifier || 0) * fxRate) || 0;
                                    setProductMetalPrices(prev => ({ ...prev, [opt.key]: String(globalPriceVal) }))
                                  }
                                } else {
                                  setSelectedMetals(selectedMetals.filter(k => k !== opt.key))
                                }
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => deleteGlobalMetalOption(opt.key)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                              title="Delete option globally"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed rgba(212,175,55,.1)', paddingTop: 16 }}>
                    <input className="ep-input" style={{ flex: 2, height: 40, fontSize: 13 }} value={newMetalName} onChange={e => setNewMetalName(e.target.value)} placeholder="New metal option (e.g., 14K Gold)..." />
                    <input type="number" step="0.01" className="ep-input" style={{ flex: 1, height: 40, fontSize: 13 }} value={newMetalPrice} onChange={e => setNewMetalPrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="ep-add-btn" style={{ height: 40, padding: '0 16px', fontSize: 11 }} onClick={addNewMetalOption}>Add Metal</button>
                  </div>
                </div>

                <div className="ep-sep" style={{ margin: '24px 0', borderTop: '1px dashed rgba(212,175,55,.1)' }} />

                <div className="ep-field">
                  <label className="ep-label">Available Size Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, borderBottom: '1px solid rgba(212,175,55,.1)', paddingBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: 'rgba(212,175,55,.6)' }}>
                      <div>SIZE OPTION</div>
                      <div>UPCHARGE / PRICE MODIFIER ({priceCurrency})</div>
                      <div style={{ textAlign: 'center' }}>VISIBLE</div>
                      <div></div>
                    </div>
                    {sizeOptions.filter((opt) => opt.is_enabled !== false).map((opt) => {
                      const isSelected = selectedSizes.includes(opt.key);
                      const currentPriceMod = productSizePrices[opt.key] ?? '';
                      return (
                        <div key={opt.key} style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, alignItems: 'center' }}>
                          <label htmlFor={`size-${opt.key}`} style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#ebd1a7' }}>
                            Size {opt.name}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="ep-input"
                            style={{ height: 36, padding: '0 8px', fontSize: 13 }}
                            placeholder={((priceCurrency === 'USD' ? opt.price_modifier : (opt.price_modifier || 0) * fxRate) || 0).toFixed(2)}
                            value={currentPriceMod}
                            disabled={!isSelected}
                            onChange={(e) => {
                              setProductSizePrices(prev => ({ ...prev, [opt.key]: e.target.value }))
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              id={`size-${opt.key}`}
                              checked={isSelected}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
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
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => deleteGlobalSizeOption(opt.key)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                              title="Delete option globally"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed rgba(212,175,55,.1)', paddingTop: 16 }}>
                    <input className="ep-input" style={{ flex: 2, height: 40, fontSize: 13 }} value={newSizeName} onChange={e => setNewSizeName(e.target.value)} placeholder="New size option (e.g., 8.5)..." />
                    <input type="number" step="0.01" className="ep-input" style={{ flex: 1, height: 40, fontSize: 13 }} value={newSizePrice} onChange={e => setNewSizePrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="ep-add-btn" style={{ height: 40, padding: '0 16px', fontSize: 11 }} onClick={addNewSizeOption}>Add Size</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="ep-card">
              <div className="ep-card-hdr">
                <h2 className="ep-card-title">Media <em>&amp; Images</em></h2>
              </div>
              <div className="ep-card-body">
                <div className="ep-grid-2">
                  {/* Main image */}
                  <div>
                    <label className="ep-label" style={{ marginBottom: 8 }}>Main Image</label>
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
                    <div className="ep-url-row" style={{ marginTop: 8 }}>
                      <input className="ep-url-input" placeholder="Or paste image URL…" value={mainImgUrl}
                        onChange={e => setMainImgUrl(e.target.value)} />
                      <button type="button" className="ep-url-btn" onClick={async () => {
                        const url = mainImgUrl.trim(); if (!url) return;
                        const res = await fetch('/api/storage/upload-product-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
                        const d = await res.json(); if (!res.ok) { setError(d?.error || 'Failed'); return; }
                        setMainImage(d.url); setMainImgUrl('');
                        await fetch(`/api/products/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: d.url, images: [d.url, ...images.filter(u => u !== d.url)] }) });
                      }}>Import</button>
                    </div>
                  </div>

                  {/* More images */}
                  <div>
                    <label className="ep-label" style={{ marginBottom: 8 }}>Gallery</label>
                    <div className="ep-thumb-grid">
                      <button type="button" className="ep-thumb-add" onClick={() => moreFileRef.current?.click()}>
                        <Plus size={16} strokeWidth={1.5} style={{ color: 'rgba(212,175,55,.3)' }} />
                        <span>Add</span>
                      </button>
                      {images.map((url, idx) => (
                        <div key={idx} className="ep-thumb">
                          {isVideo(url)
                            ? <div style={{ width: '100%', height: '100%', background: 'rgba(212,175,55,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Video size={16} style={{ color: 'rgba(212,175,55,.4)' }} />
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
                    <div className="ep-url-row">
                      <input className="ep-url-input" placeholder="Image URL…" value={moreImgUrl}
                        onChange={e => setMoreImgUrl(e.target.value)} />
                      <button type="button" className="ep-url-btn" onClick={handleAddMoreUrl}>Add</button>
                    </div>
                  </div>
                </div>

                {/* Video */}
                <div className="ep-sep" />
                <label className="ep-label">Video</label>
                <button type="button" className="ep-file-btn" onClick={() => videoFileRef.current?.click()}>
                  <Video size={12} strokeWidth={1.5} /> Upload Video File
                </button>
                <input ref={videoFileRef} type="file" accept="video/*" style={{ display: 'none' }}
                  onChange={e => handleVideoFile(e.target.files?.[0] || null)} disabled={videoUploading} />
                {videoUploading && (
                  <div className="ep-uploading">
                    <div className="ep-uploading-dot" /> Uploading video…
                  </div>
                )}
                <div className="ep-url-row">
                  <input className="ep-url-input" placeholder="YouTube / Vimeo / mp4 URL…" value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)} />
                  <button type="button" className="ep-url-btn" onClick={handleAddVideoUrl}>Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column (sticky actions) ── */}
          <div>
            <div className="ep-actions-card">
              <div style={{ padding: '22px 22px 0' }}>
                <p style={{ fontSize: 8, fontWeight: 400, letterSpacing: '.38em', textTransform: 'uppercase', color: 'rgba(212,175,55,.5)', marginBottom: 4 }}>
                  Save Changes
                </p>
                <p style={{ fontSize: 11, fontWeight: 300, letterSpacing: '.05em', color: 'rgba(235,229,216,.35)', marginBottom: 18, lineHeight: 1.6 }}>
                  All changes will be applied immediately to your live catalogue.
                </p>
              </div>
              <button type="submit" className="ep-submit" disabled={loading}>
                {loading
                  ? <><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0a0806', animation: 'epDotPulse 1s infinite', marginRight: 4 }} />Saving…</>
                  : <><Check size={13} strokeWidth={2} /> Save Changes</>
                }
              </button>
              <Link href="/admin/products" className="ep-cancel">Cancel</Link>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}