import { DATA } from '../../data'
import type { AiMsg } from './types'

export function EvidencePanel({ msg }: { msg: AiMsg }) {
  const { r } = msg
  const where = [...new Set(r.top.map((d) => d.where))].join(' e ')
  return (
    <div className="panel">
      <b>Força da evidência: {r.level[1].replace('Evidência ', '')}</b>
      <div className="evidence">
        <div className="ev">
          <small>Confiabilidade no ambiente</small>
          <b>{r.partialG ? 'Baixa' : 'Alta'}</b>
          <small>
            {r.partialG
              ? 'sem teste em gravidade parcial'
              : 'testado em microgravidade'}
          </small>
        </div>
        <div className="ev">
          <small>Investigações em condições próximas</small>
          <b>
            {r.near} de {DATA.length}
          </b>
          <small>O₂ até 2 pontos e fluxo até 5 cm/s</small>
        </div>
        <div className="ev">
          <small>Onde foi testado</small>
          <b>{where}</b>
          <small>
            {where.includes('Cygnus')
              ? 'Cygnus: cargueiro sem tripulação'
              : 'laboratório na ISS'}
          </small>
        </div>
      </div>
    </div>
  )
}

