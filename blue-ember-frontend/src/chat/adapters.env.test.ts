import { describe, expect, it } from 'vitest'
import type { EnvironmentDto } from '@/services/contracts'
import {
  envTargetsToQueryPartial,
  fromApiEnvironment,
  fromApiProfile,
  kpaToPsi,
  toApiEnvironment,
  toApiProfile,
} from './adapters'

describe('kpaToPsi', () => {
  it('converts Moon 70.3 kPa to about 10.2 psi', () => {
    expect(kpaToPsi(70.3)).toBeCloseTo(10.2, 1)
  })

  it('converts Iss 101.3 kPa to about 14.7 psi', () => {
    expect(kpaToPsi(101.3)).toBeCloseTo(14.7, 1)
  })
})

describe('envTargetsToQueryPartial', () => {
  it('maps API environment targets into QueryState fields (psi from kPa)', () => {
    const dto: EnvironmentDto = {
      id: 'Moon',
      label: 'Base lunar',
      targetO2Percent: 30,
      targetPressureKpa: 70.3,
      targetFlowCms: 15,
    }
    const partial = envTargetsToQueryPartial(dto)
    expect(partial.o2).toBe(30)
    expect(partial.flow).toBe(15)
    expect(partial.psi).toBeCloseTo(10.2, 1)
  })
})

describe('canonical id round-trip for persistence', () => {
  it('round-trips UI profile through API id', () => {
    expect(fromApiProfile(toApiProfile('eng'))).toBe('eng')
    expect(fromApiProfile('ShipEngineer')).toBe('eng')
    expect(fromApiProfile('eng')).toBe('eng')
  })

  it('round-trips UI environment through API id', () => {
    expect(fromApiEnvironment(toApiEnvironment('lua'))).toBe('lua')
    expect(fromApiEnvironment('Moon')).toBe('lua')
    expect(fromApiEnvironment('lua')).toBe('lua')
  })
})
