import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OCCUPIED_ORDER,
  ETAPA_ADVANCE,
  OCCUPIED_ETAPAS,
  etapaToneClass,
  filtersToSearchParams,
  hasActiveFilters,
  isOccupiedEtapa,
  isOccupiedOrder,
  parseOccupiedParams,
  tipoVentaKey,
  totalPages,
} from './occupied'

describe('parseOccupiedParams', () => {
  it('devuelve filtros vacíos y orden por defecto sin searchParams', () => {
    const { filters, page } = parseOccupiedParams({})
    expect(page).toBe(1)
    expect(filters.orderBy).toBe(DEFAULT_OCCUPIED_ORDER)
    expect(hasActiveFilters(filters)).toBe(false)
  })

  it('parsea texto, enums y números válidos', () => {
    const { filters } = parseOccupiedParams({
      ccaa: 'Cataluña',
      provincia: 'Barcelona',
      municipio: 'tarragona',
      etapa: 'lanzamiento',
      tipoVenta: 'Venta Okupado gest. compartida',
      pvpMin: '50000',
      pvpMax: '200000',
      supMin: '40',
      orderBy: 'eur_m2_desc',
    })
    expect(filters.ccaa).toBe('Cataluña')
    expect(filters.municipio).toBe('tarragona')
    expect(filters.etapa).toBe('lanzamiento')
    expect(filters.tipoVenta).toBe('Venta Okupado gest. compartida')
    expect(filters.pvpMin).toBe(50000)
    expect(filters.pvpMax).toBe(200000)
    expect(filters.supMin).toBe(40)
    expect(filters.supMax).toBeUndefined()
    expect(filters.orderBy).toBe('eur_m2_desc')
    expect(hasActiveFilters(filters)).toBe(true)
  })

  it('ignora enums, órdenes y números inválidos (URL manipulada)', () => {
    const { filters } = parseOccupiedParams({
      etapa: 'inventada',
      tipoVenta: 'no-existe',
      orderBy: 'drop_table',
      pvpMin: '-10',
      pvpMax: 'abc',
    })
    expect(filters.etapa).toBeUndefined()
    expect(filters.tipoVenta).toBeUndefined()
    expect(filters.orderBy).toBe(DEFAULT_OCCUPIED_ORDER)
    expect(filters.pvpMin).toBeUndefined()
    expect(filters.pvpMax).toBeUndefined()
  })

  it('toma el primer valor de parámetros repetidos y saneas la página', () => {
    const { filters, page } = parseOccupiedParams({ ccaa: ['Canarias', 'Cataluña'], page: '0' })
    expect(filters.ccaa).toBe('Canarias')
    expect(page).toBe(1)
    expect(parseOccupiedParams({ page: '3' }).page).toBe(3)
  })
})

describe('filtersToSearchParams', () => {
  it('omite orden por defecto y página 1, e ida y vuelta es estable', () => {
    const { filters } = parseOccupiedParams({ ccaa: 'Cataluña', etapa: 'demanda' })
    expect(filtersToSearchParams(filters)).toBe('ccaa=Catalu%C3%B1a&etapa=demanda')
  })

  it('incluye orden no-defecto y página >1', () => {
    const { filters } = parseOccupiedParams({ orderBy: 'pvp_desc' })
    expect(filtersToSearchParams(filters, 2)).toBe('orderBy=pvp_desc&page=2')
  })
})

describe('etapas', () => {
  it('todas las etapas tienen tono y avance definidos', () => {
    for (const etapa of OCCUPIED_ETAPAS) {
      expect(typeof etapaToneClass(etapa)).toBe('string')
      expect(ETAPA_ADVANCE[etapa]).toBeGreaterThanOrEqual(0)
    }
  })

  it('lanzamiento/adjudicación avanzan más que demanda', () => {
    expect(ETAPA_ADVANCE.adjudicacion_posesion).toBeGreaterThan(ETAPA_ADVANCE.demanda)
    expect(ETAPA_ADVANCE.lanzamiento).toBeGreaterThan(ETAPA_ADVANCE.sentencia_vista)
  })

  it('guards de enum', () => {
    expect(isOccupiedEtapa('lanzamiento')).toBe(true)
    expect(isOccupiedEtapa('otra')).toBe(false)
    expect(isOccupiedOrder('pvp_asc')).toBe(true)
    expect(isOccupiedOrder(undefined)).toBe(false)
  })
})

describe('tipoVentaKey y totalPages', () => {
  it('mapea valores crudos a claves i18n', () => {
    expect(tipoVentaKey('Venta Ex-borrowers gest.compar')).toBe('exDeudores')
    expect(tipoVentaKey('Venta Okupado gest. compartida')).toBe('okupado')
    expect(tipoVentaKey('desconocido')).toBeNull()
  })

  it('calcula páginas con tamaño 24', () => {
    expect(totalPages(0)).toBe(1)
    expect(totalPages(24)).toBe(1)
    expect(totalPages(25)).toBe(2)
    expect(totalPages(989)).toBe(42)
  })
})
