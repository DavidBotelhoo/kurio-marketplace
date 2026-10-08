/** Average rating as in the Figma file ("4.8"). */
export function formatRating(average: number) {
  return average.toFixed(1)
}

export function reviewsLabel(count: number) {
  return `${String(count)} ${count === 1 ? 'avaliação' : 'avaliações'}`
}
