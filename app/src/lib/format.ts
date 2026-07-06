/** Formato moneda es-ES sin decimales: '196.000 €'. */
export function formatEur(n: number): string {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

/** Porcentaje con signo y coma decimal es-ES: '+12,3%' / '−4,0%' / '0%'. */
export function formatPct(n: number, decimals = 1): string {
  if (n === 0) return '0%'
  const value = (Math.abs(n) * 100).toFixed(decimals).replace('.', ',')
  return `${n < 0 ? '−' : '+'}${value}%`
}
