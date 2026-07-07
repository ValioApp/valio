'use client'

import { Printer } from 'lucide-react'

/**
 * Botón "Imprimir informe" (iteración 8). Extraído como client component
 * aparte porque `ValuationResult` es server-compatible (sin `'use client'`) y
 * solo este botón necesita el handler de `window.print()`. Lleva su propia
 * clase `print-hidden`: no debe aparecer en el papel/PDF resultante.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hidden flex shrink-0 items-center gap-2 rounded-card border border-hairline bg-white px-4 py-2 font-display text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper"
    >
      <Printer size={16} aria-hidden="true" />
      Imprimir informe
    </button>
  )
}
