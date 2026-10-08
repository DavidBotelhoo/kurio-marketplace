export type PageItem = number | 'gap-start' | 'gap-end'

/** 1 … 4 5 6 … 12 for long lists; every page when there are few. */
export function pageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)
  const items: PageItem[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('gap-start')
  for (let page = start; page <= end; page++) items.push(page)
  if (end < total - 1) items.push('gap-end')
  items.push(total)
  return items
}
