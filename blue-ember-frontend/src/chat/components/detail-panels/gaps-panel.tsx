import { useT } from '@/i18n'
import type { AiMsg } from './types'

export function GapsPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel gaps">
        <b>{t('panels.gapsTitle')}</b>
        <span className="hint">{t('panels.loadingGaps')}</span>
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
        <b>{t('panels.gapsTitle')}</b>
        <span className="hint" role="alert">
          {rankingError ?? t('panels.gapsFail')}
        </span>
      </div>
    )
  }

  const hasWarning = Boolean(r.partialGravityWarning)
  const hasGaps = r.gaps.length > 0

  return (
    <div className="panel gaps">
      <b>{t('panels.gapsTitle')}</b>
      {hasGaps ? (
        <ul>
          {r.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      ) : !hasWarning ? (
        <span className="why">{t('panels.noGaps')}</span>
      ) : null}
      {hasWarning ? (
        <div className="test">
          <b style={{ color: 'var(--navy)' }}>{t('panels.partialGApi')}</b>{' '}
          {r.partialGravityWarning}
        </div>
      ) : null}
    </div>
  )
}
