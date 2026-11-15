import type { CoverageCellDto, GapsResponse } from '@/services/contracts'

export type GapsFromApi = {
  gaps: string[]
  partialGravityWarning: string
  partialG: boolean
}

const CELL_BULLET_CAP = 5

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n)
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

function formatEmptyCell(cell: CoverageCellDto): string {
  return `Sem cobertura em O₂ ${fmtNum(cell.o2Min)}–${fmtNum(cell.o2Max)}% × ${fmtNum(cell.pressureMinKpa)}–${fmtNum(cell.pressureMaxKpa)} kPa`
}

/**
 * Derive Gaps panel bullets + warning text from GET /api/gaps.
 * Gravity warning is returned separately for the callout (not duplicated in the list).
 */
export function gapsFromApi(gaps: GapsResponse): GapsFromApi {
  const partialGravityWarning = gaps.partialGravityWarning?.trim() ?? ''
  const partialG = Boolean(partialGravityWarning)
  const bullets: string[] = []

  if (gaps.nearTargetInvestigationIds.length === 0) {
    const { o2Percent, pressureKpa } = gaps.targets
    bullets.push(
      `Nenhuma investigação featured perto do alvo (O₂ ${fmtNum(o2Percent)}% ±5%, ${fmtNum(pressureKpa)} kPa ±15 kPa).`,
    )
  }

  const empty = gaps.coverageCells.filter((c) => c.coverageCount === 0)
  const { o2Percent, pressureKpa } = gaps.targets
  const prioritized = [
    ...empty.filter((c) => cellCoversTarget(c, o2Percent, pressureKpa)),
    ...empty.filter((c) => !cellCoversTarget(c, o2Percent, pressureKpa)),
  ].slice(0, CELL_BULLET_CAP)

  for (const c of prioritized) {
    bullets.push(formatEmptyCell(c))
  }

  return {
    gaps: bullets,
    partialGravityWarning,
    partialG,
  }
}
