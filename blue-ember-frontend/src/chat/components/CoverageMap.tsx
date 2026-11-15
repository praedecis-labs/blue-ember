import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { EstimatedBadge } from './EstimatedBadge'
import type { CoverageCellDto } from '@/services/contracts'
import { fmt, kpa } from '../engine'
import type { QueryState } from '../types'

type Props = {
  cells: CoverageCellDto[] | null | undefined
  q: QueryState
}

/**
 * Mapa simples de cobertura: quantos testes da NASA existem em cada faixa
 * de O₂ × pressão (dados de GET /api/gaps) e onde o caso da pessoa cai.
 * Não repete o texto da resposta: mostra o "onde", não o "porquê".
 */
export function CoverageMap({ cells, q }: Props) {
  const t = useT()
  if (!cells?.length) {
    return (
      <div className="coverage-map">
        <span className="hint">{t('coverageMap.noData')}</span>
      </div>
    )
  }

  const o2Bands = uniqBands(cells.map((c) => [c.o2Min, c.o2Max]))
    .sort((a, b) => b[0] - a[0]) // O₂ maior em cima
  const pBands = uniqBands(
    cells.map((c) => [c.pressureMinKpa, c.pressureMaxKpa]),
  ).sort((a, b) => a[0] - b[0])

  const userKpa = kpa(q.psi)
  const inBand = (v: number, [lo, hi]: [number, number], last: boolean) =>
    v >= lo && (last ? v <= hi + 1 : v < hi)
  const userO2 = o2Bands.findIndex((b) =>
    inBand(q.o2, b, b[1] === Math.max(...o2Bands.map((x) => x[1]))),
  )
  const userP = pBands.findIndex((b, i) =>
    inBand(userKpa, b, i === pBands.length - 1),
  )

  const cellAt = (o: [number, number], p: [number, number]) =>
    cells.find(
      (c) =>
        c.o2Min === o[0] &&
        c.o2Max === o[1] &&
        c.pressureMinKpa === p[0] &&
        c.pressureMaxKpa === p[1],
    )

  const userCell =
    userO2 >= 0 && userP >= 0 ? cellAt(o2Bands[userO2], pBands[userP]) : null

  return (
    <div className="coverage-map">
      <div className="cm-head">
        <b>
          {t('coverageMap.title')}
          <EstimatedBadge />
        </b>
        <span className="hint">
          {userCell
            ? t('coverageMap.caption', {
                o2: fmt(q.o2),
                kpa: fmt(userKpa),
                n: userCell.coverageCount,
              })
            : t('coverageMap.outside', { o2: fmt(q.o2), kpa: fmt(userKpa) })}
        </span>
      </div>
      <div
        className="cm-grid"
        style={{ gridTemplateColumns: `auto repeat(${pBands.length}, 1fr)` }}
        role="table"
        aria-label={t('coverageMap.title')}
      >
        <span className="cm-axis cm-corner">{t('coverageMap.o2Axis')}</span>
        {pBands.map((p) => (
          <span key={`p${p[0]}`} className="cm-axis" role="columnheader">
            {fmt(p[0], 0)}–{fmt(p[1], 0)}
          </span>
        ))}
        {o2Bands.map((o, oi) => (
          <Row key={`o${o[0]}`}>
            <span className="cm-axis cm-row" role="rowheader">
              {fmt(o[0], 0)}–{fmt(o[1], 0)}%
            </span>
            {pBands.map((p, pi) => {
              const c = cellAt(o, p)
              const n = c?.coverageCount ?? 0
              const you = oi === userO2 && pi === userP
              return (
                <span
                  key={`c${o[0]}-${p[0]}`}
                  className={`cm-cell ${level(n)}${you ? ' you' : ''}`}
                  role="cell"
                  title={t('coverageMap.cellTitle', { n })}
                >
                  {n}
                  {you ? (
                    <span className="cm-you">{t('coverageMap.you')}</span>
                  ) : null}
                </span>
              )
            })}
          </Row>
        ))}
      </div>
      <div className="cm-foot">
        <span className="cm-axis">{t('coverageMap.pressureAxis')}</span>
        <span className="cm-legend">
          <i className="cm-cell none" /> {t('coverageMap.legendNone')}
          <i className="cm-cell few" /> {t('coverageMap.legendFew')}
          <i className="cm-cell many" /> {t('coverageMap.legendMany')}
        </span>
      </div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'contents' }} role="row">{children}</div>
}

function level(n: number): string {
  if (n === 0) return 'none'
  if (n < 5) return 'few'
  if (n < 12) return 'some'
  return 'many'
}

function uniqBands(pairs: number[][]): [number, number][] {
  const seen = new Map<string, [number, number]>()
  for (const [a, b] of pairs) seen.set(`${a}-${b}`, [a, b])
  return [...seen.values()]
}
