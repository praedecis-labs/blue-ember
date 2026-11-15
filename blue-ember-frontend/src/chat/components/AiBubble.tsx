import { useState } from 'react'
import { useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/contracts'
import { LOGO_SRC } from '../data'
import { f1, summaryFor } from '../engine'
import type { ChatMessage, PanelId, QueryState } from '../types'
import { DetailPanels } from './detail-panels'
import { CoverageMap } from './CoverageMap'

type Props = {
  msg: Extract<ChatMessage, { kind: 'ai' }>
  /** Mostra o quadro interpretativo da IA (só quando a pessoa pediu). */
  showDashboard?: boolean
  onFollowup: (text: string) => void
  onApplyConditions: (q: QueryState) => void
  environments?: EnvironmentDto[] | null
}

export function AiBubble({
  msg,
  showDashboard = false,
  onFollowup,
  onApplyConditions,
  environments = null,
}: Props) {
  const t = useT()
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null)
  const { q, r, missing, rankingStatus, rankingError } = msg

  // Texto do carregamento = etapa real em andamento (não é ilustrativo)
  const loadingText =
    msg.loadingPhase === 'ranking'
      ? t('bubble.loadingRanking')
      : msg.loadingPhase === 'panels' || msg.agentReply
        ? t('bubble.thinkingPanels')
        : t('bubble.thinking')

  function toggle(panel: PanelId) {
    setOpenPanel((cur) => (cur === panel ? null : panel))
  }

  // Veredito único no topo: a hipótese (quando houver) + a força da evidência numa linha só
  const hyp = msg.verdict && msg.verdict[0] !== 'unknown' ? msg.verdict : null
  const verdictTone = hyp ? hyp[0] : r.above ? 'weak' : r.level[0]
  const verdictTitle = hyp
    ? hyp[1]
    : r.above
      ? t('verdict.riskHigher')
      : r.level[0] === 'strong'
        ? t('verdict.testsMatch')
        : r.level[0] === 'moderate'
          ? t('verdict.testsSimilar')
          : t('verdict.fewTests')
  const verdictKicker = hyp
    ? t('verdict.hypKicker', { level: r.level[1].toLowerCase() })
    : r.level[1]

  const invCountLabel =
    rankingStatus === 'loading'
      ? '…'
      : rankingStatus === 'error'
        ? '!'
        : String(r.top.length)

  const altMaterial =
    q.material === 'plastico' ? t('bubble.fabric') : t('bubble.acrylic')

  return (
    <div className="msg-ai" id={msg.id}>
      <div className="head">
        <span className="by">
          <img className="avatar" src={LOGO_SRC} alt="" />
          Blue Ember
        </span>
      </div>
      {rankingStatus === 'loading' ? (
        // Carregando: um bloco só, sem veredito nem números antes da resposta chegar
        <div className="answer-loading" role="status" aria-live="polite">
          <span className="kicker">
            <span className="spinner" aria-hidden />
            <span key={loadingText} className="step-text">
              {loadingText}
            </span>
          </span>
          <div className="skel-stack" aria-hidden>
            <div className="skel-line title" />
            <div className="skel-line" />
            <div className="skel-line short" />
          </div>
        </div>
      ) : (
        <>
          {/* 1. Veredito compacto primeiro: dá o contexto sem roubar a cena */}
          {rankingStatus === 'ok' ? (
            <div className={`verdict-big ${verdictTone}`} role="status">
              <span className="kicker">{verdictKicker}</span>
              <span className="title">{verdictTitle}</span>
            </div>
          ) : null}
          {/* 2. A resposta: texto da IA ou, sem IA, o resumo local.
              Esconde o "pensando…" provisório se ele sobrar no modo sem IA */}
          {msg.agentReply && msg.lead ? (
            <p className="summary">{msg.lead}</p>
          ) : (
            <>
              {msg.lead && msg.lead !== t('bubble.thinking') ? (
                <span className="why">{msg.lead}</span>
              ) : null}
              {rankingStatus === 'ok' ? (
                <p className="summary">{summaryFor(q, r, t)}</p>
              ) : null}
            </>
          )}
          {/* 3. As investigações da NASA à vista, não só dentro do painel */}
          {rankingStatus === 'error' ? (
            <span className="best" role="alert">
              {rankingError ?? t('bubble.rankingFail')}
            </span>
          ) : r.top.length ? (
            <div className="top-inv">
              <span className="top-inv-label">{t('bubble.investigations')}</span>
              <ol>
                {r.top.slice(0, 3).map((d, i) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      className="top-inv-row"
                      aria-expanded={openPanel === 'inv'}
                      onClick={() => toggle('inv')}
                    >
                      <span className="rank">{i + 1}</span>
                      <span className="name">
                        <b>{d.name}</b>
                        <small>
                          {d.id}
                          {d.where ? ` · ${d.where}` : ''}
                        </small>
                      </span>
                      <span className="score">
                        {t('panels.scoreNote', { n: f1(d.nota) })}
                      </span>
                    </button>
                    {/* Link direto para a página oficial da investigação no PSI da NASA */}
                    <a
                      className="top-inv-link"
                      href={
                        d.nasaPsiUrl ||
                        `https://psi.nasa.gov/physci/repo/data/investigations/${d.id}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('panels.onPsi', { id: d.id })}
                      title={t('panels.onPsi', { id: d.id })}
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden>
                        <path
                          d="M6 3h7v7M13 3 4 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <span className="best">{t('bubble.noneTop')}</span>
          )}
          <span className="ai-label">
            {msg.agentReply ? t('bubble.agentLabel') : t('bubble.localLabel')}
          </span>
          {/* Dashboard (quando pedido): mapa de onde o caso cai entre os testes */}
          {showDashboard && rankingStatus === 'ok' ? (
            <CoverageMap cells={msg.coverageCells} q={q} />
          ) : null}
        </>
      )}
      {/* Painéis e perguntas de continuação só depois que a resposta chega */}
      {rankingStatus !== 'loading' ? (
        <>
      <div className="details" role="group" aria-label={t('panels.detailsAria')}>
        <button
          type="button"
          aria-expanded={openPanel === 'cond'}
          onClick={() => toggle('cond')}
        >
          {t('bubble.conditions')}
          {missing.length ? (
            <span className="count warn">
              {t('bubble.defaultCount', { n: missing.length })}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'inv'}
          onClick={() => toggle('inv')}
        >
          {t('bubble.investigations')}{' '}
          <span className="count">{invCountLabel}</span>
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'ev'}
          onClick={() => toggle('ev')}
        >
          {t('bubble.evidence')}
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'gaps'}
          onClick={() => toggle('gaps')}
        >
          {t('bubble.gaps')} <span className="count">{r.gaps.length}</span>
        </button>
        <button
          type="button"
          aria-expanded={openPanel === 'src'}
          onClick={() => toggle('src')}
        >
          {t('bubble.sources')}
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
            {t('bubble.followIss')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup('E no habitat lunar a 8,2 psi e 34%?')}
          >
            {t('bubble.followLunar')}
          </button>
        )}
        {q.flow !== 0 ? (
          <button type="button" onClick={() => onFollowup('E com ar parado?')}>
            {t('bubble.followStill')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup('E com ventilação de 20 cm/s?')}
          >
            {t('bubble.followVent')}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onFollowup(
              q.material === 'plastico'
                ? 'E se o material for tecido?'
                : 'E se o material for plástico acrílico?',
            )
          }
        >
          {t('bubble.followMaterial', { material: altMaterial })}
        </button>
        <button
          type="button"
          onClick={() => onFollowup(t('bubble.dashboardChip'))}
        >
          {t('bubble.dashboardChipLabel')}
        </button>
      </div>
        </>
      ) : null}
    </div>
  )
}
