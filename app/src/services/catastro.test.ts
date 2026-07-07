import { describe, expect, it } from 'vitest'
import type { FetchLike } from './geocoder'
import { consultaDNPRC } from './catastro'

// Payload REAL de Consulta_DNPRC?Provincia=&Municipio=&RefCat=0514310DF3801D
// (C/ Hospital 92, Barcelona; recortado de 9 a 3 inmuebles, campos debi intactos).
// El PRIMER inmueble es Comercial: el criterio debe saltárselo y elegir el
// Residencial de mayor superficie (198 m²).
const DNPRC_HOSPITAL_92 = {
  consulta_dnprcResult: {
    control: { cudnp: 3 },
    lrcdnp: {
      rcdnp: [
        {
          rc: { pc1: '0514310', pc2: 'DF3801D', car: '0002', cc1: 'M', cc2: 'B' },
          debi: { luso: 'Comercial', sfc: '80', cpt: '11,440000', ant: '1900' },
        },
        {
          rc: { pc1: '0514310', pc2: 'DF3801D', car: '0003', cc1: 'Q', cc2: 'Z' },
          debi: { luso: 'Residencial', sfc: '198', cpt: '20,750000', ant: '1900' },
        },
        {
          rc: { pc1: '0514310', pc2: 'DF3801D', car: '0006', cc1: 'R', cc2: 'Q' },
          debi: { luso: 'Residencial', sfc: '64', cpt: '8,490000', ant: '1900' },
        },
      ],
    },
  },
}

// Payload REAL de error (RefCat inexistente) — llega con HTTP 200.
const DNPRC_ERROR = {
  consulta_dnprcResult: {
    control: { cuerr: 1 },
    lerr: [{ cod: '5', des: 'NO EXISTE NINGÚN INMUEBLE CON LOS PARÁMETROS INDICADOS' }],
  },
}

function fakeFetch(body: string, status = 200): FetchLike {
  return async () => ({ ok: status >= 200 && status < 300, status, text: async () => body })
}

describe('consultaDNPRC', () => {
  it('elige el inmueble RESIDENCIAL de mayor superficie de la finca', async () => {
    const result = await consultaDNPRC('0514310DF3801D', fakeFetch(JSON.stringify(DNPRC_HOSPITAL_92)))
    expect(result).toEqual({
      refCat: '0514310DF3801D',
      usage: 'Residencial',
      builtAreaM2: 198,
      yearBuilt: 1900,
    })
  })

  it('si no hay residenciales, cae al de mayor superficie', async () => {
    const soloComercial = {
      consulta_dnprcResult: {
        control: { cudnp: 2 },
        lrcdnp: {
          rcdnp: [
            { debi: { luso: 'Comercial', sfc: '80', ant: '1900' } },
            { debi: { luso: 'Comercial', sfc: '112', ant: '1900' } },
          ],
        },
      },
    }
    const result = await consultaDNPRC('0514310DF3801D', fakeFetch(JSON.stringify(soloComercial)))
    expect(result.usage).toBe('Comercial')
    expect(result.builtAreaM2).toBe(112)
  })

  it('acepta rcdnp como objeto único (finca con un solo inmueble)', async () => {
    const unico = {
      consulta_dnprcResult: {
        control: { cudnp: 1 },
        lrcdnp: { rcdnp: { debi: { luso: 'Residencial', sfc: '85', ant: '1972' } } },
      },
    }
    const result = await consultaDNPRC('0514310DF3801D', fakeFetch(JSON.stringify(unico)))
    expect(result.builtAreaM2).toBe(85)
    expect(result.yearBuilt).toBe(1972)
  })

  it('propaga los errores del Catastro (llegan con HTTP 200)', async () => {
    await expect(consultaDNPRC('0514310DF3801D', fakeFetch(JSON.stringify(DNPRC_ERROR)))).rejects.toThrow(
      /NO EXISTE NINGÚN INMUEBLE/,
    )
  })

  it('detecta la trampa del HTML con status 200', async () => {
    await expect(
      consultaDNPRC('0514310DF3801D', fakeFetch('<!DOCTYPE html><html>mantenimiento</html>')),
    ).rejects.toThrow(/HTML/)
  })

  it('rechaza referencias que no tengan 14 caracteres', async () => {
    await expect(consultaDNPRC('0514310DF3801D0003QZ', fakeFetch('{}'))).rejects.toThrow(/14 caracteres/)
    await expect(consultaDNPRC('0514310', fakeFetch('{}'))).rejects.toThrow(/14 caracteres/)
  })
})
