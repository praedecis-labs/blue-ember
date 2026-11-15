import type { ProfileDto, ScoreWeightsDto } from '@/services/shared/contracts'
import type { CritWeights } from './types'

export type { CritWeights }

/** Map API ScoreWeightsDto (w1–w5) onto UI CritKey weights. */
export function scoreWeightsToCrit(weights: ScoreWeightsDto): CritWeights {
  return {
    prox: weights.w1,
    moc: weights.w2,
    spread: weights.w3,
    hrr: weights.w4,
    tox: weights.w5,
  }
}

export function critWeightsFromProfileDto(dto: ProfileDto): CritWeights {
  return scoreWeightsToCrit(dto.weights)
}
