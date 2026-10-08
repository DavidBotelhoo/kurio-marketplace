import { NETWORKS, type NetworkId } from '@/contracts/catalog-taxonomy'
import type { Wallet } from '@/contracts/wallets'
import { shortAddress } from '@/lib/address'

export function networkLabel(network: NetworkId) {
  return NETWORKS.find((item) => item.id === network)?.label ?? network
}

/** Mobile wallet card line ("Rede principal Ethereum", "Rede Polygon"). */
export function networkLine(network: NetworkId) {
  const label = networkLabel(network)
  return network === 'ethereum' ? `Rede principal ${label}` : `Rede ${label}`
}

/** ENS or secondary address when present, otherwise the short address. */
export function walletAlias(wallet: Wallet) {
  return wallet.secondaryAddress ?? shortAddress(wallet.address, '…')
}
