/** "$29" / "€29" / "₨29" — uses the admin-selected currency. */
export function fmtPrice(price, branding) {
  const symbol = branding?.currency?.symbol ?? '$'
  return `${symbol}${Number(price).toLocaleString()}`
}
