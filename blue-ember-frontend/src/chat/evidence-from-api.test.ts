import { describe, expect, it } from 'vitest'
import type { GapsResponse, RankingResponse } from '@/services/contracts'
import { evidenceFromRankingAndGaps } from './evidence-from-api'

function ranking(score: number, items = true): RankingResponse {
  return {
    profile: 'ShipEngineer',
    environment: 'Moon',
    featured: true,
    weights: { w1: 0.4, w2: 0.2, w3: 0.15, w4: 0.15, w5: 0.1 },
    count: items ? 1 : 0,
    items: items
      ? [
          {
            rank: 1,
            score,
            criteria: {
              c1Proximidade: 0.8,
              c2MargemMoc: 0.7,
              c3Cinetica: 0.6,
              c4SeveridadeTermica: 0.5,
              c5Toxicidade: 0.4,
            },
            investigation: {
              id: 'PSI-001',
              acronym: 'BASS',
              title: 'Burning and Suppression of Solids',
              category: 'prevencao',
              platform: 'ISS',
              o2Range: [21, 35],
              pressureKpa: [70, 101],
              isFeaturedFireSafety: true,
              nasaPsiUrl: 'https://psi.nasa.gov/example',
            },
          },
        ]
      : [],
  }
}

function gaps(partial: GapsResponse): GapsResponse {
  return partial
}

const enEvidence = (key: string) =>
  ({
    'evidence.weakFull': 'Weak evidence',
    'evidence.moderateFull': 'Moderate evidence',
    'evidence.strongFull': 'Strong evidence',
  })[key] ?? key

describe('evidenceFromRankingAndGaps', () => {
  it('marks Moon with warning, no near targets, and low score as weak', () => {
    const result = evidenceFromRankingAndGaps(
      ranking(3),
      gaps({
        environment: 'Moon',
        targets: { o2Percent: 30, pressureKpa: 70.3, flowCms: 15 },
        partialGravityWarning: 'Partial gravity data is missing for the Moon.',
        nearTargetInvestigationIds: [],
        coverageCells: [],
        featuredCount: 19,
      }),
      enEvidence,
    )
    expect(result.partialG).toBe(true)
    expect(result.near).toBe(0)
    expect(result.featuredCount).toBe(19)
    expect(result.level[0]).toBe('weak')
    expect(result.level[1]).toBe('Weak evidence')
  })

  it('marks Iss without warning, near>0, and score≥5 as strong', () => {
    const result = evidenceFromRankingAndGaps(
      { ...ranking(7.5), environment: 'Iss' },
      gaps({
        environment: 'Iss',
        targets: { o2Percent: 21, pressureKpa: 101.3, flowCms: 0 },
        partialGravityWarning: '',
        nearTargetInvestigationIds: ['PSI-001', 'PSI-002'],
        coverageCells: [],
        featuredCount: 19,
      }),
      enEvidence,
    )
    expect(result.partialG).toBe(false)
    expect(result.near).toBe(2)
    expect(result.level[0]).toBe('strong')
    expect(result.level[1]).toBe('Strong evidence')
  })

  it('treats whitespace-only partialGravityWarning as absent', () => {
    const result = evidenceFromRankingAndGaps(
      ranking(8),
      gaps({
        environment: 'Iss',
        targets: { o2Percent: 21, pressureKpa: 101.3, flowCms: 0 },
        partialGravityWarning: '   ',
        nearTargetInvestigationIds: ['PSI-001'],
        coverageCells: [],
        featuredCount: 10,
      }),
    )
    expect(result.partialG).toBe(false)
    expect(result.level[0]).toBe('strong')
  })

  it('is moderate when only one issue is present', () => {
    const result = evidenceFromRankingAndGaps(
      ranking(8),
      gaps({
        environment: 'Moon',
        targets: { o2Percent: 30, pressureKpa: 70.3, flowCms: 15 },
        partialGravityWarning: 'Missing partial-g data.',
        nearTargetInvestigationIds: ['PSI-001'],
        coverageCells: [],
        featuredCount: 19,
      }),
    )
    expect(result.level[0]).toBe('moderate')
  })
})
