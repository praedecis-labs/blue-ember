import { describe, expect, it } from 'vitest'
import type { CoverageCellDto } from '@/services/shared/contracts'
import { coverageStatus } from './coverage-status'

const cell = (o2: [number, number], p: [number, number], n: number): CoverageCellDto => ({
  o2Min: o2[0], o2Max: o2[1], pressureMinKpa: p[0], pressureMaxKpa: p[1],
  coverageCount: n, investigationIds: [],
})

// 2 × 2: O₂ 15–30 / 30–40, pressão 50–70 / 70–101 kPa
const cells = [
  cell([15, 30], [50, 70], 4), cell([15, 30], [70, 101], 9),
  cell([30, 40], [50, 70], 0), cell([30, 40], [70, 101], 0),
]

describe('coverageStatus', () => {
  it('nearby quando há testes na mesma faixa', () => {
    expect(coverageStatus(cells, { env: 'iss', o2: 21, psi: 14.7 })).toEqual({
      status: 'nearby', n: 9, partialGravity: false,
    })
  })
  it('adjacent quando só a faixa vizinha tem testes', () => {
    expect(coverageStatus(cells, { env: 'lua', o2: 34, psi: 8.2 })).toEqual({
      status: 'adjacent', n: 0, partialGravity: true,
    })
  })
  it('none quando fica fora de todas as faixas', () => {
    expect(coverageStatus(cells, { env: 'marte', o2: 60, psi: 8.2 })?.status).toBe('none')
  })
  it('none sem testes ao redor', () => {
    const empty = cells.map((c) => ({ ...c, coverageCount: 0 }))
    expect(coverageStatus(empty, { env: 'iss', o2: 21, psi: 14.7 })?.status).toBe('none')
  })
  it('null sem dados de cobertura', () => {
    expect(coverageStatus([], { env: 'iss', o2: 21, psi: 14.7 })).toBeNull()
  })
})
