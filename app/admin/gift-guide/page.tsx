'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Save, Plus, Trash2, AlertCircle, Sparkles,
  Search, X, ImageIcon, Gift, Tag, DollarSign, Users, LayoutTemplate, Megaphone,
} from 'lucide-react'
import { DEFAULT_GIFT_GUIDE, normalizeGiftGuide, GiftGuideConfig } from '@/lib/giftGuide'

type PickerTarget = 'her' | 'him' | null

interface MiniProduct {
  id: string
  name: string
  price: number
  image: string | null
  slug: string
  /** owning category id + name — used to scope the picker to a recipient */
  category_id: string | null
  category: string | null
}

interface RecipientCategory {
  id: string
  name: string
  image_url: string | null
  slug: string
}

/** Lean node of the full category tree — resolves recipient descendants AND
 *  feeds the "Shop by Category" opt-in toggle list. */
interface AllCat {
  id: string
  name: string
  slug: string
  parent_category_id: string | null
  image_url: string | null
}

const CSS = `
.gg-a-thumb{ width:64px; height:64px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--c-border); background:#fff; flex-shrink:0; }
.gg-a-thumb--empty{ display:flex; align-items:center; justify-content:center; color:var(--c-text-faint); }
.gg-a-media-row{ display:flex; align-items:center; gap:14px; }
.gg-a-media-body{ flex:1; min-width:0; display:flex; flex-direction:column; gap:9px; }
.gg-a-list-item{ border:1px solid var(--c-border); border-radius:var(--radius); background:var(--c-surface); padding:16px; }
.gg-a-list-head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; }
.gg-a-chip{
  display:inline-flex; align-items:center; gap:8px; padding:6px 10px 6px 6px; border-radius:999px;
  background:#fff; border:1px solid var(--c-border); font-size:12px; color:var(--c-text);
}
.gg-a-chip img{ width:26px; height:26px; border-radius:50%; object-fit:cover; border:1px solid var(--c-border); }
.gg-a-chip button{ display:inline-flex; border:0; background:transparent; cursor:pointer; color:var(--c-text-muted); }
.gg-a-chip button:hover{ color:var(--c-danger); }
.gg-a-picks{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
.gg-a-modal-list{ display:flex; flex-direction:column; gap:8px; max-height:52vh; overflow-y:auto; padding-right:4px; }
.gg-a-prow{
  display:flex; align-items:center; gap:12px; padding:8px; border-radius:var(--radius);
  border:1px solid var(--c-border); background:#fff; cursor:pointer; text-align:left;
  transition:border-color .15s, background .15s;
}
.gg-a-prow:hover{ border-color:var(--c-accent); background:var(--c-surface); }
.gg-a-prow.is-picked{ border-color:var(--c-accent); background:var(--c-accent-soft); }
.gg-a-prow img{ width:44px; height:44px; border-radius:var(--radius-sm); object-fit:cover; border:1px solid var(--c-border); flex-shrink:0; }
.gg-a-prow-name{ font-size:13.5px; font-weight:600; color:var(--c-text); }
.gg-a-prow-price{ font-size:12px; color:var(--c-text-muted); }
.gg-a-modal-wide{ max-width:620px; }
.gg-a-rfilter{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px; }
.gg-a-rpill{
  font-size:12px; font-weight:600; padding:6px 14px; border-radius:999px; cursor:pointer;
  background:#fff; color:var(--c-text-muted); border:1px solid var(--c-border);
  transition:color .15s, background .15s, border-color .15s;
}
.gg-a-rpill:hover{ border-color:var(--c-accent); color:var(--c-text); }
.gg-a-rpill.is-active{ background:var(--c-accent); color:#fff; border-color:var(--c-accent); }
`

export default function AdminGiftGuidePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null)
  const [cfg, setCfg] = useState<GiftGuideConfig>(DEFAULT_GIFT_GUIDE)

  // product catalog (for the picker + resolving chip names)
  const [catalog, setCatalog] = useState<MiniProduct[]>([])
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [pickerSearch, setPickerSearch] = useState('')
  // which recipient the picker is scoped to (null = show all products)
  const [pickerRecipient, setPickerRecipient] = useState<string | null>(null)

  // recipient categories (managed in Categories admin via "show on recipient")
  const [recipientCats, setRecipientCats] = useState<RecipientCategory[]>([])
  // full category tree — resolves recipient descendants + feeds the "Shop by Category" toggles
  const [allCats, setAllCats] = useState<AllCat[]>([])
  // search filter for the "Shop by Category" toggle list (all categories can be long)
  const [catSearch, setCatSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/gift-guide')
      .then((r) => r.json())
      .then((d) => { if (d && !d.error) setCfg(normalizeGiftGuide(d.config)) })
      .finally(() => setLoading(false))

    // One categories fetch feeds both the "Shop by Recipient" section
    // (recipients = show_on_recipient) and the picker's recipient scoping (full tree).
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setAllCats(
            d.map((c: any) => ({
              id: String(c.id),
              name: c.name || 'Untitled',
              slug: c.slug || String(c.id),
              parent_category_id: c.parent_category_id ? String(c.parent_category_id) : null,
              image_url: c.image_url || null,
            }))
          )
          setRecipientCats(
            d.filter((c: any) => c.show_on_recipient).map((c: any) => ({
              id: String(c.id),
              name: c.name || 'Untitled',
              image_url: c.image_url || null,
              slug: c.slug || String(c.id),
            }))
          )
        }
      })
      .catch(() => {})

    fetch('/api/products?limit=1000')
      .then((r) => r.json())
      .then((d) => {
        const list = (d?.products || []).map((p: any) => ({
          id: String(p.id),
          name: p.name || 'Untitled',
          price: Number(p.price || 0),
          image: p.image || (Array.isArray(p.images) ? p.images[0] : null) || null,
          slug: p.slug || String(p.id),
          category_id: p.category_id != null ? String(p.category_id) : null,
          category: p.category != null ? String(p.category) : null,
        }))
        setCatalog(list)
      })
      .catch(() => {})
  }, [])

  const catalogById = useMemo(() => {
    const m = new Map<string, MiniProduct>()
    for (const p of catalog) m.set(p.id, p)
    return m
  }, [catalog])

  // Recipient category id → { ids, names } for that recipient + all its
  // descendant categories, so the picker filter matches products in every
  // sub-category under a recipient. Mirrors the public gift-guide page and the
  // dual (id-or-name) matching in /api/products.
  const recipientDescendants = useMemo(() => {
    const byId = new Map<string, AllCat>()
    const childrenByParent = new Map<string, string[]>()
    for (const c of allCats) {
      byId.set(c.id, c)
      if (c.parent_category_id) {
        const arr = childrenByParent.get(c.parent_category_id) || []
        arr.push(c.id)
        childrenByParent.set(c.parent_category_id, arr)
      }
    }
    const norm = (s: string) => String(s || '').toLowerCase().trim()
    const collect = (rootId: string, rootLabel?: string) => {
      const ids = new Set<string>([rootId])
      const names = new Set<string>()
      if (rootLabel) names.add(norm(rootLabel))
      const stack = [rootId]
      while (stack.length) {
        const cur = stack.pop()!
        const cat = byId.get(cur)
        if (cat) {
          if (cat.name) names.add(norm(cat.name))
          if (cat.slug) names.add(norm(cat.slug))
        }
        for (const child of childrenByParent.get(cur) || []) {
          if (!ids.has(child)) {
            ids.add(child)
            stack.push(child)
          }
        }
      }
      return { ids, names }
    }
    const m = new Map<string, { ids: Set<string>; names: Set<string> }>()
    for (const r of recipientCats) m.set(r.id, collect(r.id, r.name))
    return m
  }, [allCats, recipientCats])

  // Best-effort: which recipient category corresponds to the For Her / For Him
  // rail, used to pre-select the picker's recipient scope. Falls back to null (All).
  const guessRecipient = (target: 'her' | 'him'): string | null => {
    const re =
      target === 'her'
        ? /\b(her|hers|women|woman|womens|ladies|lady|female)\b/i
        : /\b(him|his|men|man|mens|male|gent|gents|boy|boys)\b/i
    const hit = recipientCats.find((c) => re.test(c.name) || re.test(c.slug))
    return hit ? hit.id : null
  }

  const showToast = (msg: string, err = false) => {
    setToast({ msg, err })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/gift-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: cfg }),
      })
      const d = await res.json()
      if (res.ok && !d.error) {
        setCfg(normalizeGiftGuide(d.config))
        showToast('Gift Guide updated')
      } else throw new Error(d.error || 'Failed to update')
    } catch (e: any) {
      showToast(e.message, true)
    } finally {
      setSaving(false)
    }
  }

  // ── generic uploader ──
  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    showToast('Uploading image…')
    try {
      const res = await fetch('/api/storage/upload-gift-guide', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) { showToast('Image uploaded'); return d.url }
      throw new Error(d.error || 'Upload failed')
    } catch (e: any) {
      showToast(e.message || 'Upload failed', true)
      return null
    }
  }

  // ── typed setters ──
  const setHero = (k: keyof GiftGuideConfig['hero'], v: string) =>
    setCfg((p) => ({ ...p, hero: { ...p.hero, [k]: v } }))
  const setClosing = (k: keyof GiftGuideConfig['closing'], v: string) =>
    setCfg((p) => ({ ...p, closing: { ...p.closing, [k]: v } as GiftGuideConfig['closing'] }))

  // recipients — visibility toggle per recipient category (id keyed).
  // Missing / true = shown on the Gift Guide; false = hidden.
  const isRecipientShown = (id: string) => cfg.recipient_visibility?.[id] !== false
  const toggleRecipientShown = (id: string) =>
    setCfg((p) => ({
      ...p,
      recipient_visibility: { ...(p.recipient_visibility || {}), [id]: !( (p.recipient_visibility || {})[id] !== false ) },
    }))

  // price tiers
  const addTier = () =>
    setCfg((p) => ({ ...p, price_tiers: [...p.price_tiers, { label: '$150', max: 150, is_enabled: true }] }))
  const updTier = (i: number, k: 'label' | 'max' | 'is_enabled', v: any) =>
    setCfg((p) => { const a = [...p.price_tiers]; a[i] = { ...a[i], [k]: v }; return { ...p, price_tiers: a } })
  const rmTier = (i: number) =>
    setCfg((p) => ({ ...p, price_tiers: p.price_tiers.filter((_, x) => x !== i) }))

  // "Shop by Category" — opt-in visibility per category id (default HIDDEN, the
  // inverse of recipients). A category shows on the Gift Guide only when true.
  const isCategoryShown = (id: string) => cfg.category_visibility?.[id] === true
  const toggleCategoryShown = (id: string) =>
    setCfg((p) => ({
      ...p,
      category_visibility: {
        ...(p.category_visibility || {}),
        [id]: !((p.category_visibility || {})[id] === true),
      },
    }))

  // curated products
  const pickField = pickerTarget === 'her' ? 'her_product_ids' : 'him_product_ids'
  const togglePick = (id: string) =>
    setCfg((p) => {
      const cur = (p[pickField] as string[]) || []
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
      return { ...p, [pickField]: next } as GiftGuideConfig
    })
  const removePick = (target: 'her' | 'him', id: string) => {
    const field = target === 'her' ? 'her_product_ids' : 'him_product_ids'
    setCfg((p) => ({ ...p, [field]: (p[field] as string[]).filter((x) => x !== id) } as GiftGuideConfig))
  }

  const filteredCatalog = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    const rec = pickerRecipient ? recipientDescendants.get(pickerRecipient) : null
    let list = catalog
    // Scope to the selected recipient's categories (id match, or category
    // name/slug match as a fallback — same as /api/products).
    if (rec) {
      list = list.filter((p) => {
        if (p.category_id && rec.ids.has(p.category_id)) return true
        const nm = String(p.category || '').toLowerCase().trim()
        return !!nm && (rec.names.has(nm) || rec.names.has(nm.replace(/\s+/g, '-')))
      })
    }
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q))
    return list.slice(0, 60)
  }, [pickerSearch, catalog, pickerRecipient, recipientDescendants])

  if (loading) return null

  const currentPicks = (pickerTarget === 'her' ? cfg.her_product_ids : cfg.him_product_ids) || []

  // "Shop by Category" toggle list — all categories, filtered by the search box.
  const catQuery = catSearch.trim().toLowerCase()
  const shopCatList = catQuery
    ? allCats.filter((c) => c.name.toLowerCase().includes(catQuery) || c.slug.toLowerCase().includes(catQuery))
    : allCats
  const shownCatCount = allCats.reduce((n, c) => n + (isCategoryShown(c.id) ? 1 : 0), 0)

  return (
    <div className="a-page">
      <style>{CSS}</style>

      <div className="a-head">
        <div>
          <div className="a-eyebrow">Marketing</div>
          <h1 className="a-title">Gift <em>Guide</em></h1>
          <p className="a-subtitle">Manage the /gift-guide page — hero, recipients, price tiers, curated products &amp; closing banner</p>
        </div>
        <div className="a-head-actions">
          <a className="a-btn a-btn--ghost" href="/gift-guide" target="_blank" rel="noopener noreferrer">View Page</a>
          <button className="a-btn a-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`a-badge ${toast.err ? 'a-badge--danger' : 'a-badge--accent'}`} style={{ marginBottom: 20 }}>
          {toast.err ? <AlertCircle size={14} /> : <Sparkles size={14} />}
          {toast.msg}
        </div>
      )}

      <div className="a-stack">

        {/* ── HERO ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><LayoutTemplate size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Hero <em>Banner</em></div><div className="a-card-sub">Top of the page</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.hero.eyebrow} onChange={(e) => setHero('eyebrow', e.target.value)} placeholder="The Jewelry Gift Guide" /></div>
              <div className="a-field"><label className="a-label">Accent Word (italic)</label>
                <input className="a-input" value={cfg.hero.accent} onChange={(e) => setHero('accent', e.target.value)} placeholder="the Moment" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.hero.title} onChange={(e) => setHero('title', e.target.value)} placeholder="Gifts as Unforgettable as" /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle</label>
                <textarea className="a-textarea" value={cfg.hero.subtitle} onChange={(e) => setHero('subtitle', e.target.value)} /></div>

              <div className="a-field a-col-span-2">
                <label className="a-label">Hero Image</label>
                <div className="gg-a-media-row">
                  {cfg.hero.image
                    ? <img src={cfg.hero.image} className="gg-a-thumb" alt="" />
                    : <div className="gg-a-thumb gg-a-thumb--empty"><ImageIcon size={20} /></div>}
                  <div className="gg-a-media-body">
                    <input className="a-input" value={cfg.hero.image} onChange={(e) => setHero('image', e.target.value)} placeholder="Image URL" />
                    <input type="file" id="hero_up" hidden accept="image/*"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await uploadImage(f); if (u) setHero('image', u) } }} />
                    <button className="a-btn a-btn--subtle a-btn--sm" onClick={() => document.getElementById('hero_up')?.click()}>Upload Image</button>
                  </div>
                </div>
              </div>

              <div className="a-field"><label className="a-label">Primary Button Text</label>
                <input className="a-input" value={cfg.hero.primary_cta_text} onChange={(e) => setHero('primary_cta_text', e.target.value)} placeholder="Shop the Guide" /></div>
              <div className="a-field"><label className="a-label">Primary Button Link</label>
                <input className="a-input" value={cfg.hero.primary_cta_link} onChange={(e) => setHero('primary_cta_link', e.target.value)} placeholder="/collection" /></div>
              <div className="a-field"><label className="a-label">Secondary Button Text</label>
                <input className="a-input" value={cfg.hero.secondary_cta_text} onChange={(e) => setHero('secondary_cta_text', e.target.value)} placeholder="Gifts Under $100" /></div>
              <div className="a-field"><label className="a-label">Secondary Button Link</label>
                <input className="a-input" value={cfg.hero.secondary_cta_link} onChange={(e) => setHero('secondary_cta_link', e.target.value)} placeholder="#gifts-by-price" /></div>
            </div>
          </div>
        </div>

        {/* ── RECIPIENTS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Users size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Shop by <em>Recipient</em></div><div className="a-card-sub">Synced from Categories → “Show on recipient”</div></div>
            </div>
            <a className="a-btn a-btn--ghost a-btn--sm" href="/admin/categories" target="_blank" rel="noopener noreferrer">Manage Categories</a>
          </div>
          <div className="a-card-body">
            <div className="a-field" style={{ marginBottom: 18 }}>
              <label className="a-label">Section Title</label>
              <input className="a-input" value={cfg.recipients_title}
                onChange={(e) => setCfg((p) => ({ ...p, recipients_title: e.target.value }))} />
            </div>

            <p className="a-hint" style={{ marginBottom: 14 }}>
              These are the recipient categories from the Categories admin. Toggle each one to
              show or hide it on the Gift Guide — the same list also powers the recipient filter
              under “Gifts by Price”.
            </p>

            {recipientCats.length === 0 ? (
              <p className="a-hint">
                No recipient categories yet. In <strong>Categories</strong>, enable “Show on recipient”
                for the categories you want here (e.g. For Her, For Him).
              </p>
            ) : (
              <div className="a-stack">
                {recipientCats.map((c) => {
                  const shown = isRecipientShown(c.id)
                  return (
                    <div className="gg-a-list-item" key={c.id}>
                      <div className="gg-a-media-row">
                        {c.image_url
                          ? <img src={c.image_url} className="gg-a-thumb" alt="" />
                          : <div className="gg-a-thumb gg-a-thumb--empty"><ImageIcon size={18} /></div>}
                        <div className="gg-a-media-body" style={{ gap: 4 }}>
                          <strong style={{ fontSize: 14, color: 'var(--c-text)' }}>{c.name}</strong>
                          <span className="a-hint" style={{ margin: 0 }}>/collection/{c.slug}</span>
                        </div>
                        <label className="a-switch" title={shown ? 'Shown on Gift Guide' : 'Hidden from Gift Guide'}>
                          <input type="checkbox" checked={shown} onChange={() => toggleRecipientShown(c.id)} />
                          <span className="a-switch-slider" />
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── PRICE TIERS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><DollarSign size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Gifts by <em>Price</em></div><div className="a-card-sub">Products auto-filter by price when a tier is tapped</div></div>
            </div>
            <button className="a-btn a-btn--ghost a-btn--sm" onClick={addTier}><Plus size={14} /> Add Tier</button>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid" style={{ marginBottom: 18 }}>
              <div className="a-field"><label className="a-label">Section Title</label>
                <input className="a-input" value={cfg.price_title} onChange={(e) => setCfg((p) => ({ ...p, price_title: e.target.value }))} /></div>
              <div className="a-field"><label className="a-label">Section Subtitle</label>
                <input className="a-input" value={cfg.price_subtitle} onChange={(e) => setCfg((p) => ({ ...p, price_subtitle: e.target.value }))} /></div>
            </div>
            <div className="a-stack">
              {cfg.price_tiers.map((t, i) => (
                <div className="gg-a-list-item" key={i}>
                  <div className="a-row" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div className="a-field" style={{ flex: 1, minWidth: 120 }}><label className="a-label">Label</label>
                      <input className="a-input" value={t.label} onChange={(e) => updTier(i, 'label', e.target.value)} placeholder="$50" /></div>
                    <div className="a-field" style={{ flex: 1, minWidth: 120 }}><label className="a-label">Max Price (USD)</label>
                      <input className="a-input" type="number" value={t.max} onChange={(e) => updTier(i, 'max', Number(e.target.value))} placeholder="50" /></div>
                    <div className="a-field" style={{ minWidth: 90 }}><label className="a-label">Enabled</label>
                      <label className="a-switch" style={{ marginTop: 8 }}>
                        <input type="checkbox" checked={t.is_enabled} onChange={(e) => updTier(i, 'is_enabled', e.target.checked)} />
                        <span className="a-switch-slider" />
                      </label>
                    </div>
                    <button className="a-icon-btn a-icon-btn--danger" style={{ marginTop: 22 }} onClick={() => rmTier(i)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CURATED PRODUCTS ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Gift size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Curated <em>Products</em></div><div className="a-card-sub">Hand-pick the products shown in the For Her / For Him rows</div></div>
            </div>
          </div>
          <div className="a-card-body">
            {(['her', 'him'] as const).map((target) => {
              const ids = (target === 'her' ? cfg.her_product_ids : cfg.him_product_ids) || []
              const titleVal = target === 'her' ? cfg.her_title : cfg.him_title
              const titleKey = target === 'her' ? 'her_title' : 'him_title'
              return (
                <div key={target} style={{ marginBottom: target === 'her' ? 24 : 0 }}>
                  <div className="a-row a-row--between" style={{ marginBottom: 12 }}>
                    <input
                      className="a-input"
                      style={{ maxWidth: 260 }}
                      value={titleVal}
                      onChange={(e) => setCfg((p) => ({ ...p, [titleKey]: e.target.value } as GiftGuideConfig))}
                      placeholder={target === 'her' ? 'For Her' : 'For Him'}
                    />
                    <button className="a-btn a-btn--ghost a-btn--sm" onClick={() => { setPickerTarget(target); setPickerSearch(''); setPickerRecipient(guessRecipient(target)) }}>
                      <Plus size={14} /> Pick Products
                    </button>
                  </div>
                  {ids.length === 0 ? (
                    <p className="a-hint">No products selected yet.</p>
                  ) : (
                    <div className="gg-a-picks">
                      {ids.map((id) => {
                        const p = catalogById.get(String(id))
                        return (
                          <span className="gg-a-chip" key={id}>
                            {p?.image ? <img src={p.image} alt="" /> : <span className="gg-a-thumb gg-a-thumb--empty" style={{ width: 26, height: 26 }}><ImageIcon size={12} /></span>}
                            {p?.name || `#${String(id).slice(0, 8)}`}
                            <button onClick={() => removePick(target, String(id))} aria-label="Remove"><X size={13} /></button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SHOP BY CATEGORY (opt-in visibility per category) ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Tag size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Shop by <em>Category</em></div><div className="a-card-sub">Pick which site categories appear on the Gift Guide</div></div>
            </div>
            <a className="a-btn a-btn--ghost a-btn--sm" href="/admin/categories" target="_blank" rel="noopener noreferrer">Manage Categories</a>
          </div>
          <div className="a-card-body">
            <div className="a-field" style={{ marginBottom: 18 }}>
              <label className="a-label">Section Title</label>
              <input className="a-input" value={cfg.categories_title} onChange={(e) => setCfg((p) => ({ ...p, categories_title: e.target.value }))} />
            </div>

            <p className="a-hint" style={{ marginBottom: 14 }}>
              Every category from the Categories admin is listed here. Toggle the ones you want in
              the Gift Guide’s “Shop by Category” — nothing shows until you switch it on.{' '}
              <strong>{shownCatCount} shown.</strong>
            </p>

            {allCats.length === 0 ? (
              <p className="a-hint">No categories yet. Create some in the <strong>Categories</strong> admin first.</p>
            ) : (
              <>
                <div className="a-search" style={{ maxWidth: 'none', marginBottom: 14 }}>
                  <Search size={15} className="a-search-ico" />
                  <input className="a-search-input" placeholder="Search categories…" value={catSearch} onChange={(e) => setCatSearch(e.target.value)} />
                </div>
                <div className="a-stack">
                  {shopCatList.map((c) => {
                    const shown = isCategoryShown(c.id)
                    return (
                      <div className="gg-a-list-item" key={c.id}>
                        <div className="gg-a-media-row">
                          {c.image_url
                            ? <img src={c.image_url} className="gg-a-thumb" alt="" />
                            : <div className="gg-a-thumb gg-a-thumb--empty"><ImageIcon size={18} /></div>}
                          <div className="gg-a-media-body" style={{ gap: 4 }}>
                            <strong style={{ fontSize: 14, color: 'var(--c-text)' }}>{c.name}</strong>
                            <span className="a-hint" style={{ margin: 0 }}>/collection?category={c.slug}</span>
                          </div>
                          <label className="a-switch" title={shown ? 'Shown on Gift Guide' : 'Hidden from Gift Guide'}>
                            <input type="checkbox" checked={shown} onChange={() => toggleCategoryShown(c.id)} />
                            <span className="a-switch-slider" />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                  {shopCatList.length === 0 && (
                    <p className="a-hint">No categories match “{catSearch}”.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── CLOSING BANNER ── */}
        <div className="a-card">
          <div className="a-card-head">
            <div className="a-row" style={{ gap: 12 }}>
              <span className="a-stat-ico"><Megaphone size={16} strokeWidth={1.5} /></span>
              <div><div className="a-card-title">Closing <em>Banner</em></div><div className="a-card-sub">Call-to-action at the bottom</div></div>
            </div>
          </div>
          <div className="a-card-body">
            <div className="a-form-grid">
              <div className="a-field"><label className="a-label">Eyebrow</label>
                <input className="a-input" value={cfg.closing.eyebrow} onChange={(e) => setClosing('eyebrow', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Accent Word (italic)</label>
                <input className="a-input" value={cfg.closing.accent} onChange={(e) => setClosing('accent', e.target.value)} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Title</label>
                <input className="a-input" value={cfg.closing.title} onChange={(e) => setClosing('title', e.target.value)} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Subtitle</label>
                <textarea className="a-textarea" value={cfg.closing.subtitle} onChange={(e) => setClosing('subtitle', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Button Text</label>
                <input className="a-input" value={cfg.closing.cta_text} onChange={(e) => setClosing('cta_text', e.target.value)} /></div>
              <div className="a-field"><label className="a-label">Button Link</label>
                <input className="a-input" value={cfg.closing.cta_link} onChange={(e) => setClosing('cta_link', e.target.value)} /></div>
              <div className="a-field a-col-span-2"><label className="a-label">Banner Theme</label>
                <select className="a-select" value={cfg.closing.theme} onChange={(e) => setClosing('theme', e.target.value)}>
                  <option value="accent">Taupe (accent)</option>
                  <option value="dark">Deep Brown (dark)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── PRODUCT PICKER MODAL ── */}
      {pickerTarget && (
        <div className="a-modal-overlay" onClick={() => setPickerTarget(null)}>
          <div className="a-modal gg-a-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="a-modal-head">
              <div className="a-row a-row--between">
                <h3 className="a-modal-title">Pick <em>{pickerTarget === 'her' ? 'For Her' : 'For Him'}</em> Products</h3>
                <button className="a-icon-btn a-icon-btn--sm" onClick={() => setPickerTarget(null)}><X size={14} /></button>
              </div>
            </div>
            <div className="a-modal-body">
              <div className="a-search" style={{ maxWidth: 'none', marginBottom: 14 }}>
                <Search size={15} className="a-search-ico" />
                <input className="a-search-input" placeholder="Search products…" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} autoFocus />
              </div>
              {recipientCats.length > 0 && (
                <div className="gg-a-rfilter">
                  <button
                    type="button"
                    className={`gg-a-rpill ${pickerRecipient === null ? 'is-active' : ''}`}
                    onClick={() => setPickerRecipient(null)}
                  >
                    All
                  </button>
                  {recipientCats.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`gg-a-rpill ${pickerRecipient === c.id ? 'is-active' : ''}`}
                      onClick={() => setPickerRecipient(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="gg-a-modal-list">
                {filteredCatalog.length === 0 && (
                  <p className="a-hint">
                    {pickerRecipient ? 'No products in this recipient’s categories yet.' : 'No products found.'}
                  </p>
                )}
                {filteredCatalog.map((p) => {
                  const picked = currentPicks.includes(p.id)
                  return (
                    <button key={p.id} className={`gg-a-prow ${picked ? 'is-picked' : ''}`} onClick={() => togglePick(p.id)}>
                      {p.image ? <img src={p.image} alt="" /> : <div className="gg-a-thumb gg-a-thumb--empty" style={{ width: 44, height: 44 }}><ImageIcon size={16} /></div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="gg-a-prow-name">{p.name}</div>
                        <div className="gg-a-prow-price">${p.price.toFixed(2)}</div>
                      </div>
                      {picked ? <span className="a-badge a-badge--accent">Selected</span> : <Plus size={16} style={{ color: 'var(--c-text-muted)' }} />}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="a-modal-foot">
              <span className="a-hint" style={{ marginRight: 'auto' }}>{currentPicks.length} selected</span>
              <button className="a-btn a-btn--primary" onClick={() => setPickerTarget(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
