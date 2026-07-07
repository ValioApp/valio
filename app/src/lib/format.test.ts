import { describe, expect, it } from 'vitest'
import { formatReportDate } from './format'

describe('formatReportDate', () => {
  it('formatea en es-ES largo: día, mes en letras, año', () => {
    expect(formatReportDate(new Date(2026, 6, 7))).toBe('7 de julio de 2026')
  })

  it('no rellena con cero el día', () => {
    expect(formatReportDate(new Date(2026, 0, 3))).toBe('3 de enero de 2026')
  })

  it('cambia de año sin errores', () => {
    expect(formatReportDate(new Date(2025, 11, 31))).toBe('31 de diciembre de 2025')
  })
})
