import { useT } from '@/i18n'
import { PanelShell, PanelSkeleton } from './panel-shell'
import type { AiMsg } from './types'

export function GapsPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <PanelShell title={t('panels.gapsTitle')} variant="gaps">
        <span className="text-xs text-muted-foreground">{t('panels.loadingGaps')}</span>
        <PanelSkeleton />
      </PanelShell>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <PanelShell title={t('panels.gapsTitle')} variant="gaps">
        <span className="text-xs text-muted-foreground" role="alert">
          {rankingError ?? t('panels.gapsFail')}
        </span>
      </PanelShell>
    )
  }

  const hasWarning = Boolean(r.partialGravityWarning)
  const hasGaps = r.gaps.length > 0

  return (
    <PanelShell title={t('panels.gapsTitle')} variant="gaps">
      {hasGaps ? (
        <ul className="flex list-disc flex-col gap-1 pl-4.5 text-sm">
          {r.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : !hasWarning ? (
        <span className="text-sm text-[var(--sub)]">{t('panels.noGaps')}</span>
      ) : null}
      {hasWarning ? (
        <div className="rounded-[10px] bg-[var(--white)] p-2.5 text-sm">
          <b className="text-[var(--navy)]">{t('panels.partialGApi')}</b>{' '}
          {r.partialGravityWarning}
        </div>
      ) : null}
    </PanelShell>
  )
}
