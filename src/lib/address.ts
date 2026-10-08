/** Short wallet or contract address: "0x7A42...19E8" (detail) or "0xA91F…E82C". */
export function shortAddress(address: string, separator = '...') {
  const hex = address.replace(/^0x/i, '').toUpperCase()
  return `0x${hex.slice(0, 4)}${separator}${hex.slice(-4)}`
}
