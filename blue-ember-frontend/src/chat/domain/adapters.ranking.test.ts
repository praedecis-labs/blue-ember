import { describe, expect, it } from 'vitest'
import type { RankingItemDto } from '@/services/shared/contracts'
import { criteriaToVals, rankingItemToScored } from './adapters'

const sampleItem: RankingItemDto = {
  rank: 1,
  score: 7.42,
  criteria: {
    c1Proximidade: 0.9,
    c2MargemMoc: 0.7,
    c3Cinetica: 0.5,
    c4SeveridadeTermica: 0.4,
    c5Toxicidade: 0.3,
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
    nasaPsiUrl: 'https://psi.nasa.gov/physci/repo/data/investigations/PSI-001',
  },
}

describe('criteriaToVals', () => {
  it('maps API C1–C5 onto CritKey vals', () => {
    expect(criteriaToVals(sampleItem.criteria)).toEqual({
      prox: 0.9,
      moc: 0.7,
      spread: 0.5,
      hrr: 0.4,
      tox: 0.3,
    })
  })
})

describe('rankingItemToScored', () => {
  it('maps ranking item fields into ScoredInvestigation', () => {
    const scored = rankingItemToScored(sampleItem)
    expect(scored.id).toBe('PSI-001')
    expect(scored.name).toBe('BASS')
    expect(scored.what).toBe('Burning and Suppression of Solids')
    expect(scored.where).toBe('ISS')
    expect(scored.o2).toEqual([21, 35])
    expect(scored.nota).toBe(7.42)
    expect(scored.have).toBe(5)
    expect(scored.doi).toBeNull()
    expect(scored.nasaPsiUrl).toBe(
      'https://psi.nasa.gov/physci/repo/data/investigations/PSI-001',
    )
    expect(scored.vals.prox).toBe(0.9)
  })

  it('uses a single o2Range value as min and max', () => {
    const scored = rankingItemToScored({
      ...sampleItem,
      investigation: { ...sampleItem.investigation, o2Range: [30] },
    })
    expect(scored.o2).toEqual([30, 30])
  })
})
