import { describe, expect, it } from 'vitest'
import {
  fromApiEnvironment,
  fromApiProfile,
  rankingParamsFromQuery,
  toApiCategory,
  toApiEnvironment,
  toApiProfile,
} from './adapters'

describe('adapters', () => {
  it('maps UI profiles to API ids', () => {
    expect(toApiProfile('eng')).toBe('ShipEngineer')
    expect(toApiProfile('pesq')).toBe('Researcher')
    expect(toApiProfile('est')).toBe('Student')
  })

  it('maps API profiles back to UI ids', () => {
    expect(fromApiProfile('ShipEngineer')).toBe('eng')
    expect(fromApiProfile('eng')).toBe('eng')
    expect(fromApiProfile('nope')).toBeNull()
  })

  it('maps environments both ways', () => {
    expect(toApiEnvironment('lua')).toBe('Moon')
    expect(fromApiEnvironment('Mars')).toBe('marte')
    expect(fromApiEnvironment('iss')).toBe('iss')
  })

  it('maps goals to API category', () => {
    expect(toApiCategory('prevenir')).toBe('prevencao')
    expect(toApiCategory('detectar')).toBe('deteccao')
    expect(toApiCategory('apagar')).toBe('supressao')
  })

  it('builds ranking params from profile and query', () => {
    expect(
      rankingParamsFromQuery('eng', { env: 'lua', goal: 'prevenir' }),
    ).toEqual({
      profile: 'ShipEngineer',
      environment: 'Moon',
      category: 'prevencao',
    })
    expect(
      rankingParamsFromQuery('est', { env: 'iss', goal: 'apagar' }),
    ).toEqual({
      profile: 'Student',
      environment: 'Iss',
      category: 'supressao',
    })
  })
})
