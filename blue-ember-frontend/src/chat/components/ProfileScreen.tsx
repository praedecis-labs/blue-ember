import { CRIT, PROFILES, WEIGHTS } from '../data'
import type { ProfileId } from '../types'

type Props = {
  pending: ProfileId | null
  onSelect: (id: ProfileId) => void
  onContinue: () => void
}

export function ProfileScreen({ pending, onSelect, onContinue }: Props) {
  return (
    <section id="screen-profile" className="screen">
      <div className="profile-box">
        <span className="step">Antes de começar</span>
        <h1>Quem está perguntando?</h1>
        <p className="why" style={{ maxWidth: 640 }}>
          O perfil decide o que pesa mais na hora de ordenar as investigações da
          NASA. Dá para trocar depois, no topo da tela.
        </p>
        <div className="profiles">
          {(Object.keys(PROFILES) as ProfileId[]).map((k) => {
            const p = PROFILES[k]
            return (
              <button
                key={k}
                type="button"
                className="profile-opt"
                aria-pressed={k === pending}
                onClick={() => onSelect(k)}
              >
                <b>{p.name}</b>
                <span className="focus">{p.focus}</span>
                <span className="weights">
                  {CRIT.map(([c, label]) => (
                    <span className="w" key={c}>
                      <span>{label.replace(/^C\S+ /, '')}</span>
                      <i>
                        <span
                          style={{
                            width: `${(WEIGHTS[k][c] * 100) / 0.35}%`,
                          }}
                        />
                      </i>
                      <span>{Math.round(WEIGHTS[k][c] * 100)}%</span>
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <div className="row">
          <button type="button" disabled={!pending} onClick={onContinue}>
            Continuar
          </button>
          <span className="hint">
            {pending ? '' : 'Escolha um perfil para continuar.'}
          </span>
        </div>
      </div>
    </section>
  )
}
