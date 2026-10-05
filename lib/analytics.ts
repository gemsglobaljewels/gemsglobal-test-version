// Check if path is an admin path
function isAdminPath(path: string): boolean {
  return path.startsWith('/admin')
}

export function getSessionId() {
  if (typeof window === 'undefined') return ''
  const key = 'analytics_session_id'
  // Use sessionStorage — rotates per browser session for accurate session tracking
  let id = sessionStorage.getItem(key) || ''
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

export async function trackPageView(path: string, title?: string) {
  if (isAdminPath(path)) return
  try {
    const sessionId = getSessionId()
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        path,
        title: title || document.title || '',
        sessionId,
      }),
    })
  } catch { }
}

export async function trackClick(path: string, target?: string) {
  if (isAdminPath(path)) return
  try {
    const sessionId = getSessionId()
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'click',
        path,
        target: target || '',
        sessionId,
      }),
    })
  } catch { }
}

/**
 * Save page session duration via regular fetch (for SPA navigation)
 */
export async function savePageSession(path: string, title: string, durationSeconds: number) {
  if (isAdminPath(path)) return
  const seconds = Math.round(durationSeconds)
  if (seconds < 1) return
  try {
    const sessionId = getSessionId()
    await fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, path, title, durationSeconds: seconds }),
    })
  } catch { }
}

/**
 * Save page session duration via sendBeacon (for beforeunload/visibilitychange)
 * sendBeacon is the only reliable way to send data when the page is being unloaded
 */
export function savePageSessionBeacon(path: string, title: string, durationSeconds: number) {
  if (isAdminPath(path)) return
  const seconds = Math.round(durationSeconds)
  if (seconds < 1) return
  try {
    const sessionId = getSessionId()
    const payload = JSON.stringify({ sessionId, path, title, durationSeconds: seconds })
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/session', blob)
    } else {
      fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => { })
    }
  } catch { }
}
