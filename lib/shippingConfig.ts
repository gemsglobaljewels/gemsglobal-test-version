/**
 * Checkout delivery methods — editable in Admin → Site Settings → Shipping.
 *
 * Stored as plain rows in `site_settings` (key/value, values are strings), so
 * no migration is needed and every key has a sensible default until the admin
 * saves the tab for the first time.
 *
 * Defaults match the brief: standard 10–20 days at $30, express 5–8 days at
 * $50.
 */

export type ShippingCfg = {
  /** Standard method: delivery time in days, and the price in USD. */
  stdMin: number
  stdMax: number
  stdPrice: number
  /** Express method: delivery time in days, and the price in USD. */
  expMin: number
  expMax: number
  expPrice: number
}

export const SHIPPING_DEFAULTS: ShippingCfg = {
  stdMin: 10,
  stdMax: 20,
  stdPrice: 30,
  expMin: 5,
  expMax: 8,
  expPrice: 50,
}

export const SHIPPING_KEYS = {
  stdMin: 'shipping_standard_min_days',
  stdMax: 'shipping_standard_max_days',
  stdPrice: 'shipping_standard_price',
  expMin: 'shipping_express_min_days',
  expMax: 'shipping_express_max_days',
  expPrice: 'shipping_express_price',
} as const

const num = (v: unknown, fallback: number): number => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

/** Settings object (or anything) → a fully populated config. */
export function readShippingCfg(s?: Record<string, any> | null): ShippingCfg {
  return {
    stdMin: num(s?.[SHIPPING_KEYS.stdMin], SHIPPING_DEFAULTS.stdMin),
    stdMax: num(s?.[SHIPPING_KEYS.stdMax], SHIPPING_DEFAULTS.stdMax),
    stdPrice: num(s?.[SHIPPING_KEYS.stdPrice], SHIPPING_DEFAULTS.stdPrice),
    expMin: num(s?.[SHIPPING_KEYS.expMin], SHIPPING_DEFAULTS.expMin),
    expMax: num(s?.[SHIPPING_KEYS.expMax], SHIPPING_DEFAULTS.expMax),
    expPrice: num(s?.[SHIPPING_KEYS.expPrice], SHIPPING_DEFAULTS.expPrice),
  }
}

/** `10–20 Days` */
export const daysLabel = (min: number, max: number): string => `${min}–${max} Days`
