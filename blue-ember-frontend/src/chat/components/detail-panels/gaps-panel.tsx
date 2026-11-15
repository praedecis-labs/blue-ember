import type { AiMsg } from './types'

export function GapsPanel({ msg }: { msg: AiMsg }) {
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel gaps">
        <b>O que falta testar</b>
        <span className="hint">Carregando lacunas da API…</span>
        <div className="skel-stack" aria-hidden>
          <div className="skel-line" />
          <div className="skel-line short" />
        </div>
      </div>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <div className="panel gaps">
        <b>O que falta testar</b>
        <span className="hint" role="alert">
          {rankingError ?? 'Não foi possível carregar as lacunas.'}
        </span>
      </div>
    )
  }

  const hasWarning = Boolean(r.partialGravityWarning)
  const hasGaps = r.gaps.length > 0

  return (
    <div className="panel gaps">
      <b>O que falta testar</b>
      {hasGaps ? (
        <ul>
          {r.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : !hasWarning ? (
        <span className="why">Nenhuma lacuna importante para essas condições.</span>
      ) : null}
      {hasWarning ? (
        <div className="test">
          <b style={{ color: 'var(--navy)' }}>Gravidade parcial (API):</b>{' '}
          {r.partialGravityWarning}
        </div>
      ) : null}
    </div>
  )
}
