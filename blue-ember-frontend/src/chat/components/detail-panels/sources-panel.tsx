import type { AiMsg } from './types'

export function SourcesPanel({ msg }: { msg: AiMsg }) {
  const { r } = msg
  return (
    <div className="panel">
      <b>Fontes</b>
      <ul>
        {r.top.map((d) => (
          <li key={d.id}>
            {d.name}:{' '}
            <a
              href={
                d.nasaPsiUrl ||
                `https://psi.nasa.gov/physci/repo/data/investigations/${d.id}`
              }
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
        <li>Pressão × gravidade: Thomsen e Olson, Proc. Combust. Inst. 37 (2019)</li>
      </ul>
    </div>
  )
}

