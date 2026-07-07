/**
 * Estimación de reforma por niveles declarados (iteración 7 del loop — completa P8).
 * Señal F9: Invisor presume de estimar reforma "por fotos en 5 niveles"; nosotros v0
 * sin visión artificial, por nivel declarado por el usuario × superficie construida.
 *
 * Módulo puro, sin red ni DB — mismo espíritu que rentability.ts y scenarios.ts.
 */

export type RenovationLevel = 'ninguna' | 'lavado' | 'parcial' | 'integral' | 'premium'

/** €/m² por nivel de reforma, v0 heurístico España 2026 (VERIFICAR/calibrar con
 * presupuestos reales; fuentes orientativas: guías de reformas 2025-2026). */
export const RENOVATION_EUR_M2: Record<RenovationLevel, number> = {
  ninguna: 0,
  lavado: 150, // pintura, pequeños arreglos
  parcial: 400, // cocina o baño + suelos
  integral: 700, // todo excepto estructura
  premium: 1100, // integral con calidades altas
}

export const RENOVATION_LABELS: Record<RenovationLevel, string> = {
  ninguna: 'Sin reforma',
  lavado: 'Lavado de cara',
  parcial: 'Reforma parcial',
  integral: 'Reforma integral',
  premium: 'Integral premium',
}

/**
 * Coste estimado de reforma para un nivel dado y la superficie construida, redondeado
 * a la centena. Superficie no positiva o no finita (sin dato de Catastro, etc.) → 0.
 */
export function estimateRenovation(level: RenovationLevel, builtAreaM2: number): number {
  if (!Number.isFinite(builtAreaM2) || builtAreaM2 <= 0) return 0
  const raw = RENOVATION_EUR_M2[level] * builtAreaM2
  return Math.round(raw / 100) * 100
}
