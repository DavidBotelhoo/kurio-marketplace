const parts = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/** Receipt date as in the Figma file: "29 Jul, 2026". */
export function formatReceiptDate(iso: string) {
  const values = Object.fromEntries(
    parts.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  )
  const month = (values.month ?? '').replace('.', '')
  return `${values.day ?? ''} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${values.year ?? ''}`
}

/** Short order reference ("#ABA04024"). */
export function orderNumber(orderId: string) {
  return `#${orderId.replace(/^ord_/, '').slice(0, 8).toUpperCase()}`
}
