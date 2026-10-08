import { normalizeEth } from '@/lib/eth'

/**
 * Display form of an ETH amount: exact digits, at least two decimals
 * ("1.19", "12.30", "26.846"). The dot separator follows the Figma prices.
 */
export function formatEthAmount(amount: string) {
  return normalizeEth(amount, 2)
}

export function formatEth(amount: string) {
  return `${formatEthAmount(amount)} ETH`
}
