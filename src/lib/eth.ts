/**
 * Exact decimal arithmetic for ETH amounts.
 *
 * Amounts travel as decimal strings ("26.846") and are converted to integer
 * base units (18 decimals, like wei) for any calculation, so no binary
 * floating point is ever involved. Shared by the client and the mock API.
 */
export const ETH_DECIMALS = 18
const SCALE = 10n ** BigInt(ETH_DECIMALS)
const DECIMAL_PATTERN = /^(\d+)(?:\.(\d{1,18}))?$/

export type EthUnits = bigint

export function isEthAmount(value: string) {
  return DECIMAL_PATTERN.test(value)
}

/** "1.19" → 1190000000000000000n */
export function parseEth(value: string): EthUnits {
  const match = DECIMAL_PATTERN.exec(value)
  if (!match) throw new Error(`Invalid ETH amount: "${value}"`)
  const [, whole = '0', fraction = ''] = match
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

/**
 * Canonical decimal string without trailing zeros, keeping at least
 * `minFractionDigits` digits: 1190000000000000000n → "1.19".
 */
export function formatEth(units: EthUnits, minFractionDigits = 0): string {
  if (units < 0n) return `-${formatEth(-units, minFractionDigits)}`
  const whole = units / SCALE
  const fraction = (units % SCALE)
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .replace(/0+$/, '')
    .padEnd(minFractionDigits, '0')
  return fraction ? `${whole.toString()}.${fraction}` : whole.toString()
}

/** Normalizes a decimal string ("1.190" → "1.19"). */
export function normalizeEth(value: string, minFractionDigits = 0) {
  return formatEth(parseEth(value), minFractionDigits)
}

export function addEth(...values: string[]) {
  return formatEth(values.reduce((sum, value) => sum + parseEth(value), 0n))
}

export function subtractEth(a: string, b: string) {
  return formatEth(parseEth(a) - parseEth(b))
}

/** Multiplies by an integer quantity. */
export function multiplyEth(value: string, quantity: number) {
  if (!Number.isInteger(quantity))
    throw new Error('Quantity must be an integer')
  return formatEth(parseEth(value) * BigInt(quantity))
}

/**
 * Applies a ratio in basis points (10000 = 100%), rounding half up to the
 * last base unit: scaleEth("1.19", 15000) → "1.785".
 */
export function scaleEth(value: string, basisPoints: number) {
  if (!Number.isInteger(basisPoints))
    throw new Error('Basis points must be an integer')
  const scaled = parseEth(value) * BigInt(basisPoints)
  return formatEth((scaled + 5000n) / 10000n)
}

export function compareEth(a: string, b: string) {
  const diff = parseEth(a) - parseEth(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}
