import { useT } from '@/i18n'
import { psiUrl } from '../../domain/psi-url'
import { PanelShell, PanelSkeleton } from './panel-shell'
import { SHOW_DOI, type AiMsg } from './types'

function psiHref(d: {
  id: string
  nasaPsiUrl?: string | null
}): string {
  return psiUrl(d)
}

const linkClass = 'text-[var(--blue)] no-underline hover:underline'

export function SourcesPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <PanelShell title={t('panels.sourcesTitle')}>
        <span className="text-xs text-muted-foreground">
          {t('panels.loadingSources')}
        </span>
        <PanelSkeleton />
      </PanelShell>
    )
  }

  if (rankingStatus === 'error') {
    return (
      <PanelShell title={t('panels.sourcesTitle')}>
        <span className="text-xs text-muted-foreground" role="alert">
          {rankingError ?? t('panels.sourcesFail')}
        </span>
      </PanelShell>
    )
  }

  return (
    <PanelShell title={t('panels.sourcesTitle')}>
      {r.top.length === 0 ? (
        <span className="text-sm text-[var(--sub)]">{t('panels.noSources')}</span>
      ) : (
        <ul className="flex list-disc flex-col gap-1 pl-4.5 text-sm">
          {r.top.map((d) => (
            <li key={d.id}>
              {d.name}:{' '}
              <a
                className={linkClass}
                href={psiHref(d)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('panels.onPsi', { id: d.id })}
              </a>
              {SHOW_DOI && d.doi ? (
                <>
                  {' '}
                  · DOI{' '}
                  <a
                    className={linkClass}
                    href={`https://doi.org/${d.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {d.doi}
                  </a>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-[var(--sub)]">{t('panels.localContext')}</p>
      <ul className="flex list-disc flex-col gap-1 pl-4.5 text-sm">
        <li>
          {t('panels.atmLabel')}{' '}
          <a
            className={linkClass}
            href="https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('panels.lunarHabitat')}
          </a>
        </li>
        <li>
          {t('panels.partialGLabel')}{' '}
          <a
            className={linkClass}
            href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/flammability-of-materials-on-the-moon-fm2/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('panels.fm2Nasa')}
          </a>
        </li>
        <li>{t('panels.pressureGrav')}</li>
      </ul>
    </PanelShell>
  )
}
