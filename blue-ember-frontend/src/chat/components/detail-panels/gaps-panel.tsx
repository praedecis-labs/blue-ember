import type { AiMsg } from './types'

export function GapsPanel({ msg }: { msg: AiMsg }) {
  const { r } = msg
  return (
    <div className="panel gaps">
      <b>O que falta testar</b>
      {r.gaps.length ? (
        <ul>
          {r.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : (
        <span className="why">Nenhuma lacuna importante para essas condições.</span>
      )}
      {r.partialG ? (
        <div className="test">
          <b style={{ color: 'var(--navy)' }}>Ensaio sugerido em solo:</b> queimar
          o material em câmara com pressão reduzida, técnica usada para imitar
          gravidade reduzida (a ~30 kPa a propagação ficou parecida com a de
          microgravidade).
        </div>
      ) : null}
    </div>
  )
}

