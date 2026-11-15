import type { CoverageCellDto, GapsResponse } from '@/services/contracts'
import { fmt } from './engine'

type Translate = (key: string, vars?: Record<string, string | number>) => string

export type GapsFromApi = {
  gaps: string[]
  partialGravityWarning: string
  partialG: boolean
}

const CELL_BULLET_CAP = 5

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : fmt(n)
}

function cellCoversTarget(
  cell: CoverageCellDto,
  o2Percent: number,
  pressureKpa: number,
): boolean {
  return (
    o2Percent >= cell.o2Min &&
    o2Percent <= cell.o2Max &&
    pressureKpa >= cell.pressureMinKpa &&
    pressureKpa <= cell.pressureMaxKpa
  )
}

function formatEmptyCell(cell: CoverageCellDto, t: Translate): string {
  return t('gapsApi.noCoverage', {
    o2: `${fmtNum(cell.o2Min)}–${fmtNum(cell.o2Max)}`,
    kpa: `${fmtNum(cell.pressureMinKpa)}–${fmtNum(cell.pressureMaxKpa)}`,
  })
}

/**
 * Derive Gaps panel bullets + warning text from GET /api/gaps.
 * Gravity warning is returned separately for the callout (not duplicated in the list).
 */
export function gapsFromApi(
  gaps: GapsResponse,
  t: Translate = (key) => key,
): GapsFromApi {
  // O aviso do backend vem sempre em português; a tela mostra a versão traduzida
  const partialG = Boolean(gaps.partialGravityWarning?.trim())
  const partialGravityWarning = partialG ? t('gapsApi.partialGWarning') : ''
  const bullets: string[] = []

  if (gaps.nearTargetInvestigationIds.length === 0) {
    const { o2Percent, pressureKpa } = gaps.targets
    bullets.push(
      t('gapsApi.noneNear', {
        o2: fmtNum(o2Percent),
        kpa: fmtNum(pressureKpa),
      }),
    )
  }

  const empty = gaps.coverageCells.filter((c) => c.coverageCount === 0)
  const { o2Percent, pressureKpa } = gaps.targets
  const prioritized = [
    ...empty.filter((c) => cellCoversTarget(c, o2Percent, pressureKpa)),
    ...empty.filter((c) => !cellCoversTarget(c, o2Percent, pressureKpa)),
  ].slice(0, CELL_BULLET_CAP)

  for (const c of prioritized) {
    bullets.push(formatEmptyCell(c, t))
  }

  return {
    gaps: bullets,
    partialGravityWarning,
    partialG,
  }
}
