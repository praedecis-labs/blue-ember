import { useState } from 'react'
import { useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/contracts'
import { LOGO_SRC } from '../data'
import { f1, summaryFor } from '../engine'
import type { ChatMessage, PanelId, QueryState } from '../types'
import { DetailPanels } from './detail-panels'
import { HypothesisDashboard } from './HypothesisDashboard'

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
  const t = useT()
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
      {msg.lead ? <span className="why">{msg.lead}</span> : null}
      <div className={`verdict-big ${verdictTone}`} role="status">
        <span className="kicker">{verdictKicker}</span>
        <span className="title">{verdictTitle}</span>
      </div>
      {!msg.agentReply && rankingStatus !== 'loading' ? (
        <p className="summary">{summaryFor(q, r, t)}</p>
      ) : null}
      {rankingStatus === 'loading' ? (
        <span className="best">
          {msg.agentReply
            ? t('bubble.thinkingPanels')
            : t('bubble.thinkingRanking')}
        </span>
      ) : rankingStatus === 'error' ? (
        <span className="best" role="alert">
          {rankingError ?? t('bubble.rankingFail')}
        </span>
      ) : best ? (
        <span className="best">
          {t('bubble.mostRelevant')} <b>{best.name}</b> ({best.id}) ·{' '}
          {t('panels.scoreNote', { n: f1(best.nota) })} · {best.where}
        </span>
      ) : (
        <span className="best">{t('bubble.noneTop')}</span>
      )}
      <span className="ai-label">
        {msg.agentReply ? t('bubble.agentLabel') : t('bubble.localLabel')}
      </span>
      {msg.dashboard && rankingStatus === 'ok' ? (
        <HypothesisDashboard spec={msg.dashboard} top={r.top} />
      ) : null}
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
    </div>
  )
}
