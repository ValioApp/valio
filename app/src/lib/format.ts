import { DEFAULT_LOCALE, type Locale } from '@/i18n/config'

/**
 * Formateo locale-aware para VALIO (es-ES / ca-ES / en-GB).
 * Decisión de moneda: el símbolo € se mantiene SIEMPRE pospuesto (convención
 * europea), coherente con un producto del mercado español; lo único que varía
 * por locale son los separadores de millar/decimal y el formato de fecha. Así
 * en inglés se muestra "525,000 €" (millar con coma) y en es/ca "525.000 €".
 * El locale es opcional y por defecto es 'es' → así los tests y cualquier
 * llamada sin locale siguen produciendo el formato español histórico.
 */
const BCP47: Record<Locale, string> = {
  es: 'es-ES',
  ca: 'ca-ES',
  en: 'en-GB',
}

function toBcp47(locale: Locale | string = DEFAULT_LOCALE): string {
  return BCP47[locale as Locale] ?? BCP47[DEFAULT_LOCALE]
}

/**
 * Moneda con € pospuesto y separadores del locale activo: '196.000 €' (es/ca),
 * '196,000 €' (en). useGrouping 'always': CLDR es-ES no agrupa miles en cifras
 * de 4 dígitos (2613 → '2613') y el design system exige '2.613 €'.
 */
export function formatEur(n: number, locale: Locale | string = DEFAULT_LOCALE): string {
  const grouped = n.toLocaleString(toBcp47(locale), {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  })
  return `${grouped} €`
}

/** Porcentaje con signo y decimal del locale: '+12,3%' / '−4,0%' / '0%'. */
export function formatPct(n: number, locale: Locale | string = DEFAULT_LOCALE, decimals = 1): string {
  if (n === 0) return '0%'
  const abs = new Intl.NumberFormat(toBcp47(locale), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(n) * 100)
  return `${n < 0 ? '−' : '+'}${abs}%`
}

/**
 * Porcentaje sin signo con separador decimal del locale: '5,38%' (es/ca),
 * '5.38%' (en). Sin espacio antes del '%' para casar con el design system.
 */
export function formatPercentPlain(
  value: number,
  locale: Locale | string = DEFAULT_LOCALE,
  opts?: { min?: number; max?: number },
): string {
  const num = new Intl.NumberFormat(toBcp47(locale), {
    minimumFractionDigits: opts?.min ?? 0,
    maximumFractionDigits: opts?.max ?? 2,
  }).format(value * 100)
  return `${num}%`
}

/**
 * Fecha larga del locale para la cabecera del informe imprimible:
 * '7 de julio de 2026' (es), '7 de juliol de 2026' (ca), '7 July 2026' (en).
 * Se calcula explícitamente en un `useEffect` del cliente (nunca en el render
 * inicial) para no arrastrar `new Date()` al HTML servido y evitar un
 * hydration mismatch entre servidor y navegador.
 */
export function formatReportDate(date: Date, locale: Locale | string = DEFAULT_LOCALE): string {
  return date.toLocaleDateString(toBcp47(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Fecha corta del locale para listados (cartera): '08 jul 2026' / '08 Jul 2026'. */
export function formatShortDate(iso: string, locale: Locale | string = DEFAULT_LOCALE): string {
  return new Date(iso).toLocaleDateString(toBcp47(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
