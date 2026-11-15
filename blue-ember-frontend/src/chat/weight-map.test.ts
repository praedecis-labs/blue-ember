import { describe, expect, it } from 'vitest'
import type { ProfileDto, ScoreWeightsDto } from '@/services/contracts'
import {
  critWeightsFromProfileDto,
  scoreWeightsToCrit,
} from './weight-map'

describe('scoreWeightsToCrit', () => {
  it('maps w1–w5 onto CritKey order', () => {
    const weights: ScoreWeightsDto = {
      w1: 0.2,
      w2: 0.25,
      w3: 0.25,
      w4: 0.15,
      w5: 0.15,
    }
    expect(scoreWeightsToCrit(weights)).toEqual({
      prox: 0.2,
      moc: 0.25,
      spread: 0.25,
      hrr: 0.15,
      tox: 0.15,
    })
  })
})

describe('critWeightsFromProfileDto', () => {
  it('extracts CritKey weights from a ProfileDto', () => {
    const dto: ProfileDto = {
      id: 'ShipEngineer',
      label: 'Engenheiro de nave',
      weights: { w1: 0.2, w2: 0.25, w3: 0.25, w4: 0.15, w5: 0.15 },
    }
    expect(critWeightsFromProfileDto(dto)).toEqual({
      prox: 0.2,
      moc: 0.25,
      spread: 0.25,
      hrr: 0.15,
      tox: 0.15,
    })
  })
})
