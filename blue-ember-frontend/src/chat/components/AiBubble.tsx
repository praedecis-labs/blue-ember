import { useState } from 'react'
import { useI18n } from '@/i18n'
import { retranslate } from '@/i18n/retranslate'
import { emptyCellBullets } from '../domain/gaps-from-api'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { LOGO_SRC } from '../domain/data'
import { f1, kpa, summaryFor } from '../domain/engine'
import type { ChatMessage, PanelId, QueryState } from '../domain/types'
import { DetailPanels } from './detail-panels'
import { HypothesisDashboard } from './HypothesisDashboard'
import { CoverageMap } from './CoverageMap'
import { EstimatedBadge } from './EstimatedBadge'
import { coverageStatus } from '../domain/coverage-status'
import { psiUrl } from '../domain/psi-url'

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
  onFollowup,
  onApplyConditions,
  environments = null,
  showDashboard = false,
}: Props) {
  const { t, locale } = useI18n()
  // A IA escreve no idioma da pergunta. Se a pessoa trocou o idioma depois,
  // mostra o resumo local já traduzido e deixa o texto original a um clique.
  const staleAi = Boolean(msg.agentReply && msg.agentLocale && msg.agentLocale !== locale)
  const [showOriginal, setShowOriginal] = useState(false)
  const [openPanel, setOpenPanel] = useState<PanelId | null>(null)
  const { q, r, missing, rankingStatus, rankingError } = msg
  const cov = coverageStatus(msg.coverageCells, q)
  // Mapa só quando ajuda: pedido pela pessoa ou quando o caso cai numa lacuna
  const autoMap = showDashboard || (cov != null && cov.status !== 'nearby')
  const [mapOpen, setMapOpen] = useState(autoMap)
  // "O que ainda não se sabe": lacunas da API (até 3) + limites fixos e verdadeiros dos dados
  const unknowns = [
    // recalculadas a partir das células para acompanhar o idioma atual
    ...(msg.coverageCells?.length
      ? emptyCellBullets(msg.coverageCells, q.o2, kpa(q.psi), t)
      : r.gaps.slice(0, 3)),
    ...(cov?.partialGravity || r.partialG ? [t('evidenceTag.gravity')] : []),
    t('answer.samples'),
  ]

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
    ? retranslate(hyp[1], t)
    : r.above
      ? t('verdict.riskHigher')
      : r.level[0] === 'strong'
        ? t('verdict.testsMatch')
        : r.level[0] === 'moderate'
          ? t('verdict.testsSimilar')
          : t('verdict.fewTests')
  const verdictKicker = hyp
    ? t('verdict.hypKicker', { level: retranslate(r.level[1], t).toLowerCase() })
    : retranslate(r.level[1], t)

  const invCountLabel =
    rankingStatus === 'loading'
      ? '…'
      : rankingStatus === 'error'
        ? '!'
        : String(r.top.length)

  const altMaterial =
    q.material === 'plastico' ? t('bubble.fabric') : t('bubble.acrylic')

  if (msg.offTopic) {
    return (
      <div className="msg-ai" id={msg.id}>
        <div className="head">
          <span className="by">
            <img className="avatar" src={LOGO_SRC} alt="" />
            Blue Ember
          </span>
        </div>
        {msg.lead ? <span className="why">{msg.lead}</span> : null}
        <span className="ai-label">{t('bubble.offTopicLabel')}</span>
      </div>
    )
  }

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
          {/* Resposta em blocos fixos (inspirado no padrão "evidência útil / o que mostra / o que falta"):
              1. o que os testes mostram, 2. o que a NASA testou perto, 3. o que ainda não se sabe */}
          <section className="ans-block shows">
            <h4 className="ans-h">{t('answer.shows')}</h4>
              {/* 2. A resposta: texto da IA ou, sem IA, o resumo local.
                  Esconde o "pensando…" provisório se ele sobrar no modo sem IA */}
              {msg.agentReply && msg.lead && staleAi && rankingStatus === 'ok' ? (
                <>
                  <p className="summary">{summaryFor(q, r, t)}</p>
                  <span className="lang-note">
                    {t('answer.langNote', {
                      lang: msg.agentLocale === 'pt-BR' ? t('answer.langPt') : t('answer.langEn'),
                    })}{' '}
                    <button
                      type="button"
                      className="ghost lang-toggle"
                      onClick={() => setShowOriginal((v) => !v)}
                    >
                      {showOriginal ? t('answer.hideOriginal') : t('answer.showOriginal')}
                    </button>
                  </span>
                  {showOriginal ? (
                    <p className="summary original" lang={msg.agentLocale}>
                      {msg.lead}
                    </p>
                  ) : null}
                </>
              ) : msg.agentReply && msg.lead ? (
                <p className="summary">{retranslate(msg.lead, t)}</p>
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
          </section>
          {rankingStatus === 'ok' || rankingStatus === 'error' ? (
            <section className="ans-block tested">
              <h4 className="ans-h">{t('answer.tested')}</h4>
              {/* Rótulo honesto: o quanto a NASA testou nessas condições (de /api/gaps) */}
              {cov ? (
                <div className={`evidence-tag ${cov.status}`}>
                  <b>{t(`evidenceTag.${cov.status}`)}</b>
                  <span>{t(`evidenceTag.${cov.status}Note`, { n: cov.n })}</span>
                </div>
              ) : null}
              {/* 3. As investigações da NASA à vista, não só dentro do painel */}
              {rankingStatus === 'error' ? (
                <span className="best" role="alert">
                  {rankingError ?? t('bubble.rankingFail')}
                </span>
              ) : r.top.length ? (
                <div className="top-inv">
                  <span className="top-inv-label">
                    {t('bubble.investigations')}
                    <EstimatedBadge />
                  </span>
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
                          href={psiUrl(d)}
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
              {/* Mapa de cobertura: aberto quando pedido ou numa lacuna; senão, um botão discreto */}
              {rankingStatus === 'ok' && msg.coverageCells?.length ? (
                mapOpen || autoMap ? (
                  <CoverageMap cells={msg.coverageCells} q={q} />
                ) : (
                  <button type="button" className="ghost map-toggle" onClick={() => setMapOpen(true)}>
                    {t('coverageMap.show')}
                  </button>
                )
              ) : null}
            </section>
          ) : null}
          {rankingStatus === 'ok' && unknowns.length ? (
            <section className="ans-block unknown">
              <h4 className="ans-h">{t('answer.unknown')}</h4>
              <ul>
                {unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
              <span className="ans-disclaimer">{t('answer.disclaimer')}</span>
            </section>
          ) : null}
          <span className="ai-label">
            {msg.agentReply ? t('bubble.agentLabel') : t('bubble.localLabel')}
          </span>
          {msg.dashboard && rankingStatus === 'ok' ? (
            <HypothesisDashboard spec={msg.dashboard} top={r.top} />
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
            onClick={() => onFollowup(t('bubble.followIssPrompt'))}
          >
            {t('bubble.followIss')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup(t('bubble.followLunarPrompt'))}
          >
            {t('bubble.followLunar')}
          </button>
        )}
        {q.flow !== 0 ? (
          <button type="button" onClick={() => onFollowup(t('bubble.followStillPrompt'))}>
            {t('bubble.followStill')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onFollowup(t('bubble.followVentPrompt'))}
          >
            {t('bubble.followVent')}
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            onFollowup(
              q.material === 'plastico'
                ? t('bubble.followFabricPrompt')
                : t('bubble.followAcrylicPrompt'),
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
