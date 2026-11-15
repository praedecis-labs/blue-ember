import type { ProfileDto } from '@/services/contracts'
import type { RequestState } from '@/services/request-state'
import { PROFILE_IDS, toApiProfile } from '../adapters'
import { CRIT, PROFILES, WEIGHTS } from '../data'
import type { CritKey, ProfileId } from '../types'
import { critWeightsFromProfileDto, type CritWeights } from '../weight-map'

type Props = {
  pending: ProfileId | null
  profilesState: RequestState<ProfileDto[]>
  onSelect: (id: ProfileId) => void
  onContinue: () => void
}

function weightsFor(
  id: ProfileId,
  profilesState: RequestState<ProfileDto[]>,
): CritWeights {
  if (profilesState.status === 'ok' && profilesState.data) {
    const apiId = toApiProfile(id)
    const dto = profilesState.data.find((p) => p.id === apiId)
    if (dto) return critWeightsFromProfileDto(dto)
  }
  return WEIGHTS[id]
}

function labelFor(
  id: ProfileId,
  profilesState: RequestState<ProfileDto[]>,
): string {
  if (profilesState.status === 'ok' && profilesState.data) {
    const apiId = toApiProfile(id)
    const dto = profilesState.data.find((p) => p.id === apiId)
    if (dto?.label) return dto.label
  }
  return PROFILES[id].name
}

function maxWeight(weights: CritWeights): number {
  return Math.max(...CRIT.map(([c]) => weights[c]), 0.35)
}

export function ProfileScreen({
  pending,
  profilesState,
  onSelect,
  onContinue,
}: Props) {
  const loading =
    profilesState.status === 'idle' || profilesState.status === 'loading'
  const offlineFallback =
    profilesState.status === 'error' ||
    (profilesState.status === 'ok' && !profilesState.data?.length)

  return (
    <section id="screen-profile" className="screen">
      <div className="profile-box">
        <span className="step">Antes de começar</span>
        <h1>Quem está perguntando?</h1>
        <p className="why" style={{ maxWidth: 640 }}>
          O perfil decide o que pesa mais na hora de ordenar as investigações da
          NASA. Dá para trocar depois, no topo da tela.
        </p>
        {loading ? (
          <p className="hint" role="status">
            Carregando perfis da API…
          </p>
        ) : null}
        {profilesState.status === 'error' ? (
          <p className="hint" role="alert">
            {profilesState.message ?? 'Não foi possível carregar os perfis.'}{' '}
            Usando pesos locais temporariamente.
          </p>
        ) : null}
        {!loading && profilesState.status === 'ok' && !offlineFallback ? (
          <p className="hint" role="status">
            Pesos vindos da API.
          </p>
        ) : null}
        <div className="profiles">
          {PROFILE_IDS.map((k) => {
            const weights = weightsFor(k, profilesState)
            const barMax = maxWeight(weights)
            return (
              <button
                key={k}
                type="button"
                className="profile-opt"
                aria-pressed={k === pending}
                disabled={loading}
                onClick={() => onSelect(k)}
              >
                <b>{labelFor(k, profilesState)}</b>
                <span className="focus">{PROFILES[k].focus}</span>
                <span className="weights">
                  {CRIT.map(([c, label]) => (
                    <span className="w" key={c}>
                      <span>{label.replace(/^C\S+ /, '')}</span>
                      <i>
                        <span
                          style={{
                            width: `${(weights[c as CritKey] * 100) / barMax}%`,
                          }}
                        />
                      </i>
                      <span>{Math.round(weights[c as CritKey] * 100)}%</span>
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <div className="row">
          <button type="button" disabled={!pending || loading} onClick={onContinue}>
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

export function profileDisplayName(
  id: ProfileId,
  profilesState: RequestState<ProfileDto[]>,
): string {
  return labelFor(id, profilesState)
}
