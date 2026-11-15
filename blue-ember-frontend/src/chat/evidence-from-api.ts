import type { GapsResponse, RankingResponse } from '@/services/contracts'
import type { EvidenceLevel } from './types'

export type EvidenceFromApi = {
  level: [EvidenceLevel, string]
  near: number
  partialG: boolean
  featuredCount: number
}

type Translate = (key: string, vars?: Record<string, string | number>) => string

/**
 * Derive evidence-panel metrics from ranking + gaps API payloads
 * (no invented percentages).
 */
export function evidenceFromRankingAndGaps(
  ranking: RankingResponse,
  gaps: GapsResponse,
  t?: Translate,
): EvidenceFromApi {
  const label = t ?? ((key: string) => key)
  const partialG = Boolean(gaps.partialGravityWarning?.trim())
  const near = gaps.nearTargetInvestigationIds.length
  const featuredCount = gaps.featuredCount
  const topScore = ranking.items[0]?.score ?? 0
  const issues = [partialG, near === 0, topScore < 5].filter(Boolean).length
  const level: [EvidenceLevel, string] =
    issues >= 2
      ? ['weak', label('evidence.weakFull')]
      : issues === 1
        ? ['moderate', label('evidence.moderateFull')]
        : ['strong', label('evidence.strongFull')]
  return { level, near, partialG, featuredCount }
}
