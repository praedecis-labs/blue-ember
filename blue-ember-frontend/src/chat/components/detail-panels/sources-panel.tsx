import type { AiMsg } from './types'

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
  const { r, rankingStatus, rankingError } = msg

  if (rankingStatus === 'loading') {
    return (
      <div className="panel">
        <b>Fontes</b>
        <span className="hint">Carregando links oficiais…</span>
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
        <b>Fontes</b>
        <span className="hint" role="alert">
          {rankingError ?? 'Não foi possível carregar as fontes.'}
        </span>
      </div>
    )
  }

  return (
    <div className="panel">
      <b>Fontes</b>
      {r.top.length === 0 ? (
        <span className="why">Nenhuma investigação no ranking para citar.</span>
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
                {d.id} no PSI
              </a>
              {d.doi ? (
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
        Contexto local (síntese da UI, não IDs da API):
      </p>
      <ul>
        <li>
          Atmosferas:{' '}
          <a
            href="https://ntrs.nasa.gov/api/citations/20220013669/downloads/Internal%20Layout%20of%20a%20Lunar%20Surface%20Habitat.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            habitat lunar da NASA (NTRS)
          </a>
        </li>
        <li>
          Gravidade parcial:{' '}
          <a
            href="https://www.nasa.gov/flammability-of-materials-on-the-moon-fm2/"
            target="_blank"
            rel="noopener noreferrer"
          >
            FM2, NASA
          </a>
        </li>
        <li>
          Pressão × gravidade: Thomsen e Olson, Proc. Combust. Inst. 37 (2019)
        </li>
      </ul>
    </div>
  )
}
