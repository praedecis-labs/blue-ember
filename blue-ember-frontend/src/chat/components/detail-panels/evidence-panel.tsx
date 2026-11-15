import { useT } from '@/i18n'
import type { AiMsg } from './types'

export function EvidencePanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>{t('panels.evidenceTitle')}</b>
        <span className="hint">{t('panels.loadingEvidence')}</span>
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
        <b>{t('panels.evidenceTitle')}</b>
        <span className="hint" role="alert">
          {rankingError ?? t('panels.evidenceFail')}
        </span>
      </div>
    )
  }

  const where = [...new Set(r.top.map((d) => d.where).filter(Boolean))].join(
    ' · ',
  )
  const denom = r.featuredCount || '—'
  const levelShort = r.level[1]
    .replace(/^Evidência\s+/i, '')
    .replace(/\s+evidence$/i, '')

  return (
    <div className="panel">
      <b>{t('panels.evidenceTitleNamed', { level: levelShort })}</b>
      <div className="evidence">
        <div className="ev">
          <small>{t('panels.reliabilityEnv')}</small>
          <b>{r.partialG ? t('panels.low') : t('panels.high')}</b>
          <small>
            {r.partialG ? t('panels.partialGAlert') : t('panels.noPartialGAlert')}
          </small>
        </div>
        <div className="ev">
          <small>{t('panels.nearTarget')}</small>
          <b>
            {r.near} / {denom}
          </b>
          <small>{t('panels.nearTargetHint')}</small>
        </div>
        <div className="ev">
          <small>{t('panels.testedWhere')}</small>
          <b>{where || '—'}</b>
          <small>
            {where.includes('Cygnus')
              ? t('panels.cygnusHint')
              : where
                ? t('panels.platformsHint')
                : t('panels.awaitingInv')}
          </small>
        </div>
      </div>
    </div>
  )
}
