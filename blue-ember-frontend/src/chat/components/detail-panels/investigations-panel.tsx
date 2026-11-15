import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n'
import { WEIGHTS } from '../../domain/data'
import { f1, fmt } from '../../domain/engine'
import { psiUrl } from '../../domain/psi-url'
import type { CritKey, CritWeights } from '../../domain/types'
import { PanelShell, PanelSkeleton } from './panel-shell'
import { SHOW_DOI, provenanceLabel, type AiMsg } from './types'

const CRIT_KEYS: CritKey[] = ['prox', 'moc', 'spread', 'hrr', 'tox']

function psiHref(d: {
  id: string
  nasaPsiUrl?: string | null
}): string {
  return psiUrl(d)
}

function hasFlow(flow: [number, number]): boolean {
  return !(flow[0] === 0 && flow[1] === 0)
}

const linkClass = 'text-[13px] font-medium text-[var(--blue)] no-underline hover:underline'

export function InvestigationsPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, prof, rankingStatus, rankingError, weights } = msg
  const panelWeights: CritWeights = weights ?? WEIGHTS[prof]
  const profileName = t(`profile.${prof}.name`)

  if (rankingStatus === 'loading') {
    return (
      <PanelShell title={t('panels.nasaInv')}>
        <span className="text-xs text-muted-foreground">{t('panels.loadingInv')}</span>
        <PanelSkeleton lines={3} />
      </PanelShell>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <PanelShell title={t('panels.nasaInv')}>
        <span className="text-xs text-muted-foreground" role="alert">
          {rankingError ?? t('panels.invFail')}
        </span>
      </PanelShell>
    )
  }

  if (r.top.length === 0) {
    return (
      <PanelShell title={t('panels.nasaInv')}>
        <span className="text-xs text-muted-foreground">{t('panels.noInv')}</span>
      </PanelShell>
    )
  }

  return (
    <PanelShell
      title={t('panels.nasaInv')}
      headerExtra={
        <span className="text-xs text-muted-foreground">
          {t('panels.profileWeights', { name: profileName })}
        </span>
      }
    >
      <span className="text-xs text-muted-foreground">{t('panels.invHint')}</span>
      {r.top.map((d, i) => (
        <div
          key={d.id}
          className="flex flex-col gap-2.5 rounded-xl bg-[var(--white)] p-3.5"
        >
          <div className="flex gap-3 items-start min-w-0">
            <span className="min-w-4 text-lg font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <b className="text-sm leading-snug">
                {d.name}{' '}
                <span className="text-[13px] font-normal text-muted-foreground">
                  · {d.id}
                </span>
              </b>
              <span className="text-sm text-[var(--sub)]">
                {d.what}. O₂:{' '}
                {d.o2[0] === d.o2[1]
                  ? fmt(d.o2[0])
                  : `${fmt(d.o2[0])}–${fmt(d.o2[1])}`}
                %
                {hasFlow(d.flow) ? (
                  <>
                    {' '}
                    · {t('panels.flowLabel')}:{' '}
                    {d.flow[0] === d.flow[1]
                      ? d.flow[0]
                      : `${d.flow[0]}–${d.flow[1]}`}{' '}
                    cm/s
                  </>
                ) : null}{' '}
                · {d.where}.
                {d.ppO2Kpa != null ? (
                  <>
                    {' '}
                    · {t('panels.ppO2')}: {fmt(d.ppO2Kpa)} kPa
                  </>
                ) : null}
                {d.category ? (
                  <>
                    {' '}
                    ·{' '}
                    {d.category === 'prevencao'
                      ? t('category.prevencao')
                      : d.category === 'deteccao'
                        ? t('category.deteccao')
                        : d.category === 'supressao'
                          ? t('category.supressao')
                          : t('category.outro')}
                  </>
                ) : null}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {d.winningCondition ? (
                  <Badge variant="warning" size="sm" className="h-auto">
                    {provenanceLabel(
                      d.winningCondition.provenance,
                      t('panels.provenanceEstimated'),
                      t('panels.provenanceMeasured'),
                      t('panels.provenanceUnknown'),
                    )}
                  </Badge>
                ) : null}
                <a
                  className={linkClass}
                  href={psiHref(d)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('panels.viewPsi')}
                </a>
                {SHOW_DOI && d.doi ? (
                  <>
                    {' '}
                    ·{' '}
                    <a
                      className={linkClass}
                      href={`https://doi.org/${d.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      DOI
                    </a>
                  </>
                ) : null}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <b className="block text-[22px] font-bold text-[var(--blue)]">
                {f1(d.nota)}
              </b>
              <small className="block text-[11px] text-muted-foreground">
                {t('panels.scoreOutOf10')}
              </small>
              <small className="block text-[11px] text-muted-foreground">
                {t('panels.relevance', {
                  n: f1((d.vals.prox ?? 0) * 10),
                })}
              </small>
            </div>
          </div>

          <details className="rounded-[10px] bg-[var(--bg)] p-2.5 open:[&_summary]:mb-0">
            <summary className="cursor-pointer list-none text-[13px] font-medium text-[var(--blue)] [&::-webkit-details-marker]:hidden">
              <span aria-hidden>▸ </span>
              {t('panels.whyScore', { have: d.have })}
            </summary>
            <div className="mt-2.5 flex flex-col gap-1.5">
              {CRIT_KEYS.map((k) =>
                d.vals[k] === null ? (
                  <div
                    key={k}
                    className="grid grid-cols-[84px_1fr_52px] items-center gap-2 text-xs text-muted-foreground md:grid-cols-[110px_1fr_58px] md:text-[13px] lg:grid-cols-[124px_1fr_64px]"
                  >
                    <span className="truncate">{t(`crit.${k}`)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--white)]" />
                    <span className="text-right italic font-normal">
                      {t('panels.noData')}
                    </span>
                  </div>
                ) : (
                  <div
                    key={k}
                    className="grid grid-cols-[84px_1fr_52px] items-center gap-2 text-xs md:grid-cols-[110px_1fr_58px] md:text-[13px] lg:grid-cols-[124px_1fr_64px]"
                  >
                    <span className="truncate">{t(`crit.${k}`)}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--white)]">
                      <div
                        className="h-full rounded-full bg-[var(--blue)]"
                        style={{
                          width: `${Math.round((d.vals[k] as number) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-right font-semibold tabular-nums">
                      {fmt((d.vals[k] as number) * 10)} ·{' '}
                      {Math.round(panelWeights[k] * 100)}%
                    </span>
                  </div>
                ),
              )}
              <span className="text-xs text-muted-foreground">
                {t('panels.barsHint')}
              </span>
            </div>
          </details>
        </div>
      ))}
    </PanelShell>
  )
}
