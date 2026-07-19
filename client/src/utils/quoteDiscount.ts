import type { QuoteLineItemInput } from '../types/quote'

export type QuoteDiscountType = 'percent' | 'flat'

const DISCOUNT_PREFIX = 'Discount'

export function isDiscountLineItem(description: string): boolean {
  return description.trim().toLowerCase().startsWith(discountPrefixLower())
}

function discountPrefixLower(): string {
  return DISCOUNT_PREFIX.toLowerCase()
}

export function stripDiscountLineItems<T extends { description: string }>(items: T[]): T[] {
  return items.filter((item) => !isDiscountLineItem(item.description))
}

export function lineItemsSubtotal(
  items: Array<{ description: string; quantity: number; unitPrice: number }>
): number {
  return stripDiscountLineItems(items).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
}

/** Apply a quote-time discount as a negative line item. Replaces any prior Discount lines. */
export function applyQuoteDiscount(
  items: QuoteLineItemInput[],
  type: QuoteDiscountType,
  value: number
): QuoteLineItemInput[] {
  const base = stripDiscountLineItems(items)
  if (!Number.isFinite(value) || value <= 0) {
    return base
  }

  const subtotal = lineItemsSubtotal(base)
  if (subtotal <= 0) {
    return base
  }

  let discountAmount = 0
  let description = DISCOUNT_PREFIX

  if (type === 'percent') {
    const pct = Math.min(value, 100)
    discountAmount = Math.round(subtotal * (pct / 100) * 100) / 100
    description = `Discount (${pct}%)`
  } else {
    discountAmount = Math.min(value, subtotal)
    description = `Discount ($${discountAmount.toFixed(2)})`
  }

  if (discountAmount <= 0) {
    return base
  }

  return [
    ...base,
    {
      description,
      quantity: 1,
      unitPrice: -discountAmount,
    },
  ]
}
