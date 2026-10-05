'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import HeaderMegaMenu from '@/components/HeaderMegaMenu'
import { Footer } from '@/components/footer'

/**
 * Legacy route: /product/:id
 * Canonical PDP is /products/:slug. This page never renders mock data —
 * it resolves the id (UUID or slug) via /api/products/[id] and redirects
 * to the canonical page. This fixes cart/old links landing on a fake
 * "$12 Emerald Cut" product.
 */
export default function LegacyProductRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!id) {
      setFailed(true)
      return
    }
    let cancelled = false
    async function resolve() {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setFailed(true)
          return
        }
        const p = await res.json().catch(() => null)
        const slug = String(p?.slug || '').trim()
        if (slug) {
          router.replace(`/products/${encodeURIComponent(slug)}`)
        } else if (!cancelled) {
          setFailed(true)
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    resolve()
    return () => {
      cancelled = true
    }
  }, [id, router])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderMegaMenu />
      <main className="flex-grow flex items-center justify-center px-6 py-24">
        {!failed ? (
          <p className="text-foreground/60">Taking you to the right piece…</p>
        ) : (
          <div className="text-center max-w-md">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-3">Piece unavailable</p>
            <h1 className="font-serif text-3xl font-bold text-primary mb-3">We couldn&apos;t find that jewel</h1>
            <p className="text-foreground/70 mb-6">
              The link you followed doesn&apos;t match any piece in the current collection. It may have sold or been renamed.
            </p>
            <Link
              href="/collection"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white text-xs font-semibold tracking-[0.2em] uppercase rounded"
            >
              Explore the Collection
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
