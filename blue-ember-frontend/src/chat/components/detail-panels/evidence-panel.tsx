import { useT } from '@/i18n'
import { PanelShell, PanelSkeleton } from './panel-shell'
import type { AiMsg } from './types'

export function EvidencePanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <PanelShell title={t('panels.evidenceTitle')}>
        <span className="text-xs text-muted-foreground">
          {t('panels.loadingEvidence')}
        </span>
        <PanelSkeleton />
      </PanelShell>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <PanelShell title={t('panels.evidenceTitle')}>
        <span className="text-xs text-muted-foreground" role="alert">
          {rankingError ?? t('panels.evidenceFail')}
        </span>
      </PanelShell>
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
    <PanelShell title={t('panels.evidenceTitleNamed', { level: levelShort })}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-[var(--white)] p-3">
          <small className="text-xs text-muted-foreground">
            {t('panels.reliabilityEnv')}
          </small>
          <b className="text-base">{r.partialG ? t('panels.low') : t('panels.high')}</b>
          <small className="text-xs text-muted-foreground">
            {r.partialG ? t('panels.partialGAlert') : t('panels.noPartialGAlert')}
          </small>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-[var(--white)] p-3">
          <small className="text-xs text-muted-foreground">
            {t('panels.nearTarget')}
          </small>
          <b className="text-base">
            {r.near} / {denom}
          </b>
          <small className="text-xs text-muted-foreground">
            {t('panels.nearTargetHint')}
          </small>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[10px] bg-[var(--white)] p-3">
          <small className="text-xs text-muted-foreground">
            {t('panels.testedWhere')}
          </small>
          <b className="text-base">{where || '—'}</b>
          <small className="text-xs text-muted-foreground">
            {where.includes('Cygnus')
              ? t('panels.cygnusHint')
              : where
                ? t('panels.platformsHint')
                : t('panels.awaitingInv')}
          </small>
        </div>
      </div>
    </PanelShell>
  )
}
