import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
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
    <section
      id="screen-profile"
      className="screen flex min-h-0 items-center justify-center overflow-auto p-4 md:p-10"
    >
      <div className="flex w-full max-w-4xl flex-col gap-4 md:gap-5">
        <Badge variant="secondary" size="sm" className="w-fit uppercase tracking-wide">
          {t('profile.step')}
        </Badge>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[26px]">
            {t('profile.title')}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">{t('profile.why')}</p>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground" role="status">
            {t('profile.loading')}
          </p>
        ) : null}
        {profilesState.status === 'error' ? (
          <p className="text-xs text-destructive" role="alert">
            {profilesState.message ?? t('profile.apiError')}
          </p>
        ) : null}
        {!loading && profilesState.status === 'ok' && !offlineFallback ? (
          <p className="text-xs text-muted-foreground" role="status">
            {t('profile.apiOk')}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-3.5">
          {PROFILE_IDS.map((k) => {
            const weights = weightsFor(k, profilesState)
            const selected = k === pending
            return (
              <Card
                key={k}
                role="button"
                tabIndex={loading ? -1 : 0}
                aria-pressed={selected}
                aria-disabled={loading}
                onClick={() => {
                  if (!loading) onSelect(k)
                }}
                onKeyDown={(e) => {
                  if (loading) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(k)
                  }
                }}
                className={cn(
                  'cursor-pointer text-left shadow-none hover:shadow-none',
                  loading && 'pointer-events-none opacity-50',
                  selected
                    ? '!border-[#1B2B85] !bg-[#1B2B85] text-white hover:!border-[#1B2B85]'
                    : '!bg-[var(--white)]',
                )}
              >
                <CardHeader className="gap-2 p-4 md:p-[22px]">
                  <CardTitle
                    className={cn(
                      'text-lg',
                      selected ? '!text-white' : '!text-[var(--navy)]',
                    )}
                  >
                    {labelFor(k, profilesState, t(profileNameKey(k)))}
                  </CardTitle>
                  <CardDescription
                    className={cn(
                      selected ? '!text-white/80' : '!text-[var(--sub)]',
                    )}
                  >
                    {t(profileFocusKey(k))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 px-4 pb-4 md:px-[22px] md:pb-[22px]">
                  {CRIT_KEYS.map((c) => {
                    const pct = Math.round(weights[c] * 100)
                    return (
                      <div
                        key={c}
                        className={cn(
                          'grid grid-cols-[72px_1fr_28px] items-center gap-2 text-xs md:grid-cols-[92px_1fr_34px]',
                          selected ? 'text-white/90' : 'text-[var(--sub)]',
                        )}
                      >
                        <span className="truncate">{critShort(t, c)}</span>
                        <div
                          className={cn(
                            'h-1.5 overflow-hidden rounded-full',
                            selected ? 'bg-white/20' : 'bg-[var(--field)]',
                          )}
                        >
                          <div
                            className={cn(
                              'h-full rounded-full',
                              selected
                                ? 'bg-[var(--yellow)]'
                                : 'bg-[var(--sky)]',
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-right tabular-nums">{pct}%</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            size="lg"
            disabled={!pending || loading}
            onClick={onContinue}
            className="!bg-[var(--yellow)] !text-[var(--ink)] hover:!bg-[var(--yellow)]/90"
          >
            {t('profile.continue')}
          </Button>
          <span className="text-xs text-muted-foreground">
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
