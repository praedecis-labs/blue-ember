import { useState } from 'react'
import type { EnvironmentDto } from '@/services/contracts'
import { LOGO_SRC } from '../data'
import { f1, summaryFor } from '../engine'
import type { ChatMessage, PanelId, QueryState } from '../types'
import { DetailPanels } from './detail-panels'

type Props = {
  msg: Extract<ChatMessage, { kind: 'ai' }>
  onFollowup: (text: string) => void
  onApplyConditions: (q: QueryState) => void
  environments?: EnvironmentDto[] | null
}

export function AiBubble({
  msg,
  onFollowup,
  onApplyConditions,
  environments = null,
}: Props) {
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null)
  const { q, r, missing, rankingStatus, rankingError } = msg
  const best = r.top[0]

  function toggle(panel: PanelId) {
    setOpenPanel((cur) => (cur === panel ? null : panel))
  }

  // Veredito único no topo: a hipótese (quando houver) + a força da evidência numa linha só
  const hyp = msg.verdict && msg.verdict[0] !== 'unknown' ? msg.verdict : null
  const verdictTone = hyp ? hyp[0] : r.above ? 'weak' : r.level[0]
  const verdictTitle = hyp
    ? hyp[1]
    : r.above
      ? 'Risco maior do que os testes mostram'
      : r.level[0] === 'strong'
        ? 'Há testes da NASA nessas condições'
        : r.level[0] === 'moderate'
          ? 'Há testes parecidos, com diferenças'
          : 'Poucos testes parecidos com o seu caso'
  const verdictKicker = hyp
    ? `Sua hipótese · ${r.level[1].toLowerCase()}`
    : r.level[1]

  const invCountLabel =
    rankingStatus === 'loading'
      ? '…'
      : rankingStatus === 'error'
        ? '!'
        : String(r.top.length)

  return (
    <div className="msg-ai" id={msg.id}>
      <div className="head">
        <span className="by">
          <img className="avatar" src={LOGO_SRC} alt="" />
          Blue Ember
        </span>
      </div>
      {msg.lead ? <span className="why">{msg.lead}</span> : null}
      <div className={`verdict-big ${verdictTone}`} role="status">
        <span className="kicker">{verdictKicker}</span>
        <span className="title">{verdictTitle}</span>
      </div>
      <p className="summary">{summaryFor(q, r)}</p>
      {rankingStatus === 'loading' ? (
        <span className="best">Carregando ranking da API…</span>
      ) : rankingStatus === 'error' ? (
        <span className="best" role="alert">
          {rankingError ?? 'Falha ao carregar o ranking.'}
        </span>
      ) : best ? (
        <span className="best">
          Mais relevante: <b>{best.name}</b> ({best.id}) · nota {f1(best.nota)}
          /10 · {best.where}
        </span>
      ) : (
        <span className="best">Nenhuma investigação no topo do ranking.</span>
      )}
      <span className="ai-label">
        Score via API · síntese local nos textos · abra as fontes nos detalhes
      </span>
      <div className="details" role="group" aria-label="Detalhes da resposta">
        <button
          type="button"
          aria-expanded={openPanel === 'cond'}
          onClick={() => toggle('cond')}
        >
          Condições usadas
          {missing.length ? (
            <span className="count warn">{missing.length} padrão</span>
          ) : null}
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'inv'}
          onClick={() => toggle('inv')}
        >
          Investigações <span className="count">{invCountLabel}</span>
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'ev'}
          onClick={() => toggle('ev')}
        >
          Força da evidência
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'gaps'}
          onClick={() => toggle('gaps')}
        >
          O que falta testar <span className="count">{r.gaps.length}</span>
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'src'}
          onClick={() => toggle('src')}
        >
          Fontes
        </button>
      </div>
      <div className="panel-slot">
        <DetailPanels
          msg={msg}
          openPanel={openPanel}
          onApplyConditions={onApplyConditions}
          environments={environments}
        />
      </div>
      <div className="followups">
        {q.env !== 'iss' ? (
          <button
            type="button"
            onClick={() => onFollowup('E se fosse na ISS a 14,7 psi e 21%?')}
          >
            E se fosse na ISS?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup('E no habitat lunar a 8,2 psi e 34%?')}
          >
            E no habitat lunar?
          </button>
        )}
        {q.flow !== 0 ? (
          <button type="button" onClick={() => onFollowup('E com ar parado?')}>
            E com ar parado?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup('E com ventilação de 20 cm/s?')}
          >
            E com 20 cm/s?
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onFollowup(
              `E se o material for ${q.material === 'plastico' ? 'tecido' : 'plástico acrílico'}?`,
            )
          }
        >
          E com {q.material === 'plastico' ? 'tecido' : 'acrílico'}?
        </button>
      </div>
    </div>
  )
}
