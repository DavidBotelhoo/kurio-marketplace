import type { CouponRecord } from '../db/schema'

/**
 * Promo codes. LANCAMENTO10 is the Figma "Desconto do lançamento"; KURIO5 a
 * fixed amount; BLACKFRIDAY25 is already expired (expired-coupon scenario).
 */
export const COUPONS: readonly CouponRecord[] = [
  {
    code: 'LANCAMENTO10',
    label: 'Desconto do lançamento',
    discount: { kind: 'percent', basisPoints: 1000 },
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'KURIO5',
    label: 'Cupom de boas-vindas',
    discount: { kind: 'amount', eth: '0.05' },
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'BLACKFRIDAY25',
    label: 'Black Friday',
    discount: { kind: 'percent', basisPoints: 2500 },
    expiresAt: '2025-11-30T23:59:59.000Z',
  },
]

/** Estimated fee per network transaction (one per network in the cart). */
export const NETWORK_FEES_ETH = {
  ethereum: '0.016',
  polygon: '0.002',
  solana: '0.0005',
} as const
