import { useT } from '@/i18n'
import { SHOW_DOI, type AiMsg } from './types'

function psiHref(d: {
  id: string
  nasaPsiUrl?: string | null
}): string {
  return (
    d.nasaPsiUrl ||
    `https://psi.nasa.gov/physci/repo/data/investigations/${d.id}`
  )
}

export function SourcesPanel({ msg }: { msg: AiMsg }) {
  const t = useT()
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>{t('panels.sourcesTitle')}</b>
        <span className="hint">{t('panels.loadingSources')}</span>
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
        <b>{t('panels.sourcesTitle')}</b>
        <span className="hint" role="alert">
          {rankingError ?? t('panels.sourcesFail')}
        </span>
      </div>
    )
  }

  return (
    <div className="panel">
      <b>{t('panels.sourcesTitle')}</b>
      {r.top.length === 0 ? (
        <span className="why">{t('panels.noSources')}</span>
      ) : (
        <ul>
          {r.top.map((d) => (
            <li key={d.id}>
              {d.name}:{' '}
              <a
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
      <p className="why" style={{ marginTop: '0.75rem' }}>
        {t('panels.localContext')}
      </p>
      <ul>
        <li>
          {t('panels.atmLabel')}{' '}
          <a
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
            href="https://www.nasa.gov/flammability-of-materials-on-the-moon-fm2/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('panels.fm2Nasa')}
          </a>
        </li>
        <li>{t('panels.pressureGrav')}</li>
      </ul>
    </div>
  )
}
