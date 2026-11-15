import type { Dispatch, MutableRefObject, SetStateAction } from 'react'
import { askAgent } from '@/services/api/agent'
import type {
  AgentAskResponse,
  DashboardSpec,
  GapsResponse,
  RankingResponse,
} from '@/services/shared/contracts'
import { ApiError } from '@/services/shared/http'
import { getGaps } from '@/services/api/gaps'
import { getInvestigation } from '@/services/api/investigations'
import { getRankingFireSafety } from '@/services/api/ranking'
import { messageFromUnknown } from '@/services/shared/request-state'
import type { TFunction } from '@/i18n'
import type { AppLocale } from '@/i18n/locales'
import {
  rankingItemToScored,
  rankingParamsFromQuery,
  toApiCategory,
  toApiEnvironment,
  toApiProfile,
} from '../domain/adapters'
import { evidenceFromRankingAndGaps } from '../domain/evidence-from-api'
import { gapsFromApi } from '../domain/gaps-from-api'
import { buildVerdict } from '../domain/engine'
import { sanitizeAgentProse } from '../domain/sanitize-agent-prose'
import { scoreWeightsToCrit } from '../domain/weight-map'
import type {
  ChatMessage,
  ClaimId,
  HistoryItem,
  ProfileId,
  QueryState,
  ScoredInvestigation,
} from '../domain/types'

export type SessionSnap = {
  profile: ProfileId | null
  q: QueryState | null
  missing: string[]
  hypothesis: { text: string; claim: ClaimId } | null
  current: HistoryItem | null
  messages: ChatMessage[]
}

export type HydrateOpts = {
  claimForVerdict?: ClaimId | null
  shouldVerdict?: boolean
}

export type HydrationDeps = {
  snapRef: MutableRefObject<SessionSnap>
  syncSnap: (partial: Partial<SessionSnap>) => void
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  setCurrent: Dispatch<SetStateAction<HistoryItem | null>>
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>
  setError: Dispatch<SetStateAction<string | null>>
  tRef: MutableRefObject<TFunction>
  localeRef: MutableRefObject<AppLocale>
}

async function enrichTopWithDetails(
  top: ScoredInvestigation[],
): Promise<ScoredInvestigation[]> {
  return Promise.all(
    top.map(async (scored) => {
      try {
        const detail = await getInvestigation(scored.id)
        return {
          ...scored,
          doi: detail.doi || null,
          nasaPsiUrl: detail.nasaPsiUrl || scored.nasaPsiUrl,
        }
      } catch {
        return scored
      }
    }),
  )
}

export function useChatHydration(deps: HydrationDeps) {
  const {
    snapRef,
    syncSnap,
    setMessages,
    setCurrent,
    setHistory,
    setError,
    tRef,
    localeRef,
  } = deps

  function patchAiMessage(
    msgId: string,
    patch: (
      msg: Extract<ChatMessage, { kind: 'ai' }>,
    ) => Extract<ChatMessage, { kind: 'ai' }>,
  ) {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.kind === 'ai' && m.id === msgId)
      if (idx < 0) return prev
      const msg = prev[idx] as Extract<ChatMessage, { kind: 'ai' }>
      const next = [...prev]
      next[idx] = patch(msg)
      syncSnap({ messages: next })
      return next
    })
  }

  async function applyRankingAndGaps(
    msgId: string,
    ranking: RankingResponse,
    gaps: GapsResponse,
    opts: HydrateOpts = {},
    extra?: {
      lead?: string
      agentReply?: boolean
      dashboard?: DashboardSpec | null
    },
  ) {
    const stillThere = snapRef.current.messages.some(
      (m) => m.kind === 'ai' && m.id === msgId,
    )
    if (!stillThere) return

    const translate = tRef.current
    const evidence = evidenceFromRankingAndGaps(ranking, gaps, translate)
    const gapUi = gapsFromApi(gaps, translate)
    const topBase = ranking.items.slice(0, 8).map(rankingItemToScored)
    const top = await enrichTopWithDetails(topBase)
    const topIds = top.slice(0, 3).map((item) => item.id)
    const weights = scoreWeightsToCrit(ranking.weights)
    const verdict =
      opts.shouldVerdict
        ? buildVerdict(
            opts.claimForVerdict ?? null,
            evidence.level[0],
            translate,
          )
        : undefined

    const stillThereAfterDetails = snapRef.current.messages.some(
      (m) => m.kind === 'ai' && m.id === msgId,
    )
    if (!stillThereAfterDetails) return

    // Maior O₂ testado entre as investigações que a API devolveu
    let maxO2 = 0
    let maxO2Source = ''
    for (const it of ranking.items) {
      const hi = Math.max(0, ...(it.investigation.o2Range ?? []))
      if (hi > maxO2) {
        maxO2 = hi
        maxO2Source = it.investigation.acronym
      }
    }

    patchAiMessage(msgId, (msg) => ({
      ...msg,
      lead: extra?.lead !== undefined ? extra.lead : msg.lead,
      agentReply: extra?.agentReply ?? msg.agentReply,
      dashboard:
        extra?.dashboard !== undefined ? extra.dashboard : msg.dashboard,
      coverageCells: gaps.coverageCells,
      missionTargets: gaps.targets,
      rankingStatus: 'ok',
      rankingError: null,
      weights,
      verdict: verdict !== undefined ? verdict : msg.verdict,
      r: {
        ...msg.r,
        top,
        level: evidence.level,
        near: evidence.near,
        partialG: evidence.partialG,
        partialGravityWarning: gapUi.partialGravityWarning,
        gaps: gapUi.gaps,
        featuredCount: evidence.featuredCount,
        maxO2,
        maxO2Source,
        above: maxO2 > 0 && msg.q.o2 > maxO2,
      },
    }))

    const snap = snapRef.current
    if (snap.current) {
      const nextCurrent: HistoryItem = {
        ...snap.current,
        level: evidence.level,
        top: top[0]?.name ?? '',
        topIds,
      }
      setCurrent(nextCurrent)
      setHistory((prev) => {
        const without = prev.filter((h) => h.id !== nextCurrent.id)
        return [nextCurrent, ...without].slice(0, 12)
      })
      syncSnap({ current: nextCurrent })
    }
  }

  function hydrateAiRanking(
    msgId: string,
    prof: ProfileId,
    query: Pick<QueryState, 'env' | 'goal'>,
    opts: HydrateOpts = {},
  ) {
    const rankingParams = rankingParamsFromQuery(prof, query)
    const environmentApi = toApiEnvironment(query.env)
    // Etapa real: buscando ranking e lacunas direto na API (modo sem IA)
    patchAiMessage(msgId, (msg) => ({ ...msg, loadingPhase: 'ranking' }))
    void (async () => {
      try {
        const [ranking, gaps] = await Promise.all([
          getRankingFireSafety(rankingParams),
          getGaps({ environment: environmentApi }),
        ])
        await applyRankingAndGaps(msgId, ranking, gaps, opts)
      } catch (err) {
        const stillThere = snapRef.current.messages.some(
          (m) => m.kind === 'ai' && m.id === msgId,
        )
        if (!stillThere) return
        const message = messageFromUnknown(err)
        setError(message)
        patchAiMessage(msgId, (msg) => ({
          ...msg,
          rankingStatus: 'error',
          rankingError: message,
        }))
      }
    })()
  }

  function hydrateAiWithAgent(
    msgId: string,
    prof: ProfileId,
    query: QueryState,
    userMessage: string,
    opts: HydrateOpts = {},
  ) {
    void (async () => {
      const rankingParams = rankingParamsFromQuery(prof, query)
      const history = snapRef.current.messages
        .filter((m) => m.id !== msgId)
        .slice(-8)
        .map((m) =>
          m.kind === 'user'
            ? { role: 'user' as const, text: m.text }
            : {
                role: 'model' as const,
                text: m.lead || (m.verdict ? m.verdict[1] : ''),
              },
        )
        .filter((t) => t.text.trim().length > 0)

      // Idioma da pergunta: a IA responde nele; a tela usa isso se a pessoa trocar o idioma depois
      const askedLocale = localeRef.current
      let agent: AgentAskResponse | null = null
      try {
        agent = await askAgent({
          message: userMessage,
          profile: toApiProfile(prof),
          environment: toApiEnvironment(query.env),
          category: toApiCategory(query.goal),
          locale: askedLocale,
          query: {
            env: toApiEnvironment(query.env),
            material: query.material,
            o2: query.o2,
            psi: query.psi,
            flow: query.flow,
            goal: query.goal,
            claim: opts.claimForVerdict ?? null,
          },
          history,
        })
      } catch (err) {
        const stillThere = snapRef.current.messages.some(
          (m) => m.kind === 'ai' && m.id === msgId,
        )
        if (!stillThere) return
        const translate = tRef.current
        const offline = err instanceof ApiError && err.status === 503
        if (!offline) {
          setError(messageFromUnknown(err))
        }
        // Keep agentReply so local summary templates are not shown as if the LLM answered.
        patchAiMessage(msgId, (msg) => ({
          ...msg,
          lead: offline
            ? translate('bubble.agentOffline')
            : translate('bubble.agentFallback'),
          agentReply: true,
          loadingPhase: 'ranking',
        }))
        hydrateAiRanking(msgId, prof, query, opts)
        return
      }

      const stillThere = snapRef.current.messages.some(
        (m) => m.kind === 'ai' && m.id === msgId,
      )
      if (!stillThere) return

      const lead = sanitizeAgentProse(agent.text.trim())
      const dashboard = agent.dashboard ?? null
      patchAiMessage(msgId, (msg) => ({ ...msg, agentLocale: askedLocale }))
      if (agent.ranking && agent.gaps) {
        await applyRankingAndGaps(msgId, agent.ranking, agent.gaps, opts, {
          lead,
          agentReply: true,
          dashboard,
        })
        return
      }

      patchAiMessage(msgId, (msg) => ({
        ...msg,
        lead,
        agentReply: true,
        dashboard,
        // Etapa real: o agente respondeu, faltam ranking e lacunas
        loadingPhase: 'panels',
      }))

      try {
        const [ranking, gaps] = await Promise.all([
          agent.ranking
            ? Promise.resolve(agent.ranking)
            : getRankingFireSafety(rankingParams),
          agent.gaps
            ? Promise.resolve(agent.gaps)
            : getGaps({ environment: toApiEnvironment(query.env) }),
        ])
        await applyRankingAndGaps(msgId, ranking, gaps, opts, {
          lead,
          agentReply: true,
          dashboard,
        })
      } catch (err) {
        const message = messageFromUnknown(err)
        setError(message)
        patchAiMessage(msgId, (msg) => ({
          ...msg,
          lead,
          agentReply: true,
          dashboard,
          rankingStatus: 'error',
          rankingError: message,
        }))
      }
    })()
  }

  return { hydrateAiWithAgent }
}
