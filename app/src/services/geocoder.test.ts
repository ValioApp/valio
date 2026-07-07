import { describe, expect, it } from 'vitest'
import {
  findAddress,
  normalizeCartoAddress,
  searchCandidates,
  type FetchLike,
} from './geocoder'

// Respuesta REAL de /candidates?q=Carrer de l'Hospital 92, Barcelona&limit=3
// (recortada a 2 candidatos). Nótese la comilla doble en 'L"HOSPITAL' (trampa real).
const CANDIDATES_FIXTURE = [
  {
    id: '09.08.MUN_080190126313',
    province: 'Barcelona',
    provinceCode: '08',
    comunidadAutonoma: 'Cataluña/Catalunya',
    muni: 'Barcelona',
    muniCode: '08019',
    type: 'portal',
    address: 'CALLE L"HOSPITAL 92, Barcelona',
    postalCode: '08001',
    poblacion: 'Barcelona',
    geom: null,
    tip_via: 'CALLE',
    lat: 41.379907841099474,
    lng: 2.168444246118715,
    portalNumber: 92,
    noNumber: false,
    state: 0,
    refCatastral: '0514310DF3801D',
    countryCode: '011',
  },
  {
    id: '08.19.G19_191520031269',
    province: 'Guadalajara',
    provinceCode: '19',
    comunidadAutonoma: 'Castilla-La Mancha',
    muni: 'Illana',
    muniCode: '19152',
    type: 'portal',
    address: 'CALLE HOSPITAL 91, Illana',
    postalCode: '19119',
    poblacion: 'Illana',
    geom: null,
    tip_via: 'CALLE',
    lat: 40.18666885994103,
    lng: -2.9089154115052724,
    portalNumber: 91,
    noNumber: false,
    state: 0,
    refCatastral: '7986807WK0478F',
    countryCode: '011',
  },
]

// Respuesta REAL de /find?id=09.08.MUN_080190126313&type=portal
const FIND_FIXTURE = {
  id: '09.08.MUN_080190126313',
  province: 'Barcelona',
  provinceCode: '08',
  comunidadAutonoma: 'Cataluña/Catalunya',
  muni: 'Barcelona',
  muniCode: '08019',
  type: 'portal',
  address: 'L"HOSPITAL',
  postalCode: '08001',
  poblacion: 'Barcelona',
  geom: 'POINT(2.16844424611871 41.3799078410995)',
  tip_via: 'CALLE',
  lat: 41.379907841099474,
  lng: 2.168444246118715,
  portalNumber: 92,
  noNumber: false,
  state: 0,
  refCatastral: '0514310DF3801D',
  countryCode: '011',
}

function fakeFetch(body: string, status = 200, calls?: string[]): FetchLike {
  return async (url: string) => {
    calls?.push(url)
    return { ok: status >= 200 && status < 300, status, text: async () => body }
  }
}

describe('normalizeCartoAddress', () => {
  it("convierte la comilla doble de CartoCiudad en apóstrofo: L\"Hospitalet → L'Hospitalet", () => {
    expect(normalizeCartoAddress('L"Hospitalet de Llobregat')).toBe("L'Hospitalet de Llobregat")
    expect(normalizeCartoAddress('CALLE L"HOSPITAL 92, Barcelona')).toBe("CALLE L'HOSPITAL 92, Barcelona")
  })
})

describe('searchCandidates', () => {
  it('construye la URL con q y limit', async () => {
    const calls: string[] = []
    await searchCandidates('Hospital 92 Barcelona', 5, fakeFetch(JSON.stringify(CANDIDATES_FIXTURE), 200, calls))
    expect(calls[0]).toBe(
      'https://www.cartociudad.es/geocoder/api/geocoder/candidates?q=Hospital%2092%20Barcelona&limit=5',
    )
  })

  it('devuelve candidatos tipados con la dirección normalizada', async () => {
    const found = await searchCandidates('Hospital 92', 5, fakeFetch(JSON.stringify(CANDIDATES_FIXTURE)))
    expect(found).toHaveLength(2)
    expect(found[0]).toMatchObject({
      id: '09.08.MUN_080190126313',
      type: 'portal',
      address: "CALLE L'HOSPITAL 92, Barcelona",
      muni: 'Barcelona',
      muniCode: '08019',
      postalCode: '08001',
      lat: 41.379907841099474,
      lng: 2.168444246118715,
    })
  })
})

describe('findAddress', () => {
  it('resuelve por id+type con la URL del candidato', async () => {
    const calls: string[] = []
    await findAddress(
      { id: '09.08.MUN_080190126313', type: 'portal' },
      fakeFetch(JSON.stringify(FIND_FIXTURE), 200, calls),
    )
    expect(calls[0]).toBe(
      'https://www.cartociudad.es/geocoder/api/geocoder/find?id=09.08.MUN_080190126313&type=portal',
    )
  })

  it('extrae lat/lng, muniCode, postalCode, refCatastral y state', async () => {
    const result = await findAddress({ q: "Carrer de l'Hospital 92, Barcelona" }, fakeFetch(JSON.stringify(FIND_FIXTURE)))
    expect(result).toMatchObject({
      address: "L'HOSPITAL",
      muni: 'Barcelona',
      muniCode: '08019',
      postalCode: '08001',
      lat: 41.379907841099474,
      lng: 2.168444246118715,
      refCatastral: '0514310DF3801D',
      state: 0,
      type: 'portal',
    })
  })

  it('lanza error si el body es HTML (WAF/mantenimiento con status 200)', async () => {
    await expect(
      findAddress({ q: 'Hospital 92' }, fakeFetch('<!DOCTYPE html><html>mantenimiento</html>')),
    ).rejects.toThrow(/HTML/)
  })

  it('lanza error si la respuesta no trae coordenadas', async () => {
    const sinCoords = JSON.stringify({ ...FIND_FIXTURE, lat: null, lng: null })
    await expect(findAddress({ q: 'x'.repeat(3) }, fakeFetch(sinCoords))).rejects.toThrow(/geolocalizar/)
  })
})
