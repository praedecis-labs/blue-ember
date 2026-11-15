import { describe, expect, it } from 'vitest'
import type { CoverageCellDto, GapsResponse } from '@/services/shared/contracts'
import { gapsFromApi as gapsFromApiRaw } from '@/chat/domain/gaps-from-api'
import { enUS } from '@/i18n/messages/en-US'

/** Tradutor de teste com o catálogo em inglês (o idioma padrão do app). */
function t(key: string, vars?: Record<string, string | number>): string {
  const raw = key
    .split('.')
    .reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], enUS)
  const text = typeof raw === 'string' ? raw : key
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String(vars?.[k] ?? ''))
}

const gapsFromApi = (g: GapsResponse) => gapsFromApiRaw(g, t)
const PARTIAL_G = t('gapsApi.partialGWarning')

function cell(
  partial: Partial<CoverageCellDto> &
    Pick<
      CoverageCellDto,
      'o2Min' | 'o2Max' | 'pressureMinKpa' | 'pressureMaxKpa'
    >,
): CoverageCellDto {
  return {
    coverageCount: 0,
    investigationIds: [],
    ...partial,
  }
}

function gaps(partial: Partial<GapsResponse> = {}): GapsResponse {
  return {
    environment: 'Moon',
    targets: { o2Percent: 30, pressureKpa: 70.3, flowCms: 15 },
    partialGravityWarning:
      'O PSI quase não contém dados de gravidade parcial.',
    nearTargetInvestigationIds: ['PSI-001'],
    coverageCells: [],
    featuredCount: 19,
    ...partial,
  }
}

describe('gapsFromApi', () => {
  it('trims warning and sets partialG when warning is present', () => {
    const result = gapsFromApi(
      gaps({
        partialGravityWarning: '  Missing partial-g data.  ',
      }),
    )
    expect(result.partialG).toBe(true)
    expect(result.partialGravityWarning).toBe(PARTIAL_G)
  })

  it('treats whitespace-only warning as absent', () => {
    const result = gapsFromApi(
      gaps({
        partialGravityWarning: '   ',
      }),
    )
    expect(result.partialG).toBe(false)
    expect(result.partialGravityWarning).toBe('')
  })

  it('adds a near-target bullet when no investigations are near the target', () => {
    const result = gapsFromApi(
      gaps({
        nearTargetInvestigationIds: [],
        targets: { o2Percent: 30, pressureKpa: 70.3, flowCms: 15 },
      }),
    )
    expect(
      result.gaps.some((g: string) => g.includes('30') && g.includes('70.3')),
    ).toBe(true)
  })

  it('formats empty coverage cells and caps at 5', () => {
    const emptyCells = Array.from({ length: 7 }, (_, i) =>
      cell({
        o2Min: 15 + i,
        o2Max: 16 + i,
        pressureMinKpa: 50,
        pressureMaxKpa: 70.3,
        coverageCount: 0,
      }),
    )
    const result = gapsFromApi(
      gaps({
        nearTargetInvestigationIds: ['PSI-001'],
        coverageCells: [
          ...emptyCells,
          cell({
            o2Min: 40,
            o2Max: 60,
            pressureMinKpa: 85,
            pressureMaxKpa: 101.3,
            coverageCount: 3,
            investigationIds: ['PSI-002'],
          }),
        ],
      }),
    )
    const cellBullets = result.gaps.filter((g: string) =>
      g.startsWith('No coverage at O₂'),
    )
    expect(cellBullets).toHaveLength(5)
    expect(cellBullets[0]).toBe('No coverage at O₂ 15–16% × 50–70.3 kPa')
  })

  it('prioritizes empty cells that cover the mission target', () => {
    const result = gapsFromApi(
      gaps({
        nearTargetInvestigationIds: ['PSI-001'],
        targets: { o2Percent: 30, pressureKpa: 70.3, flowCms: 15 },
        coverageCells: [
          cell({
            o2Min: 15,
            o2Max: 21,
            pressureMinKpa: 50,
            pressureMaxKpa: 70.3,
            coverageCount: 0,
          }),
          cell({
            o2Min: 21,
            o2Max: 30,
            pressureMinKpa: 70.3,
            pressureMaxKpa: 85,
            coverageCount: 0,
          }),
          cell({
            o2Min: 60,
            o2Max: 85,
            pressureMinKpa: 85,
            pressureMaxKpa: 101.3,
            coverageCount: 0,
          }),
        ],
      }),
    )
    const cellBullets = result.gaps.filter((g: string) =>
      g.startsWith('No coverage at O₂'),
    )
    expect(cellBullets[0]).toBe('No coverage at O₂ 21–30% × 70.3–85 kPa')
  })

  it('does not duplicate the gravity warning in the gaps list', () => {
    const warning = 'O PSI quase não contém dados de gravidade parcial.'
    const result = gapsFromApi(
      gaps({
        partialGravityWarning: warning,
        nearTargetInvestigationIds: ['PSI-001'],
        coverageCells: [],
      }),
    )
    expect(result.partialGravityWarning).toBe(PARTIAL_G)
    expect(result.gaps.some((g: string) => g.includes(warning))).toBe(false)
  })
})
