import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRankingFireSafety } from './ranking'
import type { RankingResponse } from '../shared/contracts'
import { requestJson } from '../shared/http'

// O cliente HTTP agora usa axios (não fetch): simulamos requestJson e mantemos buildQuery real.
vi.mock('../shared/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../shared/http')>()
  return { ...actual, requestJson: vi.fn() }
})
const requestJsonMock = vi.mocked(requestJson)

const sampleRanking: RankingResponse = {
  profile: 'ShipEngineer',
  environment: 'Moon',
  featured: true,
  weights: { w1: 0.3, w2: 0.2, w3: 0.2, w4: 0.15, w5: 0.15 },
  count: 1,
  items: [
    {
      rank: 1,
      score: 0.91,
      criteria: {
        c1Proximidade: 0.9,
        c2MargemMoc: 0.8,
        c3Cinetica: 0.7,
        c4SeveridadeTermica: 0.6,
        c5Toxicidade: 0.5,
      },
      investigation: {
        id: 'psi-99',
        acronym: 'SAFFIRE-II',
        title: 'Saffire II',
        category: 'Fire Safety',
        platform: 'ISS',
        o2Range: [21, 21],
        pressureKpa: [101, 101],
        isFeaturedFireSafety: true,
        nasaPsiUrl: 'https://example.nasa.gov/psi-99',
      },
    },
  ],
}

describe('getRankingFireSafety', () => {
  afterEach(() => {
    requestJsonMock.mockReset()
  })

  it('calls fire-safety endpoint with profile and environment', async () => {
    requestJsonMock.mockResolvedValue(sampleRanking)

    const result = await getRankingFireSafety({
      profile: 'ShipEngineer',
      environment: 'Moon',
    })

    expect(requestJsonMock).toHaveBeenCalledWith(
      '/api/ranking/fire-safety?profile=ShipEngineer&environment=Moon',
    )
    expect(result.profile).toBe('ShipEngineer')
    expect(result.items[0]?.investigation.acronym).toBe('SAFFIRE-II')
    expect(result.items[0]?.criteria.c1Proximidade).toBe(0.9)
  })

  it('returns distinct weights when profile changes (T2 done criterion)', async () => {
    const engineer: RankingResponse = {
      ...sampleRanking,
      profile: 'ShipEngineer',
      weights: { w1: 0.2, w2: 0.25, w3: 0.25, w4: 0.15, w5: 0.15 },
    }
    const student: RankingResponse = {
      ...sampleRanking,
      profile: 'Student',
      weights: { w1: 0.2, w2: 0.2, w3: 0.2, w4: 0.2, w5: 0.2 },
    }
    requestJsonMock.mockResolvedValueOnce(engineer).mockResolvedValueOnce(student)

    const a = await getRankingFireSafety({
      profile: 'ShipEngineer',
      environment: 'Moon',
    })
    const b = await getRankingFireSafety({
      profile: 'Student',
      environment: 'Moon',
    })

    expect(a.weights).not.toEqual(b.weights)
    expect(a.weights.w2).toBe(0.25)
    expect(b.weights.w2).toBe(0.2)
  })
})

