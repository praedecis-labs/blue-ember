import { useT } from '@/i18n'
import type { ProfileDto } from '@/services/shared/contracts'
import type { RequestState } from '@/services/shared/request-state'
import { PROFILE_IDS, toApiProfile } from '../domain/adapters'
import { WEIGHTS } from '../domain/data'
import type { CritKey, ProfileId } from '../domain/types'
import { critWeightsFromProfileDto, type CritWeights } from '../domain/weight-map'

type Props = {
  pending: ProfileId | null
  profilesState: RequestState<ProfileDto[]>
  onSelect: (id: ProfileId) => void
  onContinue: () => void
}

const CRIT_KEYS: CritKey[] = ['prox', 'moc', 'spread', 'hrr', 'tox']

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
  fallback: string,
): string {
  // O nome traduzido tem prioridade: o rótulo da API vem sempre em português
  if (fallback && fallback !== id) return fallback
  if (profilesState.status === 'ok' && profilesState.data) {
    const apiId = toApiProfile(id)
    const dto = profilesState.data.find((p) => p.id === apiId)
    if (dto?.label) return dto.label
  }
  return fallback
}

function profileNameKey(id: ProfileId): string {
  return `profile.${id}.name`
}

function profileFocusKey(id: ProfileId): string {
  return `profile.${id}.focus`
}

function critShort(t: (k: string) => string, c: CritKey): string {
  return t(`crit.${c}`).replace(/^C\d+\s+/i, '')
}

export function ProfileScreen({
  pending,
  profilesState,
  onSelect,
  onContinue,
}: Props) {
  const t = useT()
  const loading =
    profilesState.status === 'idle' || profilesState.status === 'loading'
  const offlineFallback =
    profilesState.status === 'error' ||
    (profilesState.status === 'ok' && !profilesState.data?.length)

  return (
    <section id="screen-profile" className="screen">
      <div className="profile-box">
        <span className="step">{t('profile.step')}</span>
        <h1>{t('profile.title')}</h1>
        <p className="why" style={{ maxWidth: 640 }}>
          {t('profile.why')}
        </p>
        {loading ? (
          <p className="hint" role="status">
            {t('profile.loading')}
          </p>
        ) : null}
        {profilesState.status === 'error' ? (
          <p className="hint" role="alert">
            {profilesState.message ?? t('profile.apiError')}
          </p>
        ) : null}
        {!loading && profilesState.status === 'ok' && !offlineFallback ? (
          <p className="hint" role="status">
            {t('profile.apiOk')}
          </p>
        ) : null}
        <div className="profiles">
          {PROFILE_IDS.map((k) => {
            const weights = weightsFor(k, profilesState)
            return (
              <button
                key={k}
                type="button"
                className="profile-opt"
                aria-pressed={k === pending}
                disabled={loading}
                onClick={() => onSelect(k)}
              >
                <b>
                  {labelFor(k, profilesState, t(profileNameKey(k)))}
                </b>
                <span className="focus">{t(profileFocusKey(k))}</span>
                <span className="weights">
                  {CRIT_KEYS.map((c) => (
                    <span className="w" key={c}>
                      <span>{critShort(t, c)}</span>
                      <i>
                        <span
                          style={{
                            width: `${Math.round(weights[c] * 100)}%`,
                          }}
                        />
                      </i>
                      <span>{Math.round(weights[c] * 100)}%</span>
                    </span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>
        <div className="row">
          <button type="button" disabled={!pending || loading} onClick={onContinue}>
            {t('profile.continue')}
          </button>
          <span className="hint">
            {pending ? '' : t('profile.pick')}
          </span>
        </div>
      </div>
    </section>
  )
}

export function profileDisplayName(
  id: ProfileId,
  profilesState: RequestState<ProfileDto[]>,
  fallbackName?: string,
): string {
  return labelFor(id, profilesState, fallbackName ?? id)
}
