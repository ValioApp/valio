/**
 * Formato moneda es-ES sin decimales: '196.000 €'.
 * useGrouping 'always': CLDR es-ES no agrupa miles en cifras de 4 dígitos
 * (2613 → '2613 €') y el design system exige '2.613 €'.
 */
export function formatEur(n: number): string {
  return n.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    useGrouping: 'always',
  })
}

/** Porcentaje con signo y coma decimal es-ES: '+12,3%' / '−4,0%' / '0%'. */
export function formatPct(n: number, decimals = 1): string {
  if (n === 0) return '0%'
  const value = (Math.abs(n) * 100).toFixed(decimals).replace('.', ',')
  return `${n < 0 ? '−' : '+'}${value}%`
}

/**
 * Fecha larga es-ES para la cabecera del informe imprimible: '7 de julio de 2026'.
 * Se calcula explícitamente en un `useEffect` del cliente (nunca en el render
 * inicial) para no arrastrar `new Date()` al HTML servido y evitar un
 * hydration mismatch entre servidor y navegador.
 */
export function formatReportDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
