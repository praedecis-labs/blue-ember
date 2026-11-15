import { CRIT, PROFILES, WEIGHTS } from '../../data'
import { f1, fmt } from '../../engine'
import type { CritWeights } from '../../types'
import type { AiMsg } from './types'

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
  const { r, prof, rankingStatus, rankingError, weights } = msg
  const panelWeights: CritWeights = weights ?? WEIGHTS[prof]

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>Investigações da NASA</b>
        <span className="hint">Carregando ranking da API…</span>
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
        <b>Investigações da NASA</b>
        <span className="hint" role="alert">
          {rankingError ?? 'Não foi possível carregar o ranking.'}
        </span>
      </div>
    )
  }

  if (r.top.length === 0) {
    return (
      <div className="panel">
        <b>Investigações da NASA</b>
        <span className="hint">
          Nenhuma investigação featured para este perfil e ambiente.
        </span>
      </div>
    )
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Investigações da NASA</b>
        <span className="hint">Pesos do perfil {PROFILES[prof].name}</span>
      </div>
      <span className="hint">
        Ordenadas pelo ranking fire-safety da API (C₁–C₅ com pesos do perfil).
      </span>
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
                    · fluxo:{' '}
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
                  Ver no PSI →
                </a>
                {d.doi ? (
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
              <small>nota /10</small>
              <small>relevância {f1((d.vals.prox ?? 0) * 10)}</small>
            </div>
          </div>
          <details className="crit">
            <summary>
              Por que essa nota · {d.have} de 5 critérios com dado
            </summary>
            <div className="bars">
              {CRIT.map(([k, l]) =>
                d.vals[k] === null ? (
                  <div className="bar nodata" key={k}>
                    <span>{l}</span>
                    <div className="track" />
                    <span className="v">sem dado</span>
                  </div>
                ) : (
                  <div className="bar" key={k}>
                    <span>{l}</span>
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
              <span className="hint">
                Valor de 0 a 10 · peso do perfil (API). &quot;Sem dado&quot;: a
                investigação não mediu esse critério.
              </span>
            </div>
          </details>
        </div>
      ))}
    </div>
  )
}
