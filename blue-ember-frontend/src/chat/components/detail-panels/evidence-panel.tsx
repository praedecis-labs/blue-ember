import type { AiMsg } from './types'

export function EvidencePanel({ msg }: { msg: AiMsg }) {
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>Força da evidência</b>
        <span className="hint">Derivando evidência do ranking e gaps da API…</span>
        <div className="skel-stack" aria-hidden>
          <div className="skel-line" />
          <div className="skel-line short" />
        </div>
      </div>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <div className="panel">
        <b>Força da evidência</b>
        <span className="hint" role="alert">
          {rankingError ?? 'Não foi possível carregar a evidência.'}
        </span>
      </div>
    )
  }

  const where = [...new Set(r.top.map((d) => d.where).filter(Boolean))].join(
    ' e ',
  )
  const denom = r.featuredCount || '—'

  return (
    <div className="panel">
      <b>Força da evidência: {r.level[1].replace('Evidência ', '')}</b>
      <div className="evidence">
        <div className="ev">
          <small>Confiabilidade no ambiente</small>
          <b>{r.partialG ? 'Baixa' : 'Alta'}</b>
          <small>
            {r.partialG
              ? 'alerta de gravidade parcial (API)'
              : 'sem alerta de gravidade parcial'}
          </small>
        </div>
        <div className="ev">
          <small>Investigações perto do alvo</small>
          <b>
            {r.near} de {denom}
          </b>
          <small>±5% O₂ e ±15 kPa dos alvos da missão</small>
        </div>
        <div className="ev">
          <small>Onde foi testado</small>
          <b>{where || '—'}</b>
          <small>
            {where.includes('Cygnus')
              ? 'Cygnus: cargueiro sem tripulação'
              : where
                ? 'plataformas do ranking'
                : 'aguardando investigações'}
          </small>
        </div>
      </div>
    </div>
  )
}
