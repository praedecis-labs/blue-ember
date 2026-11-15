import { useT } from '@/i18n'
import { WEIGHTS } from '../../domain/data'
import { f1, fmt } from '../../domain/engine'
import type { CritKey, CritWeights } from '../../domain/types'
import { SHOW_DOI, type AiMsg } from './types'

const CRIT_KEYS: CritKey[] = ['prox', 'moc', 'spread', 'hrr', 'tox']

function psiHref(d: {
  id: string
  nasaPsiUrl?: string | null
}): string {
  return (
    d.nasaPsiUrl ||
    `https://psi.nasa.gov/physci/repo/data/investigations/${d.id}`
  )
}

function hasFlow(flow: [number, number]): boolean {
  return !(flow[0] === 0 && flow[1] === 0)
}

export function InvestigationsPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, prof, rankingStatus, rankingError, weights } = msg
  const panelWeights: CritWeights = weights ?? WEIGHTS[prof]
  const profileName = t(`profile.${prof}.name`)

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>{t('panels.nasaInv')}</b>
        <span className="hint">{t('panels.loadingInv')}</span>
        <div className="skel-stack" aria-hidden>
          <div className="skel-line" />
          <div className="skel-line" />
          <div className="skel-line short" />
        </div>
      </div>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <div className="panel">
        <b>{t('panels.nasaInv')}</b>
        <span className="hint" role="alert">
          {rankingError ?? t('panels.invFail')}
        </span>
      </div>
    )
  }

  if (r.top.length === 0) {
    return (
      <div className="panel">
        <b>{t('panels.nasaInv')}</b>
        <span className="hint">{t('panels.noInv')}</span>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>{t('panels.nasaInv')}</b>
        <span className="hint">
          {t('panels.profileWeights', { name: profileName })}
        </span>
      </div>
      <span className="hint">{t('panels.invHint')}</span>
      {r.top.map((d, i) => (
        <div className="item" key={d.id}>
          <div className="top">
            <span className="n">{i + 1}</span>
            <div className="body">
              <b>
                {d.name}{' '}
                <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>
                  · {d.id}
                </span>
              </b>
              <span className="why">
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
              </span>
              <span>
                <a href={psiHref(d)} target="_blank" rel="noopener noreferrer">
                  {t('panels.viewPsi')}
                </a>
                {SHOW_DOI && d.doi ? (
                  <>
                    {' '}
                    ·{' '}
                    <a
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
            <div className="score">
              <b>{f1(d.nota)}</b>
              <small>{t('panels.scoreOutOf10')}</small>
              <small>
                {t('panels.relevance', {
                  n: f1((d.vals.prox ?? 0) * 10),
                })}
              </small>
            </div>
          </div>
          <details className="crit">
            <summary>
              {t('panels.whyScore', { have: d.have })}
            </summary>
            <div className="bars">
              {CRIT_KEYS.map((k) =>
                d.vals[k] === null ? (
                  <div className="bar nodata" key={k}>
                    <span>{t(`crit.${k}`)}</span>
                    <div className="track" />
                    <span className="v">{t('panels.noData')}</span>
                  </div>
                ) : (
                  <div className="bar" key={k}>
                    <span>{t(`crit.${k}`)}</span>
                    <div className="track">
                      <div
                        className="fill"
                        style={{ width: `${Math.round((d.vals[k] as number) * 100)}%` }}
                      />
                    </div>
                    <span className="v">
                      {fmt((d.vals[k] as number) * 10)} ·{' '}
                      {Math.round(panelWeights[k] * 100)}%
                    </span>
                  </div>
                ),
              )}
              <span className="hint">{t('panels.barsHint')}</span>
            </div>
          </details>
        </div>
      ))}
    </div>
  )
}
