/** Accessible name of the cart links ("Carrinho, 3 itens"). */
export function cartLabel(count: number) {
  if (count === 0) return 'Carrinho'
  return `Carrinho, ${String(count)} ${count === 1 ? 'item' : 'itens'}`
}
