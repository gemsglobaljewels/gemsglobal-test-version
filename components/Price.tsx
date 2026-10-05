'use client';

import { useState, useEffect, memo } from "react";
import { formatPrice, getCurrency, convertToDisplayPrice, formatFromCurrency, type Currency } from "@/lib/authStore";

let priceCache: Map<string, string> = new Map();
let pendingPromise: Promise<string> | null = null;
let pendingKey: string = '';

async function computePrice(value: number, qty: number | undefined, isAlreadyConverted: boolean | undefined): Promise<string> {
  const cacheKey = `${value}-${qty}-${isAlreadyConverted}-${getCurrency()}`;

  if (priceCache.has(cacheKey)) {
    return priceCache.get(cacheKey)!;
  }

  if (pendingPromise && pendingKey === cacheKey) {
    return pendingPromise;
  }

  const promise = (async () => {
    try {
      const currency = getCurrency();
      let result: string;

      if (qty && qty > 1 && currency === 'INR') {
        const unitInr = await convertToDisplayPrice(value, isAlreadyConverted);
        const unitRounded = Math.round(unitInr);
        const lineTotal = unitRounded * qty;
        result = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(lineTotal);
      } else {
        result = await formatPrice(qty && qty > 1 ? value * qty : value, undefined, isAlreadyConverted);
      }

      priceCache.set(cacheKey, result);
      return result;
    } finally {
      if (pendingKey === cacheKey) {
        pendingPromise = null;
        pendingKey = '';
      }
    }
  })();

  pendingPromise = promise;
  pendingKey = cacheKey;
  return promise;
}

export const Price = memo(function Price({ value, qty, isAlreadyConverted, className }: { value: number; qty?: number; isAlreadyConverted?: boolean; className?: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    let alive = true;
    computePrice(value, qty, isAlreadyConverted).then(result => {
      if (alive) setFormatted(result);
    });
    return () => { alive = false; };
  }, [value, qty, isAlreadyConverted]);

  useEffect(() => {
    const handler = () => {
      priceCache.clear();
      computePrice(value, qty, isAlreadyConverted).then(result => setFormatted(result));
    };
    window.addEventListener("currency-updated", handler);
    return () => window.removeEventListener("currency-updated", handler);
  }, [value, qty, isAlreadyConverted]);

  return <span className={className}>{formatted}</span>;
});

/**
 * Renders a monetary amount that is stored in a KNOWN, fixed source currency
 * (e.g. an order's total_price in the currency chosen at checkout), converting
 * it into the currency the user is currently viewing. Use this instead of
 * <Price> whenever the value's own currency is known and may differ from the
 * display currency — <Price> assumes a USD base and cannot convert INR→USD.
 */
export const PriceFrom = memo(function PriceFrom({ value, from, className }: { value: number; from: Currency; className?: string }) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    let alive = true;
    formatFromCurrency(value, from).then(result => { if (alive) setFormatted(result); });
    return () => { alive = false; };
  }, [value, from]);

  useEffect(() => {
    const handler = () => { formatFromCurrency(value, from).then(setFormatted); };
    window.addEventListener("currency-updated", handler);
    return () => window.removeEventListener("currency-updated", handler);
  }, [value, from]);

  return <span className={className}>{formatted}</span>;
});
