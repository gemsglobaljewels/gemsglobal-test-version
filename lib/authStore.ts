// Auth Store for managing user login state
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatarUrl?: string | null
  createdAt: string
}

const STORAGE_KEY = 'auth_user'
const SESSIONS_KEY = 'user_sessions'

export function saveUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    window.dispatchEvent(new CustomEvent('user-updated', { detail: { user } }))
  }
}

export function getUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export function clearUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CART_KEY)
    localStorage.removeItem(WISHLIST_KEY)
    window.dispatchEvent(new CustomEvent('user-updated', { detail: { user: null } }))
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: 0 } }));
    window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { count: 0 } }));
  }
}

export function isLoggedIn(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(STORAGE_KEY)
  }
  return false
}

// Cart management
export interface CartItem {
  id?: string
  productId: string
  slug?: string
  productName: string
  price: number
  quantity: number
  size?: string
  metal?: string
  carat?: string
  image?: string
}

const CART_KEY = 'shopping_cart'

export function getCart(): CartItem[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  }
  return []
}

export function addToCart(item: CartItem) {
  if (typeof window !== 'undefined') {
    // 1. Generate unique ID for this cart entry
    const cartItemId = `${item.productId}-${item.metal || 'none'}-${item.carat || 'none'}-${item.size || 'none'}`
    const newItem = { ...item, id: cartItemId }

    // 2. Optimistically update local storage
    const cart = getCart()
    const existingIndex = cart.findIndex(i => i.id === cartItemId)

    if (existingIndex > -1) {
      cart[existingIndex].quantity += item.quantity
    } else {
      cart.push(newItem)
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart))

    // 3. Dispatch event immediately for instant UI update
    try {
      const totalQty = cart.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalQty } }))
    } catch { }

    // 4. Async stock check (background)
    (async () => {
      try {
        const res = await fetch(`/api/stock-check?productId=${item.productId}`)
        if (res.ok) {
          const product = await res.json()
          const stock = Number(product.stock_quantity ?? 0)

          const currentCart = getCart()
          const itemInCart = currentCart.find(i => i.id === cartItemId)

          if (itemInCart && itemInCart.quantity > stock) {
            // If stock is insufficient, adjust cart and notify user
            itemInCart.quantity = stock
            localStorage.setItem(CART_KEY, JSON.stringify(currentCart))
            const totalQty = currentCart.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
            window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalQty } }))
            window.dispatchEvent(new CustomEvent('cart-stock-error', {
              detail: { message: `Adjusted quantity to ${stock} (max available stock).` }
            }))
          }
        }
      } catch (e) {
        console.error('[Cart] Background stock check failed:', e)
      }
    })()
  }
}

export function removeFromCart(cartItemId: string) {
  if (typeof window !== 'undefined') {
    const cart = getCart().filter(item => item.id !== cartItemId)
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
    try {
      const totalQty = cart.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalQty } }))
    } catch { }
  }
}

export function updateCartQuantity(cartItemId: string, quantity: number) {
  if (typeof window !== 'undefined') {
    const cart = getCart()
    const item = cart.find(i => i.id === cartItemId)
    if (item) {
      item.quantity = quantity
      localStorage.setItem(CART_KEY, JSON.stringify(cart))
      try {
        const totalQty = cart.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalQty } }))
      } catch { }
    }
  }
}

export function clearCart() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CART_KEY)
    window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: 0 } }))
  }
}

// ─── Site Settings ──────────────────────────────────────────────────────────

export interface SiteSettings {
  logo_text: string
  logo_em: string
  logo_url: string
  favicon_url: string
  site_name: string
  site_title: string
  site_description: string
  site_keywords: string
  whatsapp_number: string
  contact_email: string
  india_contact: string
  canada_contact: string
  india_address: string
  canada_address: string
  instagram_url: string
  youtube_url: string
  pinterest_url: string
  etsy_url: string
  payment_logos: string // JSON array of image URLs
}

const SETTINGS_KEY = 'site_settings'

export function getSettings(): SiteSettings | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export function saveSettings(settings: SiteSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('settings-updated', { detail: { settings } }))
  }
}

// Module-level cache + in-flight dedup for site settings.
// Multiple shared components (Header, Footer, HeaderMegaMenu) call
// fetchAndSyncSettings() on every mount / navigation. Without this guard each
// call hit /api/settings (Supabase site_settings) separately. We now serve a
// recently-fetched result and collapse concurrent calls into a single request.
let settingsLastFetch = 0
let settingsInFlight: Promise<SiteSettings | null> | null = null
const SETTINGS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchAndSyncSettings(): Promise<SiteSettings | null> {
  const now = Date.now()

  // Serve cached settings if fetched recently (still dispatches via saveSettings
  // on the original fetch, so listeners stay in sync).
  if (settingsLastFetch && now - settingsLastFetch < SETTINGS_CACHE_DURATION) {
    return getSettings()
  }

  // Collapse concurrent callers (e.g. Footer + HeaderMegaMenu mounting together)
  // into one network request.
  if (settingsInFlight) return settingsInFlight

  settingsInFlight = (async () => {
    try {
      // Always fetch fresh data from server
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        saveSettings(data)
        settingsLastFetch = Date.now()
        return data
      }
    } catch (err) {
      console.error('Failed to sync settings:', err)
    } finally {
      settingsInFlight = null
    }

    // Fallback to localStorage if server fails
    return getSettings()
  })()

  return settingsInFlight
}

export function getCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const tax = subtotal * 0.08; // 8% tax
  const shipping = 0; // Free shipping by default (express fee handled at checkout)
  const total = subtotal + tax + shipping;

  return {
    subtotal,
    tax,
    shipping,
    total,
    itemCount: cart.reduce((sum, item) => sum + (item.quantity ?? 0), 0),
  };
}

type WishlistItem = {
  slug: string
  name: string
  price: number
  image?: string
}

const WISHLIST_KEY = 'user_wishlist'

export function getWishlist(): WishlistItem[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(WISHLIST_KEY)
    return stored ? JSON.parse(stored) : []
  }
  return []
}

export function addToWishlist(item: WishlistItem) {
  if (typeof window !== 'undefined') {
    const list = getWishlist()
    const exists = list.some(i => i.slug === item.slug)
    if (!exists) {
      list.push(item)
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
      try {
        window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { count: list.length } }))
      } catch { }
    }
  }
}

export function removeFromWishlist(slug: string) {
  if (typeof window !== 'undefined') {
    const list = getWishlist().filter(i => i.slug !== slug)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
    try {
      window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { count: list.length } }))
    } catch { }
  }
}

export function isInWishlist(slug: string): boolean {
  if (typeof window !== 'undefined') {
    return getWishlist().some(i => i.slug === slug)
  }
  return false
}

// Currency management
export type Currency = 'USD' | 'INR'
const CURRENCY_KEY = 'user_currency'

let exchangeRateData: { rate: number, lastFetch: number } | null = null;
const RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
let isFetchingRate = false;
let ratePromise: Promise<number> | null = null;

async function getExchangeRate(): Promise<number> {
  const now = Date.now();

  if (exchangeRateData && (now - exchangeRateData.lastFetch < RATE_CACHE_DURATION)) {
    return exchangeRateData.rate;
  }

  if (ratePromise) return ratePromise;

  ratePromise = (async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) {
        return exchangeRateData?.rate || 93;
      }
      const data = await response.json();
      const rate = data.rate;

      if (typeof rate !== 'number') {
        return exchangeRateData?.rate || 93;
      }

      exchangeRateData = { rate: rate, lastFetch: Date.now() };
      return rate;
    } catch (error) {
      console.error("Failed to fetch live exchange rate:", error);
      return exchangeRateData?.rate || 93;
    } finally {
      ratePromise = null;
    }
  })();

  return ratePromise;
}

export function getCurrency(): Currency {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CURRENCY_KEY)
    return (stored as Currency) || 'USD'
  }
  return 'USD'
}

export function setCurrency(currency: Currency) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENCY_KEY, currency)
    window.dispatchEvent(new CustomEvent('currency-updated', { detail: { currency } }))
  }
}

export async function formatPrice(price: number, currency?: Currency, isAlreadyConverted?: boolean): Promise<string> {
  const curr = currency || getCurrency();
  let convertedPrice = price;

  // If isAlreadyConverted is not provided, we assume the input is USD and needs conversion to INR
  const needsConversion = curr === 'INR' && !isAlreadyConverted;

  if (needsConversion) {
    const rate = await getExchangeRate();
    convertedPrice = price * rate;
  }

  return new Intl.NumberFormat(curr === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: curr === 'INR' ? 0 : 2,
    maximumFractionDigits: curr === 'INR' ? 0 : 2,
  }).format(convertedPrice);
}

export async function convertToDisplayPrice(price: number, isAlreadyConverted?: boolean): Promise<number> {
  const curr = getCurrency()
  const needsConversion = curr === 'INR' && !isAlreadyConverted;

  if (needsConversion) {
    const rate = await getExchangeRate();
    return price * rate;
  }
  return price
}

/**
 * Convert an amount that is denominated in a KNOWN source currency into a
 * target currency. Unlike formatPrice/convertToDisplayPrice (which assume the
 * input is USD and only ever convert USD→INR), this handles both directions.
 *
 * Needed for records that carry their own fixed currency — e.g. an order whose
 * total_price is stored in the currency chosen at checkout — so they can be
 * re-displayed in whatever currency the user is currently viewing.
 */
export async function convertCurrency(amount: number, from: Currency, to: Currency): Promise<number> {
  if (from === to) return amount
  const rate = await getExchangeRate() // USD → INR
  // rate is USD→INR, so INR→USD divides by it.
  return from === 'USD' ? amount * rate : amount / rate
}

/**
 * Format an amount denominated in `from` currency, displayed in the user's
 * currently-selected currency (converting across currencies as needed).
 */
export async function formatFromCurrency(amount: number, from: Currency): Promise<string> {
  const to = getCurrency()
  const converted = await convertCurrency(amount, from, to)
  return new Intl.NumberFormat(to === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: to,
    minimumFractionDigits: to === 'INR' ? 0 : 2,
    maximumFractionDigits: to === 'INR' ? 0 : 2,
  }).format(converted)
}

// Recently Viewed management
export interface RecentlyViewedItem {
  id: string
  slug: string
  name: string
  price: number
  image?: string
  category?: string
  rating?: number
  reviews?: number
}

const RECENTLY_VIEWED_KEY = 'recently_viewed_products'
const MAX_RECENT_ITEMS = 10

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
    return stored ? JSON.parse(stored) : []
  }
  return []
}

export function addToRecentlyViewed(item: RecentlyViewedItem) {
  if (typeof window !== 'undefined') {
    let list = getRecentlyViewed()
    // Remove if already exists to move it to the front
    list = list.filter(i => i.slug !== item.slug)
    // Add to the front
    list.unshift(item)
    // Limit to max items
    list = list.slice(0, MAX_RECENT_ITEMS)

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('recently-viewed-updated', { detail: { count: list.length } }))
  }
}

