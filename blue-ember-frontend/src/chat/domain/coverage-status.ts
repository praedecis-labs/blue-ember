import type { CoverageCellDto } from '@/services/shared/contracts'
import { kpa } from './engine'
import type { QueryState } from './types'

/** Rótulo honesto da evidência para o caso da pessoa (só a partir de /api/gaps). */
export type EvidenceStatus = 'nearby' | 'adjacent' | 'none'

export type CoverageStatus = {
  status: EvidenceStatus
  /** Testes na faixa exata de O₂ × pressão do caso (0 se fora de todas). */
  n: number
  /** Lua e Marte: todos os testes do PSI foram em microgravidade. */
  partialGravity: boolean
}

type Band = [number, number]

function bands(pairs: Band[]): Band[] {
  const seen = new Map<string, Band>()
  for (const p of pairs) seen.set(`${p[0]}-${p[1]}`, p)
  return [...seen.values()].sort((a, b) => a[0] - b[0])
}

function indexOf(v: number, list: Band[]): number {
  return list.findIndex(
    ([lo, hi], i) => v >= lo && (i === list.length - 1 ? v <= hi + 1 : v < hi),
  )
}

/**
 * nearby   = há testes da NASA na mesma faixa de O₂ e pressão;
 * adjacent = nenhum na faixa, mas há testes numa faixa vizinha;
 * none     = nenhum teste na faixa nem ao redor (ou fora de todas as faixas).
 */
export function coverageStatus(
  cells: CoverageCellDto[] | null | undefined,
  q: Pick<QueryState, 'env' | 'o2' | 'psi'>,
): CoverageStatus | null {
  if (!cells?.length) return null
  const o2 = bands(cells.map((c) => [c.o2Min, c.o2Max] as Band))
  const pr = bands(cells.map((c) => [c.pressureMinKpa, c.pressureMaxKpa] as Band))
  const partialGravity = q.env !== 'iss'
  const oi = indexOf(q.o2, o2)
  const pi = indexOf(kpa(q.psi), pr)
  if (oi < 0 || pi < 0) return { status: 'none', n: 0, partialGravity }

  const count = (a: number, b: number) =>
    cells.find(
      (c) =>
        c.o2Min === o2[a]?.[0] &&
        c.o2Max === o2[a]?.[1] &&
        c.pressureMinKpa === pr[b]?.[0] &&
        c.pressureMaxKpa === pr[b]?.[1],
    )?.coverageCount ?? 0

  const n = count(oi, pi)
  if (n > 0) return { status: 'nearby', n, partialGravity }
  for (const [da, db] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    if (count(oi + da, pi + db) > 0) return { status: 'adjacent', n: 0, partialGravity }
  }
  return { status: 'none', n: 0, partialGravity }
}
