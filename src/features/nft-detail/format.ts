/** Average rating as in the Figma file ("4.8"). */
export function formatRating(average: number) {
  return average.toFixed(1)
}

/** Short contract address ("0x7A42...19E8"). */
export function shortAddress(address: string) {
  const hex = address.replace(/^0x/i, '').toUpperCase()
  return `0x${hex.slice(0, 4)}...${hex.slice(-4)}`
}

export function reviewsLabel(count: number) {
  return `${String(count)} ${count === 1 ? 'avaliação' : 'avaliações'}`
}
