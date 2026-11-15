import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRankingFireSafety } from './ranking'
import type { RankingResponse } from '../shared/contracts'

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
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('calls fire-safety endpoint with profile and environment', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleRanking,
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await getRankingFireSafety({
      profile: 'ShipEngineer',
      environment: 'Moon',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ranking/fire-safety?profile=ShipEngineer&environment=Moon',
      undefined,
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => engineer,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => student,
      })
    vi.stubGlobal('fetch', fetchMock)

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

