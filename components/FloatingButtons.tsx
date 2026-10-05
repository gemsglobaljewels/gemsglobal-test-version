'use client'

/* ────────────────────────────────────────────────────────────────
   FloatingButtons
   The floating WhatsApp FAB has been retired — WhatsApp now lives as
   a premium control inside the header, and the concierge chat is
   reached from the header / bottom-nav "Chat" affordance.
   This component now only carries the guard CSS that suppresses any
   stray third-party "scroll / back to top" widgets, which is still
   load-bearing across the storefront.
   ──────────────────────────────────────────────────────────────── */

const CSS = `
/* ══ KILL — other scroll-to-top / back-to-top buttons only ═══════
   NOTE: must NOT use a bare [class*="scroll"] selector — it
   substring-matches "scrolled" (e.g. the header's compact/scrolled
   state class) and Radix "scroll-area", display:none-ing real UI.
   Keep these patterns specific to back-to-top widgets. */
*[class*="scroll-top"]:not(.fab-top-wrap):not(.fab-top-btn),
*[class*="scroll-to-top"]:not(.fab-top-wrap):not(.fab-top-btn),
*[class*="ScrollTop"]:not(.fab-top-wrap):not(.fab-top-btn),
*[class*="scrollTop"]:not(.fab-top-wrap):not(.fab-top-btn),
*[class*="ScrollToTop"]:not(.fab-top-wrap):not(.fab-top-btn),
*[class*="back-to-top"],
*[class*="backToTop"],
*[class*="BackToTop"],
*[id*="scrollTop"],
*[id*="scroll-top"],
*[id*="backToTop"],
*[id*="back-to-top"],
button[aria-label="Scroll to top"],
button[aria-label="scroll to top"],
button[aria-label="Back to Top"],
button[aria-label="back to top"],
button[aria-label="Go to top"],
button[aria-label="go to top"] {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
`

export default function FloatingButtons() {
  return <style>{CSS}</style>
}
