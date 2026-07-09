import { describe, expect, it } from 'vitest'
import { formatMunicipio, formatProvincia } from './place-names'

describe('formatProvincia', () => {
  it('reordena el artículo tras la coma', () => {
    expect(formatProvincia('Palmas, Las')).toBe('Las Palmas')
    expect(formatProvincia('Coruña, A')).toBe('A Coruña')
    expect(formatProvincia('Rioja, La')).toBe('La Rioja')
    expect(formatProvincia('Balears, Illes')).toBe('Illes Balears')
  })
  it('reordena descriptores de CCAA', () => {
    expect(formatProvincia('Murcia, Región de')).toBe('Región de Murcia')
    expect(formatProvincia('Asturias, Principado de')).toBe('Principado de Asturias')
  })
  it('deja intactos los nombres sin sufijo', () => {
    expect(formatProvincia('Barcelona')).toBe('Barcelona')
    expect(formatProvincia('Alicante / Alacant')).toBe('Alicante / Alacant')
  })
})

describe('formatMunicipio', () => {
  it('reordena el artículo entre paréntesis y aplica título', () => {
    expect(formatMunicipio('PALMAS DE GRAN CANARIA (LAS)')).toBe('Las Palmas de Gran Canaria')
    expect(formatMunicipio('PALMAS DE GRAN CANARIA (LAS)')).toContain('Las Palmas de Gran Canaria')
  })
  it("gestiona el apóstrofo catalán l'", () => {
    expect(formatMunicipio("HOSPITALET DE LLOBREGAT (L')")).toBe("L'Hospitalet de Llobregat")
    expect(formatMunicipio("CORNELLÀ DE LLOBREGAT")).toBe('Cornellà de Llobregat')
  })
  it('pone conectores en minúscula', () => {
    expect(formatMunicipio('MAIRENA DEL ALCOR')).toBe('Mairena del Alcor')
    expect(formatMunicipio('SAN BARTOLOMÉ')).toBe('San Bartolomé')
    expect(formatMunicipio('SANTA COLOMA DE GRAMENET')).toBe('Santa Coloma de Gramenet')
  })
})
