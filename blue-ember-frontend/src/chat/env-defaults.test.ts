import { describe, expect, it } from 'vitest'
import type { EnvironmentDto } from '@/services/contracts'
import { buildQueryDefaults, environmentLabel } from './env-defaults'

const apiEnvs: EnvironmentDto[] = [
  {
    id: 'Moon',
    label: 'Base lunar',
    targetO2Percent: 30,
    targetPressureKpa: 70.3,
    targetFlowCms: 15,
  },
  {
    id: 'Iss',
    label: 'ISS / estação',
    targetO2Percent: 21,
    targetPressureKpa: 101.3,
    targetFlowCms: 10,
  },
]

describe('buildQueryDefaults', () => {
  it('uses API Moon targets when environments are loaded', () => {
    const q = buildQueryDefaults('lua', apiEnvs)
    expect(q.env).toBe('lua')
    expect(q.o2).toBe(30)
    expect(q.flow).toBe(15)
    expect(q.psi).toBeCloseTo(10.2, 1)
  })

  it('falls back to local DEFAULTS when offline', () => {
    const q = buildQueryDefaults('lua', null)
    expect(q.env).toBe('lua')
    expect(q.o2).toBe(34)
    expect(q.psi).toBe(8.2)
  })
})

describe('environmentLabel', () => {
  it('uses the English label in the default locale (API labels are Portuguese)', () => {
    expect(environmentLabel('iss', apiEnvs)).toBe('ISS')
  })

  it('falls back to local ENV', () => {
    expect(environmentLabel('marte', null)).toBe('Mars base')
  })
})
