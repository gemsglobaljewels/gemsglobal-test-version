'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, trackClick, savePageSession, savePageSessionBeacon } from '@/lib/analytics'

export default function AnalyticsTracker() {
  const pathname = usePathname()
  const startTimeRef = useRef<number>(0)
  const currentPathRef = useRef<string>('')
  const currentTitleRef = useRef<string>('')
  const hasSentRef = useRef<boolean>(false)
  // Guards against duplicate page_view events for the same path — e.g. React
  // Strict Mode double-mounting the effect in dev, or an effect re-run that
  // didn't actually change the path. Each unique path fires exactly one event.
  const lastTrackedPathRef = useRef<string>('')

  // Check if current path is admin
  const isAdmin = pathname?.startsWith('/admin') ?? false

  // Save the duration for the PREVIOUS page via regular fetch (SPA navigation)
  const savePreviousPageDuration = useCallback(() => {
    if (hasSentRef.current) return
    if (!currentPathRef.current || currentPathRef.current.startsWith('/admin')) return

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    if (elapsed >= 2 && elapsed < 43200) {
      hasSentRef.current = true
      savePageSession(currentPathRef.current, currentTitleRef.current, elapsed)
    }
  }, [])

  // Save via beacon (for page unload — most reliable on actual page close)
  const savePreviousPageBeacon = useCallback(() => {
    if (hasSentRef.current) return
    if (!currentPathRef.current || currentPathRef.current.startsWith('/admin')) return

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    if (elapsed >= 2 && elapsed < 43200) {
      hasSentRef.current = true
      savePageSessionBeacon(currentPathRef.current, currentTitleRef.current, elapsed)
    }
  }, [])

  // Track page views and manage duration per page
  useEffect(() => {
    if (isAdmin) return

    const newPath = pathname || '/'

    // Skip if this exact path was already tracked (Strict Mode double-mount or
    // a no-op effect re-run) — prevents duplicate page_view events / egress.
    if (lastTrackedPathRef.current === newPath) return

    // Save duration for the PREVIOUS page before setting up the new one
    savePreviousPageDuration()

    // Set up tracking for the NEW page
    startTimeRef.current = Date.now()
    currentPathRef.current = newPath
    currentTitleRef.current = document.title || ''
    hasSentRef.current = false
    lastTrackedPathRef.current = newPath

    // Track page view for the new page
    trackPageView(newPath, document.title)

    // Update title after a short delay (Next.js may update it after render)
    const titleTimer = setTimeout(() => {
      currentTitleRef.current = document.title || ''
    }, 500)

    return () => {
      clearTimeout(titleTimer)
    }
  }, [pathname, isAdmin, savePreviousPageDuration])

  // Handle page unload and visibility change — these MUST use beacon
  useEffect(() => {
    if (isAdmin) return

    function handleBeforeUnload() {
      savePreviousPageBeacon()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        savePreviousPageBeacon()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAdmin, savePreviousPageBeacon])

  // Track clicks (non-admin only)
  useEffect(() => {
    if (isAdmin) return

    function onClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName?.toLowerCase() || ''
      const text = (t?.textContent || '').trim().slice(0, 64)
      const id = t?.id ? `#${t.id}` : ''
      const cls = t?.className ? `.${String(t.className).split(' ').join('.')}` : ''
      const target = `${tag}${id}${cls} ${text}`
      trackClick(pathname || '/', target)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true } as any)
  }, [pathname, isAdmin])

  return null
}
