import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { LOGO_SRC } from '../domain/data'
import { f1, summaryFor } from '../domain/engine'
import { psiUrl } from '../domain/psi-url'
import type { ChatMessage, PanelId, QueryState } from '../domain/types'
import { DetailPanels } from './detail-panels'
import { HypothesisDashboard } from './HypothesisDashboard'

type Props = {
  msg: Extract<ChatMessage, { kind: 'ai' }>
  onFollowup: (text: string) => void
  onApplyConditions: (q: QueryState) => void
  environments?: EnvironmentDto[] | null
}

function verdictToneClass(tone: string): string {
  if (tone === 'strong') return 'verdict-tone verdict-tone--strong'
  if (tone === 'moderate') return 'verdict-tone verdict-tone--moderate'
  if (tone === 'weak') return 'verdict-tone verdict-tone--weak'
  return 'verdict-tone verdict-tone--unknown'
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

  const loadingText =
    msg.loadingPhase === 'ranking'
      ? t('bubble.loadingRanking')
      : msg.loadingPhase === 'panels' || msg.agentReply
        ? t('bubble.thinkingPanels')
        : t('bubble.thinking')

  function toggle(panel: PanelId) {
    setOpenPanel((cur) => (cur === panel ? null : panel))
  }

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

  if (msg.offTopic) {
    return (
      <div
        className="animate-[rise_0.35s_ease-out_both] flex min-w-0 flex-col gap-3 self-stretch rounded-2xl rounded-bl-sm bg-[var(--white)] p-3.5 [overflow-wrap:anywhere] md:p-5"
        id={msg.id}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--blue)] uppercase">
            <img
              className="block size-[30px] rounded-full bg-[#151622]"
              src={LOGO_SRC}
              alt=""
            />
            Blue Ember
          </span>
        </div>
        {msg.lead ? (
          <span className="text-sm text-[var(--sub)]">{msg.lead}</span>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {t('bubble.offTopicLabel')}
        </span>
      </div>
    )
  }

  return (
    <div
      className="animate-[rise_0.35s_ease-out_both] relative flex min-w-0 flex-col gap-3 self-stretch rounded-2xl rounded-bl-sm bg-[var(--white)] p-3.5 [overflow-wrap:anywhere] md:p-5"
      id={msg.id}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-[var(--blue)] uppercase">
          <img
            className="block size-[30px] rounded-full bg-[#151622]"
            src={LOGO_SRC}
            alt=""
          />
          Blue Ember
        </span>
      </div>

      {rankingStatus === 'loading' ? (
        <div
          className="flex flex-col gap-3"
          role="status"
          aria-live="polite"
        >
          <span className="inline-flex items-center gap-2 text-sm text-[var(--sub)]">
            <Spinner size="sm" className="size-4 shrink-0 text-[var(--navy)]" />
            <span key={loadingText}>{loadingText}</span>
          </span>
          <div className="flex flex-col gap-2" aria-hidden>
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[55%]" />
          </div>
        </div>
      ) : (
        <>
          {rankingStatus === 'ok' ? (
            <div
              className={cn(verdictToneClass(verdictTone))}
              role="status"
            >
              <span className="verdict-tone__kicker">{verdictKicker}</span>
              <span className="verdict-tone__title">{verdictTitle}</span>
            </div>
          ) : null}

          {msg.agentReply && msg.lead ? (
            <p className="text-[17px] leading-relaxed">{msg.lead}</p>
          ) : (
            <>
              {msg.lead && msg.lead !== t('bubble.thinking') ? (
                <span className="text-sm text-[var(--sub)]">{msg.lead}</span>
              ) : null}
              {rankingStatus === 'ok' ? (
                <p className="text-[17px] leading-relaxed">
                  {summaryFor(q, r, t)}
                </p>
              ) : null}
            </>
          )}

          {rankingStatus === 'idle' ? null : rankingStatus === 'error' ? (
            <span className="text-sm text-[var(--sub)]" role="alert">
              {rankingError ?? t('bubble.rankingFail')}
            </span>
          ) : r.top.length ? (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t('bubble.investigations')}
              </span>
              <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
                {r.top.slice(0, 3).map((d, i) => (
                  <li key={d.id} className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      aria-expanded={openPanel === 'inv'}
                      onClick={() => toggle('inv')}
                      className="h-auto min-w-0 flex-1 justify-start gap-3 rounded-[10px] px-3 py-2.5 text-left shadow-none"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--info)] text-xs font-bold text-[var(--navy)]">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-[15px] text-[var(--navy)]">
                          {d.name}
                        </b>
                        <small className="block truncate text-xs text-muted-foreground">
                          {d.id}
                          {d.where ? ` · ${d.where}` : ''}
                        </small>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[var(--navy)]">
                        {t('panels.scoreNote', { n: f1(d.nota) })}
                      </span>
                    </Button>
                    <a
                      className="grid size-10 shrink-0 place-items-center rounded-[10px] border border-border bg-[var(--white)] text-[var(--navy)] no-underline hover:bg-[var(--info)]"
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
          ) : rankingStatus === 'ok' ? (
            <span className="text-sm text-[var(--sub)]">{t('bubble.noneTop')}</span>
          ) : null}

          <span className="text-xs text-muted-foreground">
            {msg.agentReply ? t('bubble.agentLabel') : t('bubble.localLabel')}
          </span>

          {rankingStatus === 'ok' && r.top.length > 0 ? (
            <HypothesisDashboard
              spec={msg.dashboard}
              top={r.top}
              coverageCells={msg.coverageCells}
            />
          ) : null}
        </>
      )}

      {rankingStatus !== 'loading' && rankingStatus !== 'idle' ? (
        <>
          <div
            className="flex flex-wrap gap-1.5 pt-1"
            role="group"
            aria-label={t('panels.detailsAria')}
          >
            {(
              [
                {
                  id: 'cond' as const,
                  label: t('bubble.conditions'),
                  count: missing.length
                    ? t('bubble.defaultCount', { n: missing.length })
                    : null,
                  warn: missing.length > 0,
                },
                {
                  id: 'inv' as const,
                  label: t('bubble.investigations'),
                  count: invCountLabel,
                  warn: false,
                },
                {
                  id: 'ev' as const,
                  label: t('bubble.evidence'),
                  count: null,
                  warn: false,
                },
                {
                  id: 'gaps' as const,
                  label: t('bubble.gaps'),
                  count: String(r.gaps.length),
                  warn: false,
                },
                {
                  id: 'src' as const,
                  label: t('bubble.sources'),
                  count: null,
                  warn: false,
                },
              ] as const
            ).map((tab) => {
              const expanded = openPanel === tab.id
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  aria-expanded={expanded}
                  onClick={() => toggle(tab.id)}
                  className={cn(
                    'rounded-full font-medium',
                    expanded &&
                      '!bg-[#1B2B85] !text-white hover:!bg-[#1B2B85]',
                  )}
                >
                  {tab.label}
                  {tab.count != null ? (
                    <Badge
                      variant={tab.warn ? 'warning' : 'secondary'}
                      size="sm"
                      className={cn(
                        'h-auto px-1.5',
                        expanded && '!bg-white/20 !text-white',
                        tab.warn &&
                          !expanded &&
                          '!bg-[var(--miss)] !text-[#6B6E00]',
                      )}
                    >
                      {tab.count}
                    </Badge>
                  ) : null}
                </Button>
              )
            })}
          </div>

          <DetailPanels
            msg={msg}
            openPanel={openPanel}
            onApplyConditions={onApplyConditions}
            environments={environments}
          />
        </>
      ) : null}

      {rankingStatus !== 'loading' ? (
        <div className="flex flex-wrap gap-1.5">
          {q.env !== 'iss' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
              onClick={() => onFollowup(t('bubble.followIssPrompt'))}
            >
              <span aria-hidden className="text-muted-foreground">↳ </span>
              {t('bubble.followIss')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
              onClick={() => onFollowup(t('bubble.followLunarPrompt'))}
            >
              <span aria-hidden className="text-muted-foreground">↳ </span>
              {t('bubble.followLunar')}
            </Button>
          )}
          {q.flow !== 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
              onClick={() => onFollowup(t('bubble.followStillPrompt'))}
            >
              <span aria-hidden className="text-muted-foreground">↳ </span>
              {t('bubble.followStill')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
              onClick={() => onFollowup(t('bubble.followVentPrompt'))}
            >
              <span aria-hidden className="text-muted-foreground">↳ </span>
              {t('bubble.followVent')}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
            onClick={() =>
              onFollowup(
                q.material === 'plastico'
                  ? t('bubble.followFabricPrompt')
                  : t('bubble.followAcrylicPrompt'),
              )
            }
          >
            <span aria-hidden className="text-muted-foreground">↳ </span>
            {t('bubble.followMaterial', { material: altMaterial })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
            onClick={() => onFollowup(t('bubble.dashboardChip'))}
          >
            <span aria-hidden className="text-muted-foreground">↳ </span>
            {t('bubble.dashboardChipLabel')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
