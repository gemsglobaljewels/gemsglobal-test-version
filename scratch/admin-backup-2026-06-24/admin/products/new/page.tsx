"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, X, Plus, Upload, Video, Diamond, Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
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
`

const DIAMOND_CUTS = ['Good', 'Very Good', 'Excellent', 'Ideal', '8X']
const DIAMOND_COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const DIAMOND_CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1']

function isVideo(u: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(u) || /youtube\.com|youtu\.be|vimeo\.com/i.test(u)
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

  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'INR'>('USD')
  const [fxRate, setFxRate] = useState(83)

  const [formData, setFormData] = useState({
    name: '', category: '', price: '', description: '',
    carat: '', color: '', clarity: '', metal: '', style: '',
    diamond_shape: '', diamond_cut: '', is_featured: false,
    stock_quantity: 10,
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
  const [images, setImages] = useState<string[]>([])
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [mainImgUrl, setMainImgUrl] = useState('')
  const [moreImgUrl, setMoreImgUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [ringStyles, setRingStyles] = useState<{ key: string; name: string; is_enabled?: boolean }[]>([])
  const [newStyleName, setNewStyleName] = useState('')
  const [diamondShapes, setDiamondShapes] = useState<{ key: string; name: string; is_enabled?: boolean; model_3d?: string }[]>([])
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error' | 'none', msg: string }>({ type: 'none', msg: '' })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const c = localStorage.getItem('admin_currency_pref') as 'USD' | 'INR'
      if (c) setPriceCurrency(c)
      const fx = Number(localStorage.getItem('admin_fx_rate') || '83')
      if (Number.isFinite(fx) && fx > 0) setFxRate(fx)
    }
    loadCategories(); loadStyles(); loadDiamondShapes(); loadMetalOptions(); loadSizeOptions()
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
    try {
      const r = await fetch('/api/styles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ key, name, is_enabled: true }] }) })
      if (r.ok) {
        const j = await r.json()
        setRingStyles((Array.isArray(j) ? j : []).filter((x: any) => x.is_enabled !== false))
        setFormData(p => ({ ...p, style: key })); setNewStyleName('');
        showStatus('success', 'New style added successfully');
        return
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

  async function uploadDiamondShape3D(file: File | null) {
    if (!file) return
    if (!formData.diamond_shape) {
      showStatus('error', 'Please select a diamond shape first');
      return
    }
    try {
      setLoading(true);
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/diamond-shapes/upload-3d', { method: 'POST', body: fd })
      const j = await r.json()
      if (!r.ok || !j?.url) {
        showStatus('error', j?.error || '3D upload failed');
        setLoading(false);
        return
      }

      const upd = await fetch('/api/diamond-shapes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ key: formData.diamond_shape, model_3d: j.url }] })
      })

      if (!upd.ok) {
        showStatus('error', 'Model uploaded but failed to link to shape');
        setLoading(false);
        return
      }

      setDiamondShapes(p => p.map(s => s.key === formData.diamond_shape ? { ...s, model_3d: j.url } : s))
      showStatus('success', `3D Model for ${formData.diamond_shape} uploaded successfully`);
    } catch (err) {
      showStatus('error', '3D upload failed - check connection');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    if (!formData.name || !formData.price || !formData.category) {
      setError('Please fill in required fields: Name, Price, and Category.');
      setLoading(false);
      return;
    }

    const toSlug = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = toSlug(formData.name) || String(Date.now())

    try {
      const raw = parseFloat(formData.price)
      if (isNaN(raw)) {
        setError('Invalid price format.');
        setLoading(false);
        return;
      }

      const priceUSD = priceCurrency === 'USD' ? raw : Math.round((raw / fxRate) * 100) / 100
      const catNorm = String(formData.category || '').toLowerCase()
      const styleFinal = catNorm.startsWith('diamond') ? (formData.diamond_shape || formData.style) : formData.style

      const payload = {
        ...formData,
        category: formData.category,
        category_id: selectedSubCategoryId || selectedRootCategoryId || null,
        style: styleFinal,
        slug,
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
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({ title: 'Creation Successful', description: 'Your masterpiece has been added to the vault.' });
        router.push('/admin/products');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create product.');
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
    setImages(p => [...p, url]); setVideoUrl('');
    showStatus('success', 'Video link added');
  }
  const removeImage = (idx: number) => setImages(p => p.filter((_, i) => i !== idx))

  const isDia = (v: string) => String(v || '').toLowerCase().startsWith('diamond')

  const pricePreviewUSD = (() => {
    const raw = parseFloat(formData.price)
    if (!isFinite(raw)) return '0.00'
    return priceCurrency === 'USD' ? raw.toFixed(2) : (Math.round((raw / fxRate) * 100) / 100).toFixed(2)
  })()

  return (
    <div className="np-root">
      <style>{CSS}</style>

      <Link href="/admin/products" className="np-back">
        <ArrowLeft size={14} /> Back to Vault
      </Link>

      <div className="np-hdr">
        <h1 className="np-title">Add <em>New Creation</em></h1>
        <p style={{ opacity: 0.5, marginTop: 10 }}>Design and document your latest masterpiece for the collection.</p>
      </div>

      {error && (
        <div className="np-feedback np-feedback-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {uploadStatus.type !== 'none' && (
        <div className={`np-feedback np-feedback-${uploadStatus.type}`}>
          {uploadStatus.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{uploadStatus.msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="np-form-grid">

          {/* ── MAIN CONTENT ── */}
          <div className="np-main-col">

            {/* Section: Basic Identity */}
            <div className="np-card">
              <div className="np-card-hdr">
                <h2 className="np-card-title">Product <em>Identity</em></h2>
              </div>
              <div className="np-card-body">
                <div className="np-field">
                  <label className="np-label">Masterpiece Name</label>
                  <input className="np-input" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Radiant Solitaire Ring" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div className="np-field">
                    <label className="np-label">Collection / Category</label>
                    <select
                      className="np-select"
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
                        <label className="np-label">Sub Category</label>
                        <select
                          className="np-select"
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

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input className="np-input" style={{ height: 40, fontSize: 13 }} value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category..." />
                      <button type="button" className="np-btn np-btn-secondary" style={{ height: 40, padding: '0 12px' }} onClick={handleAddCategory}>Add</button>
                    </div>
                  </div>
                  <div className="np-field">
                    <label className="np-label">Story / Description</label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                      placeholder="The heritage and details of this piece..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Pricing & Inventory */}
            <div className="np-card">
              <div className="np-card-hdr">
                <h2 className="np-card-title">Value & <em>Availability</em></h2>
              </div>
              <div className="np-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                  <div className="np-field">
                    <label className="np-label">Retail Price ({priceCurrency})</label>
                    <input className="np-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" step="0.01" />
                    <p style={{ fontSize: 11, marginTop: 8, opacity: 0.5 }}>Approx. ${pricePreviewUSD} USD</p>
                  </div>
                  <div className="np-field">
                    <label className="np-label">Preferred Currency</label>
                    <select className="np-select" value={priceCurrency} onChange={e => setPriceCurrency(e.target.value as 'USD' | 'INR')}>
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                  </div>
                  <div className="np-field">
                    <label className="np-label">Stock Quantity</label>
                    <input className="np-input" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Media Manager */}
            <div className="np-card">
              <div className="np-card-hdr">
                <h2 className="np-card-title">Media <em>Gallery</em></h2>
                <span style={{ fontSize: 11, opacity: 0.4 }}>Upload images, videos, and models</span>
              </div>
              <div className="np-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <label className="np-label">Primary Portrait</label>
                    <div className="np-dropzone" onClick={() => mainFileRef.current?.click()}>
                      <input type="file" ref={mainFileRef} style={{ display: 'none' }} onChange={e => handleMainFile(e.target.files?.[0] || null)} />
                      {mainImage ? <img src={mainImage} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                        <>
                          <Upload size={32} strokeWidth={1} />
                          <p style={{ fontSize: 12 }}>Drop or click to upload main image</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="np-label">Additional Views</label>
                    <div className="np-dropzone" style={{ padding: 20 }} onClick={() => moreFileRef.current?.click()}>
                      <input type="file" multiple ref={moreFileRef} style={{ display: 'none' }} onChange={e => handleMoreFiles(e.target.files)} />
                      <Plus size={24} strokeWidth={1} />
                      <p style={{ fontSize: 12 }}>Upload more angles</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input className="np-input" style={{ height: 36, fontSize: 12 }} value={moreImgUrl} onChange={e => setMoreImgUrl(e.target.value)} placeholder="Or paste image URL..." />
                      <button type="button" className="np-btn np-btn-secondary" style={{ height: 36, padding: '0 12px' }} onClick={handleAddMoreUrl}>Link</button>
                    </div>
                  </div>
                </div>

                <div className="np-sep" style={{ margin: '32px 0' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                  <div>
                    <label className="np-label">Cinematic Video</label>
                    <div className="np-btn np-btn-secondary" style={{ width: '100%' }} onClick={() => videoFileRef.current?.click()}>
                      <input type="file" accept="video/*" ref={videoFileRef} style={{ display: 'none' }} onChange={e => handleVideoFile(e.target.files?.[0] || null)} />
                      <Video size={16} /> {videoUploading ? 'Uploading...' : 'Upload Video File'}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <input className="np-input" style={{ height: 36, fontSize: 12 }} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube/Vimeo link..." />
                      <button type="button" className="np-btn np-btn-secondary" style={{ height: 36, padding: '0 12px' }} onClick={handleAddVideoUrl}>Add</button>
                    </div>
                  </div>
                  <div>
                    <label className="np-label">3D Interaction (GLB/USDZ)</label>
                    <div className="np-btn np-btn-secondary" style={{ width: '100%' }} onClick={() => document.getElementById('3d-up')?.click()}>
                      <input id="3d-up" type="file" accept=".glb,.gltf,.usdz" style={{ display: 'none' }} onChange={e => uploadDiamondShape3D(e.target.files?.[0] || null)} />
                      <Diamond size={16} /> Upload 3D Model
                    </div>
                    {formData.diamond_shape && (() => {
                      const cur = diamondShapes.find(s => s.key === formData.diamond_shape);
                      return cur?.model_3d ? (
                        <p style={{ fontSize: 10, color: '#10B981', marginTop: 8 }}>✓ Model linked to {cur.name}</p>
                      ) : (
                        <p style={{ fontSize: 10, opacity: 0.5, marginTop: 8 }}>No model for {formData.diamond_shape || 'selected shape'}</p>
                      )
                    })()}
                  </div>
                </div>

                {/* Uploaded List */}
                {(mainImage || images.length > 0) && (
                  <div className="np-media-grid">
                    {mainImage && (
                      <div className="np-media-item" style={{ border: '2px solid var(--c-gold)' }}>
                        <img src={mainImage} alt="" />
                        <div className="np-media-remove" onClick={() => setMainImage(null)}><X size={12} /></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--c-gold)', color: '#fff', fontSize: 8, textAlign: 'center', padding: '2px 0' }}>PRIMARY</div>
                      </div>
                    )}
                    {images.map((url, i) => (
                      <div key={i} className="np-media-item">
                        {isVideo(url) ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            <Video size={24} color="#fff" />
                          </div>
                        ) : <img src={url} alt="" />}
                        <div className="np-media-remove" onClick={() => removeImage(i)}><X size={12} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specifications */}
            <div className="np-card">
              <div className="np-card-hdr"><h2 className="np-card-title">Technical <em>Specs</em></h2></div>
              <div className="np-card-body">
                {formData.category.toLowerCase().startsWith('ring') && (
                  <div className="np-field">
                    <label className="np-label">Ring Silhouette</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <select className="np-select" style={{ flex: 1 }} name="style" value={formData.style} onChange={handleChange}>
                        <option value="">Select a style</option>
                        {ringStyles.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                      </select>
                      <input className="np-input" style={{ flex: 1 }} value={newStyleName} onChange={e => setNewStyleName(e.target.value)} placeholder="Custom style name..." />
                      <button type="button" className="np-btn np-btn-secondary" onClick={addNewStyle}>Add</button>
                    </div>
                  </div>
                )}

                {isDia(formData.category) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="np-field">
                      <label className="np-label">Diamond Shape</label>
                      <select className="np-select" name="diamond_shape" value={formData.diamond_shape} onChange={handleChange}>
                        <option value="">Select shape</option>
                        {diamondShapes.map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="np-field">
                      <label className="np-label">Carat Weight</label>
                      <input className="np-input" name="carat" value={formData.carat} onChange={handleChange} placeholder="e.g., 1.50" />
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
                  <div className="np-field">
                    <label className="np-label">Cut / Quality</label>
                    <select className="np-select" name="diamond_cut" value={formData.diamond_cut} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_CUTS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="np-field">
                    <label className="np-label">Color Grade</label>
                    <select className="np-select" name="color" value={formData.color} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="np-field">
                    <label className="np-label">Clarity</label>
                    <select className="np-select" name="clarity" value={formData.clarity} onChange={handleChange}>
                      <option value="">N/A</option>
                      {DIAMOND_CLARITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="np-field" style={{ marginTop: 24 }}>
                  <label className="np-label">Available Metal Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, borderBottom: '1px solid var(--c-border)', paddingBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: 'var(--c-gold)' }}>
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
                          <label htmlFor={`metal-${opt.key}`} style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                            {opt.name}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="np-input"
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
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed var(--c-border)', paddingTop: 16 }}>
                    <input className="np-input" style={{ flex: 2, height: 40, fontSize: 13 }} value={newMetalName} onChange={e => setNewMetalName(e.target.value)} placeholder="New metal option (e.g., 14K Gold)..." />
                    <input type="number" step="0.01" className="np-input" style={{ flex: 1, height: 40, fontSize: 13 }} value={newMetalPrice} onChange={e => setNewMetalPrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="np-btn np-btn-secondary" style={{ height: 40, padding: '0 16px', fontSize: 11 }} onClick={addNewMetalOption}>Add Metal</button>
                  </div>
                </div>

                <div className="np-sep" style={{ margin: '24px 0', borderTop: '1px dashed var(--c-border)' }} />

                <div className="np-field">
                  <label className="np-label">Available Size Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2fr 0.8fr 0.5fr', gap: 12, borderBottom: '1px solid var(--c-border)', paddingBottom: 6, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', color: 'var(--c-gold)' }}>
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
                          <label htmlFor={`size-${opt.key}`} style={{ fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                            Size {opt.name}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="np-input"
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
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center', borderTop: '1px dashed var(--c-border)', paddingTop: 16 }}>
                    <input className="np-input" style={{ flex: 2, height: 40, fontSize: 13 }} value={newSizeName} onChange={e => setNewSizeName(e.target.value)} placeholder="New size option (e.g., 8.5)..." />
                    <input type="number" step="0.01" className="np-input" style={{ flex: 1, height: 40, fontSize: 13 }} value={newSizePrice} onChange={e => setNewSizePrice(e.target.value)} placeholder={`Price (${priceCurrency})`} />
                    <button type="button" className="np-btn np-btn-secondary" style={{ height: 40, padding: '0 16px', fontSize: 11 }} onClick={addNewSizeOption}>Add Size</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="np-sidebar">
            <div className="np-sticky-actions">
              <div className="np-card">
                <div className="np-card-hdr"><h2 className="np-card-title">Publish</h2></div>
                <div className="np-card-body">
                  <div className="np-field">
                    <div className="np-check-row">
                      <input id="feat_new" type="checkbox" className="np-check" style={{ width: 18, height: 18 }} checked={formData.is_featured} onChange={e => setFormData(p => ({ ...p, is_featured: e.target.checked }))} />
                      <div style={{ marginLeft: 12 }}>
                        <label htmlFor="feat_new" className="np-check-lbl" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Feature on Homepage</label>
                        <p className="np-check-sub" style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>Mark this piece as a spotlight creation.</p>
                      </div>
                    </div>
                  </div>

                  <div className="np-sep" style={{ margin: '24px 0', height: 1, background: 'var(--c-border)' }} />

                  <button type="submit" className="np-btn np-btn-primary" style={{ width: '100%', height: 60 }} disabled={loading}>
                    {loading ? 'Curating...' : 'Store Creation'}
                  </button>
                  <Link href="/admin/products" style={{ textDecoration: 'none' }}>
                    <button type="button" className="np-btn np-btn-secondary" style={{ width: '100%', marginTop: 12 }}>Cancel</button>
                  </Link>
                </div>
              </div>

              <div className="np-card" style={{ background: 'var(--c-soft)', border: 'none' }}>
                <div className="np-card-body" style={{ textAlign: 'center', opacity: 0.6 }}>
                  <Diamond size={24} strokeWidth={1} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Gems Global Jewels Admin</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
