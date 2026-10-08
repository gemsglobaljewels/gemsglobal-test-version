'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Save,
  Plus,
  Trash2,
  Upload,
  GripVertical,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShoppingBag
} from 'lucide-react'

type Category = {
  id: string
  name: string
  slug: string
  parent_category_id: string | null
  show_in_header: boolean
  header_order: number
  header_image_url: string | null
  header_description: string | null
}

type MegaMenuSection = {
  id: string
  category_id: string
  title: string
  section_order: number
  section_type: 'categories' | 'links' | 'image'
  data: any // For categories: array of child IDs; for links: array of link objects
  custom_links?: any // For backward compatibility
  image_url: string | null
}

type HeaderConfig = {
  id: string
  logo_url: string | null
  logo_text: string
  show_search: boolean
  show_cart: boolean
  show_account: boolean
  phone_number: string | null
  email: string | null
}

// Icon options for custom links
const ICON_OPTIONS = [
  { name: 'None', value: '' },
  { name: 'Sparkles', value: 'sparkles' },
  { name: 'ShoppingBag', value: 'shopping-bag' },
  { name: 'Link', value: 'link' },
  { name: 'Star', value: 'star' },
  { name: 'Heart', value: 'heart' },
  { name: 'Gift', value: 'gift' },
  { name: 'Trending', value: 'trending' }
]

// Helper to render icons
const IconRenderer = ({ icon, size = 16  }: { icon?: string; size?: number }) => {
  if (icon && icon.startsWith('http')) {
    return <img src={icon} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: '4px' }} />
  }
  switch (icon) {
    case 'sparkles':
      return <Sparkles size={size} />
    case 'shopping-bag':
      return <ShoppingBag size={size} />
    case 'link':
      return <LinkIcon size={size} />
    case 'star':
      return <span style={{ fontSize: size }}>⭐</span>
    case 'heart':
      return <span style={{ fontSize: size }}>❤️</span>
    case 'gift':
      return <span style={{ fontSize: size }}>🎁</span>
    case 'trending':
      return <span style={{ fontSize: size }}>🔥</span>
    default:
      return null
  }
}

export default function AdminHeaderManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [sections, setSections] = useState<MegaMenuSection[]>([])
  const [config, setConfig] = useState<HeaderConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [addingSection, setAddingSection] = useState(false)
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])
  // Per-section debounce timers so typing in a link field doesn't fire a save
  // (and a state-clobbering response) on every keystroke.
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(message: string) {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  // Load all data
  async function loadData() {
    setLoading(true)
    try {
      const [catRes, configRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/header-config')
      ])
      const [catData, configData] = await Promise.all([
        catRes.json(),
        configRes.json()
      ])

      setCategories(Array.isArray(catData) ? catData : [])
      setConfig(configData.config)
    } catch (e) {
      console.error('Load data error:', e)
    } finally {
      setLoading(false)
    }
  }

  // Load sections for selected category
  async function loadSections(categoryId: string) {
    try {
      const res = await fetch(`/api/mega-menu-sections?categoryId=${categoryId}`)
      const data = await res.json()
      setSections(Array.isArray(data.sections) ? data.sections.map((s: any) => ({
        ...s,
        data: s.section_type === 'links' ? (s.custom_links || s.data || []) : (s.data || [])
      })) : [])
    } catch (e) {
      console.error('Load sections error:', e)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadSections(selectedCategory)
    } else {
      setSections([])
    }
  }, [selectedCategory])

  // Clear pending debounced saves / toast timer on unmount
  useEffect(() => {
    const timers = saveTimers.current
    return () => {
      Object.values(timers).forEach(t => clearTimeout(t))
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // Toggle category expansion
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  // Save header config
  async function saveConfig() {
    if (!config) return
    setSavingConfig(true)
    try {
      const res = await fetch('/api/header-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        alert('✅ Header config saved successfully!')
      }
    } catch (e) {
      console.error('Save config error:', e)
    } finally {
      setSavingConfig(false)
    }
  }

  // Update category
  async function updateCategory(category: Category) {
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category)
      })
      if (res.ok) {
        const data = await res.json()
        setCategories(prev => prev.map(c => c.id === category.id ? data : c))
      }
    } catch (e) {
      console.error('Update category error:', e)
    }
  }

  // Upload image
  async function uploadImage(file: File) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/storage/upload-mega-menu', { method: 'POST', body: formData })
      const data = await res.json()
      return data.url
    } catch (e) {
      console.error('Upload error:', e)
      return null
    }
  }

  // Mega-menu banner actions — a proper button to change it (no more "click
  // the picture and hope") and an explicit delete with confirmation.
  function pickBannerImage(cat: Category) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploadingBannerId(cat.id)
      try {
        const url = await uploadImage(file)
        if (url) {
          updateCategory({ ...cat, header_image_url: url })
          showToast(`Banner updated for ${cat.name}`)
        } else {
          showToast('Upload failed — try again')
        }
      } finally {
        setUploadingBannerId(null)
      }
    }
    input.click()
  }

  function removeBanner(cat: Category) {
    if (!cat.header_image_url) return
    if (!confirm(`Remove the mega menu banner for "${cat.name}"?`)) return
    updateCategory({ ...cat, header_image_url: null })
    showToast(`Banner removed from ${cat.name}`)
  }

  // Persist a section. Every section in state has a real DB id (addSection
  // awaits creation), so this is always an UPDATE. We deliberately do NOT
  // overwrite local state with the response — clobbering state mid-edit is
  // exactly what used to make typing in a link field "revert"/not save.
  async function saveSectionToDB(section: MegaMenuSection) {
    setSavingSection(section.id)
    try {
      const res = await fetch('/api/mega-menu-sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: {
            id: section.id,
            category_id: section.category_id,
            title: section.title,
            section_order: section.section_order,
            section_type: section.section_type,
            data: section.data,
            custom_links: section.section_type === 'links' ? section.data : section.custom_links,
            image_url: section.image_url,
          }
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        showToast('Saved ✓')
      } else {
        console.error('Failed to save section:', data?.error)
        alert('Failed to save section: ' + (data?.error || 'unknown error'))
      }
    } catch (e) {
      console.error('Save section error:', e)
      alert('Failed to save section (network error)')
    } finally {
      setSavingSection(null)
    }
  }

  // Debounced save — coalesces rapid edits (typing) into ONE request so a
  // slow/old response can never overwrite newer keystrokes.
  function scheduleSave(section: MegaMenuSection) {
    if (saveTimers.current[section.id]) clearTimeout(saveTimers.current[section.id])
    saveTimers.current[section.id] = setTimeout(() => {
      delete saveTimers.current[section.id]
      saveSectionToDB(section)
    }, 650)
  }

  // Add new section — await creation so the section always has a REAL id
  // before it can be edited (no temp ids => no duplicate/orphan rows).
  async function addSection() {
    if (!selectedCategory || addingSection) return
    setAddingSection(true)
    try {
      const res = await fetch('/api/mega-menu-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: {
            category_id: selectedCategory,
            title: 'New Section',
            section_order: sections.length,
            section_type: 'categories',
            data: [],
            custom_links: [],
            image_url: null
          }
        })
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.section) {
        setSections(prev => [...prev, data.section])
        showToast('Section added')
      } else {
        alert('Failed to add section: ' + (data?.error || 'unknown error'))
      }
    } catch (e) {
      console.error('Add section error:', e)
      alert('Failed to add section (network error)')
    } finally {
      setAddingSection(false)
    }
  }

  // Delete section
  async function deleteSection(id: string) {
    if (!confirm('Are you sure you want to delete this section?')) return
    try {
      await fetch(`/api/mega-menu-sections?id=${id}`, { method: 'DELETE' })
      setSections(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      console.error('Delete section error:', e)
    }
  }

  // Immutably replace one section in state and return the new object.
  function replaceSection(sectionIndex: number, patch: Partial<MegaMenuSection>) {
    const current = sections[sectionIndex]
    if (!current) return null
    const updated = { ...current, ...patch }
    setSections(prev => prev.map((s, i) => (i === sectionIndex ? updated : s)))
    return updated
  }

  // Add custom link (discrete action → save immediately)
  async function addLink(sectionIndex: number) {
    const section = sections[sectionIndex]
    if (!section) return
    const updated = replaceSection(sectionIndex, {
      data: [...(section.data || []), { label: 'New Link', url: '/', icon: '' }],
    })
    if (updated) await saveSectionToDB(updated)
  }

  // Update custom link (typing → DEBOUNCED save; never clobbers keystrokes)
  function updateLink(sectionIndex: number, linkIndex: number, updatedLink: any) {
    const section = sections[sectionIndex]
    if (!section) return
    const links = [...(section.data || [])]
    links[linkIndex] = updatedLink
    const updated = replaceSection(sectionIndex, { data: links })
    if (updated) scheduleSave(updated)
  }

  // Remove custom link (discrete → save immediately)
  async function removeLink(sectionIndex: number, linkIndex: number) {
    const section = sections[sectionIndex]
    if (!section) return
    const updated = replaceSection(sectionIndex, {
      data: (section.data || []).filter((_: any, i: number) => i !== linkIndex),
    })
    if (updated) await saveSectionToDB(updated)
  }

  // Toggle child category selection (discrete → save immediately)
  async function toggleChildCategory(sectionIndex: number, childId: string) {
    const section = sections[sectionIndex]
    if (!section) return
    const selected = (section.data || []) as string[]
    const newSelected = selected.includes(childId)
      ? selected.filter(id => id !== childId)
      : [...selected, childId]
    const updated = replaceSection(sectionIndex, { data: newSelected })
    if (updated) await saveSectionToDB(updated)
  }

  // Update section type (discrete → reset data for the new type, save now)
  async function updateSectionType(sectionIndex: number, newType: 'categories' | 'links' | 'image') {
    const updated = replaceSection(sectionIndex, { section_type: newType, data: [] })
    if (updated) await saveSectionToDB(updated)
  }

  // Update section title (typing → DEBOUNCED save)
  function updateSectionTitle(sectionIndex: number, newTitle: string) {
    const updated = replaceSection(sectionIndex, { title: newTitle })
    if (updated) scheduleSave(updated)
  }

  // Upload image for section (discrete → save immediately)
  async function uploadSectionImage(sectionIndex: number, file: File) {
    const section = sections[sectionIndex]
    if (!section) return
    const url = await uploadImage(file)
    if (url) {
      const updated = replaceSection(sectionIndex, { image_url: url })
      if (updated) await saveSectionToDB(updated)
    }
  }

  // Upload image for custom link (discrete → save immediately)
  async function uploadLinkImage(sectionIndex: number, linkIndex: number, file: File) {
    const section = sections[sectionIndex]
    if (!section) return
    const url = await uploadImage(file)
    if (url) {
      const links = [...(section.data || [])]
      links[linkIndex] = { ...links[linkIndex], icon: url }
      const updated = replaceSection(sectionIndex, { data: links })
      if (updated) await saveSectionToDB(updated)
    }
  }

  // Upload logo
  async function uploadLogo(file: File) {
    const url = await uploadImage(file)
    if (url && config) {
      setConfig({ ...config, logo_url: url })
    }
  }

  if (loading) {
    return (
      <div className="a-page">
        <div className="a-loader-row">
          <span className="a-loader" />
          <span className="a-loader-label">Loading…</span>
        </div>
      </div>
    )
  }

  // Get parent categories
  const parentCategories = categories.filter(c => !c.parent_category_id)
  const headerCategories = categories
    .filter(c => c.show_in_header)
    .sort((a, b) => a.header_order - b.header_order)

  return (
    <div className="a-page">
      <style>{`
        .mm-section {
          border: 1px solid var(--c-border);
          border-radius: var(--radius);
          padding: 20px;
          margin-bottom: 16px;
          background: var(--c-surface);
          transition: all 0.2s ease;
        }
        .mm-category-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border: 2px solid var(--c-border);
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .mm-category-pill:hover {
          border-color: var(--c-accent);
          transform: translateY(-1px);
        }
        .mm-category-pill.active {
          border-color: var(--c-accent);
          background: var(--c-accent-soft);
        }
        .category-card {
          border: 1px solid var(--c-border);
          border-radius: var(--radius);
          padding: 16px;
          background: var(--c-bg);
        }
        .child-category-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .child-category-item:hover {
          background: var(--c-surface);
        }
        .child-category-item.selected {
          background: var(--c-accent-soft);
          border: 1px solid var(--c-accent);
        }
        .link-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: var(--c-surface);
          border-radius: var(--radius);
          margin-bottom: 8px;
          border: 1px solid var(--c-border);
        }
        /* Responsive two-column layout → stacks on smaller screens */
        .hm-admin-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 24px;
          margin-top: 32px;
          align-items: start;
        }
        .hm-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .hm-links-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        @media (max-width: 1024px) {
          .hm-admin-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 680px) {
          .hm-how-grid { grid-template-columns: 1fr; }
          .hm-links-grid { grid-template-columns: 1fr; }
          .mm-section { padding: 14px; }
          .link-item { flex-direction: column; }
        }
        /* Saved toast */
        .hm-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--c-accent);
          color: #fff;
          padding: 12px 18px;
          border-radius: 10px;
          font-family: var(--font-dmsans);
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 12px 32px rgba(0,0,0,0.20);
          animation: hmToastIn 0.25s ease;
        }
        @keyframes hmToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {toast && <div className="hm-toast">{toast}</div>}

      {/* Page Header */}
      <div className="a-head">
        <div>
          <div className="a-eyebrow">Settings</div>
          <h1 className="a-title">Header & Mega Menu</h1>
          <p className="a-subtitle">Design your perfect header navigation and mega menus!</p>
        </div>
        <button onClick={saveConfig} disabled={savingConfig} className="a-btn a-btn--primary">
          {savingConfig ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Save size={16} /> Save Header Config
            </>
          )}
        </button>
      </div>

      <div className="hm-admin-grid">
        {/* Left: Header Config */}
        <div className="a-card">
          <div className="a-card-head">
            <h2 className="a-card-title">Header Settings</h2>
          </div>
          <div className="a-card-body a-stack">
            {/* Logo Text */}
            <div className="a-field">
              <label className="a-label">Logo Text</label>
              <input
                type="text"
                value={config?.logo_text || ''}
                onChange={(e) => setConfig({ ...config!, logo_text: e.target.value })}
                className="a-input"
                placeholder="Your brand name"
              />
            </div>

            {/* Logo Upload */}
            <div className="a-field">
              <label className="a-label">Logo Image</label>
              <div
                className="a-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  minHeight: '120px',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => fileRefs.current[0]?.click()}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[0] = el }}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      await uploadLogo(e.target.files[0])
                    }
                  }}
                />
                {config?.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt="Logo"
                    style={{ maxHeight: '80px', maxWidth: '200px', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Upload size={28} />
                    <span style={{ fontWeight: '500' }}>Click to upload logo</span>
                    <span style={{ fontSize: '12px' }}>PNG, JPG, SVG up to 5MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Toggles */}
            <div className="a-stack" style={{ gap: '12px' }}>
              <label className="a-row a-row--between" style={{ gap: '10px', padding: '12px', background: 'var(--c-surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontWeight: '500' }}>Show Search</span>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Display search icon in header</span>
                </div>
                <span className="a-switch">
                  <input type="checkbox" checked={config?.show_search || false} onChange={(e) => setConfig({ ...config!, show_search: e.target.checked })} />
                  <span className="a-switch-slider" />
                </span>
              </label>

              <label className="a-row a-row--between" style={{ gap: '10px', padding: '12px', background: 'var(--c-surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontWeight: '500' }}>Show Cart</span>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Display shopping cart icon</span>
                </div>
                <span className="a-switch">
                  <input type="checkbox" checked={config?.show_cart || false} onChange={(e) => setConfig({ ...config!, show_cart: e.target.checked })} />
                  <span className="a-switch-slider" />
                </span>
              </label>

              <label className="a-row a-row--between" style={{ gap: '10px', padding: '12px', background: 'var(--c-surface)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--font-dmsans)', fontWeight: '500' }}>Show Account</span>
                  <span style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Display user account icon</span>
                </div>
                <span className="a-switch">
                  <input type="checkbox" checked={config?.show_account || false} onChange={(e) => setConfig({ ...config!, show_account: e.target.checked })} />
                  <span className="a-switch-slider" />
                </span>
              </label>
            </div>

            {/* Phone & Email */}
            <div className="a-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <div className="a-field">
                <label className="a-label">Phone Number</label>
                <input
                  type="text"
                  value={config?.phone_number || ''}
                  onChange={(e) => setConfig({ ...config!, phone_number: e.target.value })}
                  className="a-input"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="a-field">
                <label className="a-label">Email</label>
                <input
                  type="text"
                  value={config?.email || ''}
                  onChange={(e) => setConfig({ ...config!, email: e.target.value })}
                  className="a-input"
                  placeholder="hello@yourbrand.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Categories & Mega Menu */}
        <div className="a-card">
          <div className="a-card-head">
            <h2 className="a-card-title">Categories & Mega Menu</h2>
          </div>
          <div className="a-card-body">
            {/* Header Category Pills */}
            <div style={{ marginBottom: '28px' }}>
              <div className="a-row a-row--between" style={{ marginBottom: '16px' }}>
                <label className="a-label" style={{ margin: 0 }}>Categories in Header</label>
                <span style={{ color: 'var(--c-text-muted)', fontSize: '12px' }}>{headerCategories.length} selected</span>
              </div>
              <div className="a-row a-wrap" style={{ gap: '10px', marginBottom: '24px' }}>
                {headerCategories.map(cat => (
                  <div
                    key={cat.id}
                    className={`mm-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  >
                    <span>{cat.name}</span>
                    <GripVertical size={16} style={{ color: selectedCategory === cat.id ? 'var(--c-accent)' : 'var(--c-text-muted)', opacity: '0.7' }} />
                  </div>
                ))}
                {headerCategories.length === 0 && (
                  <span style={{ color: 'var(--c-text-muted)', fontStyle: 'italic' }}>No categories selected yet - check the boxes below!</span>
                )}
              </div>

              {/* All Categories List */}
              <label className="a-label" style={{ marginBottom: '16px' }}>All Categories</label>
              <div className="a-stack" style={{ gap: '12px' }}>
                {parentCategories.map(cat => (
                  <div key={cat.id} className="category-card">
                    <div className="a-row a-row--between" style={{ marginBottom: '8px' }}>
                      <div className="a-row" style={{ gap: '14px', alignItems: 'center' }}>
                        <label className="a-row" style={{ gap: '10px' }}>
                          <input
                            type="checkbox"
                            className="a-check"
                            checked={cat.show_in_header}
                            onChange={(e) => updateCategory({ ...cat, show_in_header: e.target.checked })}
                          />
                          <span style={{ fontFamily: 'var(--font-dmsans)', fontWeight: '600', fontSize: '15px' }}>{cat.name}</span>
                        </label>
                        <button
                          onClick={() => toggleExpand(cat.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: 'var(--c-text-muted)',
                            display: 'flex'
                          }}
                        >
                          {expandedCategories.has(cat.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                      <div className="a-row" style={{ gap: '8px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--c-text-muted)' }}>Order:</label>
                        <input
                          type="number"
                          value={cat.header_order}
                          onChange={(e) => updateCategory({ ...cat, header_order: parseInt(e.target.value) || 0 })}
                          className="a-input"
                          style={{ width: '70px' }}
                        />
                      </div>
                    </div>

                    {/* Child Categories & Header Image */}
                    {expandedCategories.has(cat.id) && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--c-border)' }}>
                        <div className="a-stack" style={{ gap: '12px' }}>
                          {/* Header Image for Category (Main Banner) */}
                          <div className="a-field">
                            <label className="a-label">Main Banner Image</label>
                            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--c-text-muted)' }}>
                              Shows as a banner on the right side of this category's mega menu (with or without sections).
                            </p>

                            {/* Preview — display only; the buttons below do the work */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '120px',
                                padding: '10px',
                                background: 'var(--c-surface)',
                                border: '1px dashed var(--c-border)',
                                borderRadius: 'var(--radius)',
                                overflow: 'hidden'
                              }}
                            >
                              {cat.header_image_url ? (
                                <img
                                  src={cat.header_image_url}
                                  alt={`${cat.name} banner`}
                                  style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                                />
                              ) : (
                                <div style={{ color: 'var(--c-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                  <ImageIcon size={24} />
                                  <span style={{ fontSize: '12px' }}>No banner for {cat.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Proper actions: change (edit) + delete */}
                            <div className="a-row" style={{ gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                className="a-btn a-btn--subtle a-btn--sm"
                                onClick={() => pickBannerImage(cat)}
                                disabled={uploadingBannerId === cat.id}
                                title={cat.header_image_url ? 'Replace the current banner' : 'Upload a banner image'}
                              >
                                <Upload size={14} />
                                {uploadingBannerId === cat.id
                                  ? 'Uploading…'
                                  : cat.header_image_url ? 'Change image' : 'Upload image'}
                              </button>
                              {cat.header_image_url && (
                                <button
                                  type="button"
                                  className="a-btn a-btn--danger a-btn--sm"
                                  onClick={() => removeBanner(cat)}
                                  title="Delete this category's mega menu banner"
                                >
                                  <Trash2 size={14} /> Remove banner
                                </button>
                              )}
                            </div>

                            {/* Optional: point at an existing image URL instead of uploading */}
                            <input
                              key={`${cat.id}:${cat.header_image_url || ''}`}
                              className="a-input"
                              style={{ marginTop: '8px' }}
                              defaultValue={cat.header_image_url || ''}
                              placeholder="…or paste an image URL (applies when you click away)"
                              title="Direct image URL — Enter or click away to apply"
                              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              onBlur={(e) => {
                                const v = e.target.value.trim()
                                const current = cat.header_image_url || ''
                                // Blank never deletes here — clearing goes through "Remove banner".
                                if (!v || v === current) return
                                updateCategory({ ...cat, header_image_url: v })
                                showToast(`Banner updated for ${cat.name}`)
                              }}
                            />
                          </div>

                          {/* Child Categories */}
                          {categories.filter(c => c.parent_category_id === cat.id).length > 0 && (
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--c-text-muted)', marginBottom: '8px', display: 'block' }}>
                                Child Categories ({categories.filter(c => c.parent_category_id === cat.id).length})
                              </label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {categories.filter(c => c.parent_category_id === cat.id).map(child => (
                                  <span key={child.id} style={{
                                    fontSize: '13px',
                                    color: 'var(--c-text)',
                                    padding: '6px 12px',
                                    background: 'var(--c-surface)',
                                    borderRadius: '9999px',
                                    border: '1px solid var(--c-border)'
                                  }}>
                                    {child.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mega Menu Sections for Selected Category */}
            {selectedCategory && (
              <div style={{ borderTop: '2px solid var(--c-border)', paddingTop: '28px' }}>
                <div className="a-row a-row--between" style={{ marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontFamily: 'var(--font-dmsans)', fontSize: '18px', fontWeight: '600' }}>
                      Mega Menu for: {categories.find(c => c.id === selectedCategory)?.name}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--c-text-muted)', fontSize: '13px' }}>
                      Build your mega menu sections below - changes auto-save!
                    </p>
                  </div>
                  <button
                    onClick={addSection}
                    className="a-btn a-btn--primary a-btn--sm"
                    disabled={!selectedCategory || addingSection}
                    style={{ opacity: (selectedCategory && !addingSection) ? 1 : 0.5, cursor: (selectedCategory && !addingSection) ? 'pointer' : 'not-allowed' }}
                  >
                    {addingSection ? <span className="animate-spin">⏳</span> : <Plus size={16} />}
                    {addingSection ? 'Adding…' : 'Add Section'}
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--c-text-muted)' }}>
                    <Sparkles size={36} style={{ marginBottom: '12px', opacity: '0.5' }} />
                    <p style={{ marginBottom: '8px' }}>No sections yet</p>
                    <p style={{ fontSize: '13px', marginBottom: '16px' }}>Click "Add Section" to get started!</p>
                  </div>
                ) : (
                  <div className="a-stack">
                    {sections.map((section, idx) => {
                      const childCategories = categories.filter(c => c.parent_category_id === selectedCategory)
                      return (
                        <div key={section.id} className="mm-section">
                          <div className="a-row a-row--between" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed var(--c-border)' }}>
                            <div className="a-row" style={{ gap: '16px', flex: 1 }}>
                              <GripVertical size={20} style={{ color: 'var(--c-text-muted)', cursor: 'grab' }} />
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => updateSectionTitle(idx, e.target.value)}
                                className="a-input"
                                style={{ fontWeight: '600', fontSize: '15px', border: 'none', padding: '8px 0', background: 'transparent' }}
                                placeholder="Section Title"
                              />
                              <select
                                value={section.section_type}
                                onChange={(e) => updateSectionType(idx, e.target.value as any)}
                                className="a-input"
                                style={{ width: '160px' }}
                              >
                                <option value="categories">Child Categories</option>
                                <option value="links">Custom Links</option>
                                <option value="image">Image</option>
                              </select>
                            </div>
                            <div className="a-row" style={{ gap: '8px' }}>
                              {savingSection === section.id && <span style={{ fontSize: '12px', color: 'var(--c-accent)' }}>Saving…</span>}
                              <button onClick={() => deleteSection(section.id)} className="a-icon-btn a-icon-btn--danger">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Section Type: Child Categories */}
                          {section.section_type === 'categories' && (
                            <div className="a-stack" style={{ gap: '8px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontWeight: '500' }}>
                                Select child categories to show:
                              </label>
                              {childCategories.length === 0 ? (
                                <p style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontStyle: 'italic' }}>
                                  No child categories found for this category!
                                </p>
                              ) : (
                                <div className="hm-links-grid">
                                  {childCategories.map(child => (
                                    <div
                                      key={child.id}
                                      className={`child-category-item ${(section.data || []).includes(child.id) ? 'selected' : ''}`}
                                      onClick={() => toggleChildCategory(idx, child.id)}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                      <input
                                        type="checkbox"
                                        className="a-check"
                                        checked={((section.data || []) as string[]).includes(child.id)}
                                        onChange={() => toggleChildCategory(idx, child.id)}
                                      />
                                      <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {child.name}
                                        {child.header_image_url && (
                                          <span style={{ fontSize: '10px', color: 'var(--c-text-muted)' }}>
                                            🖼️ Has image
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Section Type: Custom Links */}
                          {section.section_type === 'links' && (
                            <div className="a-stack" style={{ gap: '12px' }}>
                              <div className="a-row a-row--between">
                                <label style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontWeight: '500' }}>
                                  Custom Links <span style={{ opacity: 0.7 }}>(auto-saves as you type)</span>:
                                </label>
                                <button onClick={() => addLink(idx)} className="a-btn a-btn--sm">
                                  <Plus size={14} /> Add Link
                                </button>
                              </div>
                              {(section.data || []).length === 0 && (
                                <p style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
                                  No links yet - click "Add Link" above!
                                </p>
                              )}
                              {(section.data || []).map((link: any, linkIndex: number) => (
                                <div key={linkIndex} className="link-item">
                                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <input
                                        type="text"
                                        value={link.label}
                                        onChange={(e) => updateLink(idx, linkIndex, { ...link, label: e.target.value })}
                                        className="a-input"
                                        placeholder="Link text"
                                        style={{ flex: 1 }}
                                      />
                                      <select
                                        value={link.icon && !link.icon.startsWith('http') ? link.icon : ''}
                                        onChange={(e) => updateLink(idx, linkIndex, { ...link, icon: e.target.value })}
                                        className="a-input"
                                        style={{ width: '120px' }}
                                      >
                                        {ICON_OPTIONS.map(iconOpt => (
                                          <option key={iconOpt.value} value={iconOpt.value}>{iconOpt.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        value={link.url}
                                        onChange={(e) => updateLink(idx, linkIndex, { ...link, url: e.target.value })}
                                        className="a-input"
                                        placeholder="/your-url"
                                        style={{ flex: 1 }}
                                      />
                                      {/* Custom Link Image Upload */}
                                      <div
                                        onClick={() => {
                                          const input = document.createElement('input')
                                          input.type = 'file'
                                          input.accept = 'image/*'
                                          input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0]
                                            if (file) {
                                              await uploadLinkImage(idx, linkIndex, file)
                                            }
                                          }
                                          input.click()
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          width: '50px',
                                          height: '42px',
                                          borderRadius: '8px',
                                          border: '1px solid var(--c-border)',
                                          background: 'var(--c-surface)',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {link.icon && link.icon.startsWith('http') ? (
                                          <img src={link.icon} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                                        ) : (
                                          <ImageIcon size={18} style={{ color: 'var(--c-text-muted)' }} />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <button onClick={() => removeLink(idx, linkIndex)} className="a-icon-btn a-icon-btn--danger" style={{ alignSelf: 'flex-start' }}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Section Type: Image */}
                          {section.section_type === 'image' && (
                            <div className="a-stack" style={{ gap: '12px' }}>
                              <label style={{ fontSize: '12px', color: 'var(--c-text-muted)', fontWeight: '500' }}>Section Image:</label>
                              <div
                                className="a-input"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minHeight: '180px',
                                  cursor: 'pointer',
                                  border: '2px dashed var(--c-border)'
                                }}
                                onClick={() => {
                                  const input = document.createElement('input')
                                  input.type = 'file'
                                  input.accept = 'image/*'
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0]
                                    if (file) {
                                      await uploadSectionImage(idx, file)
                                    }
                                  }
                                  input.click()
                                }}
                              >
                                {section.image_url ? (
                                  <img src={section.image_url} alt="Section" style={{ maxHeight: '160px', borderRadius: '8px' }} />
                                ) : (
                                  <div style={{ textAlign: 'center', color: 'var(--c-text-muted)' }}>
                                    <ImageIcon size={32} style={{ marginBottom: '8px' }} />
                                    <p>Click to upload image</p>
                                    <p style={{ fontSize: '12px' }}>PNG, JPG up to 10MB</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div style={{ marginTop: '40px', padding: '32px', border: '2px dashed var(--c-border)', borderRadius: 'var(--radius)', background: 'var(--c-surface)' }}>
        <h3 style={{ marginTop: '0', marginBottom: '16px', fontFamily: 'var(--font-dmsans)', fontSize: '20px' }}>🚀 How the Mega Menu Works</h3>
        <div className="hm-how-grid">
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--c-accent)' }}>1. Select Categories</div>
            <p style={{ margin: 0, color: 'var(--c-text-muted)', lineHeight: '1.6' }}>Check the boxes next to categories to show them in your header. Set their order too!</p>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--c-accent)' }}>2. Build Mega Menu</div>
            <p style={{ margin: 0, color: 'var(--c-text-muted)', lineHeight: '1.6' }}>Click a category, then add sections: child categories, custom links, or beautiful images. Changes auto-save!</p>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: 'var(--c-accent)' }}>3. Done!</div>
            <p style={{ margin: 0, color: 'var(--c-text-muted)', lineHeight: '1.6' }}>Your customers will see the beautiful mega menu when they hover over categories!</p>
          </div>
        </div>
      </div>
    </div>
  )
}
