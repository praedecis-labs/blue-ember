import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { askAgent } from '@/services/agent'
import type {
  AgentAskResponse,
  DashboardSpec,
  EnvironmentDto,
  GapsResponse,
  RankingResponse,
} from '@/services/contracts'
import { ApiError } from '@/services/http'
import { getGaps } from '@/services/gaps'
import { getInvestigation } from '@/services/investigations'
import { getRankingFireSafety } from '@/services/ranking'
import { messageFromUnknown } from '@/services/request-state'
import {
  rankingItemToScored,
  rankingParamsFromQuery,
  toApiCategory,
  toApiEnvironment,
  toApiProfile,
} from './adapters'
import { EXTRA_KEYS, MAIN_KEYS } from './data'
import { buildQueryDefaults } from './env-defaults'
import { evidenceFromRankingAndGaps } from './evidence-from-api'
import { gapsFromApi } from './gaps-from-api'
import {
  buildVerdict,
  nowLabel,
  parseHypothesis,
} from './engine'
import { condLabel } from './labels'
import { loadPersisted, savePersisted } from './storage'
import type {
  ChatMessage,
  ClaimId,
  EnvId,
  EvidenceLevel,
  HistoryItem,
  ProfileId,
  QueryState,
  ScoredInvestigation,
  ScreenId,
} from './types'
import { sanitizeAgentProse } from './sanitize-agent-prose'
import { scoreWeightsToCrit } from './weight-map'

export type ChatSessionOptions = {
  environments?: EnvironmentDto[] | null
}

type Hypothesis = { text: string; claim: ClaimId }

type SessionSnap = {
  profile: ProfileId | null
  q: QueryState | null
  missing: string[]
  hypothesis: Hypothesis | null
  current: HistoryItem | null
  messages: ChatMessage[]
}

type HydrateOpts = {
  claimForVerdict?: ClaimId | null
  shouldVerdict?: boolean
}

let msgSeq = 0
const nextId = (prefix: string) => `${prefix}-${++msgSeq}`

function emptyComputeResult(
  _q: QueryState,
  loadingLabel: string,
) {
  // O₂ máximo só vem da API (ranking); até ela responder, nada de número local
  const maxO2 = 0
  const above = false
  return {
    top: [],
    level: ['unknown', loadingLabel] as [EvidenceLevel, string],
    gaps: [] as string[],
    near: 0,
    maxO2,
    maxO2Source: '',
    above,
    partialG: false,
    partialGravityWarning: '',
    featuredCount: 0,
  }
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

export function useChatSession(options: ChatSessionOptions = {}) {
  const { environments = null } = options
  const environmentsRef = useRef(environments)
  environmentsRef.current = environments
  const { locale, t } = useI18n()
  const tRef = useRef(t)
  tRef.current = t
  const localeRef = useRef(locale)
  localeRef.current = locale

  const reactId = useId()
  const [screen, setScreen] = useState<ScreenId>('profile')
  const [profile, setProfile] = useState<ProfileId | null>(null)
  const [pendingProfile, setPendingProfile] = useState<ProfileId | null>(null)
  const [environment, setEnvironment] = useState<EnvId>('lua')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [q, setQ] = useState<QueryState | null>(null)
  const [missing, setMissing] = useState<string[]>([])
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null)
  const [current, setCurrent] = useState<HistoryItem | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [booted, setBooted] = useState(false)

  const snapRef = useRef<SessionSnap>({
    profile: null,
    q: null,
    missing: [],
    hypothesis: null,
    current: null,
    messages: [],
  })

  const syncSnap = useCallback((partial: Partial<SessionSnap>) => {
    snapRef.current = { ...snapRef.current, ...partial }
  }, [])

  useEffect(() => {
    const saved = loadPersisted()
    setProfile(saved.profile)
    setPendingProfile(saved.profile)
    setEnvironment(saved.environment)
    setHistory(saved.history)
    syncSnap({ profile: saved.profile })
    if (!saved.profile) setScreen('profile')
    else if (saved.history.length) setScreen('home')
    else setScreen('chat')
    setBooted(true)
  }, [syncSnap])

  useEffect(() => {
    if (!booted) return
    savePersisted({ profile, environment, history })
  }, [booted, profile, environment, history])

  useEffect(() => {
    syncSnap({
      profile,
      q,
      missing,
      hypothesis,
      current,
      messages,
    })
  }, [profile, q, missing, hypothesis, current, messages, syncSnap])

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
    const gapUi = gapsFromApi(gaps)
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

      let agent: AgentAskResponse | null = null
      try {
        agent = await askAgent({
          message: userMessage,
          profile: toApiProfile(prof),
          environment: toApiEnvironment(query.env),
          category: toApiCategory(query.goal),
          locale: localeRef.current,
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
        // 503 = agent not configured; fall back silently to ranking templates.
        if (!(err instanceof ApiError && err.status === 503)) {
          setError(messageFromUnknown(err))
        }
        hydrateAiRanking(msgId, prof, query, opts)
        return
      }

      const stillThere = snapRef.current.messages.some(
        (m) => m.kind === 'ai' && m.id === msgId,
      )
      if (!stillThere) return

      const lead = sanitizeAgentProse(agent.text.trim())
      const dashboard = agent.dashboard ?? null
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
        // Etapa real: o Gemini respondeu, faltam ranking e lacunas
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

  function makeAi(
    lead: string,
    query: QueryState,
    miss: string[],
    prof: ProfileId,
    verdict: [EvidenceLevel, string] | null,
  ): Extract<ChatMessage, { kind: 'ai' }> {
    return {
      kind: 'ai',
      id: `${reactId}-${nextId('ai')}`,
      lead,
      q: { ...query },
      missing: [...miss],
      r: emptyComputeResult(query, tRef.current('verdict.loading')),
      prof,
      verdict,
      rankingStatus: 'loading',
      rankingError: null,
      weights: null,
      agentReply: false,
      dashboard: null,
      // Etapa real inicial: a pergunta foi para o Gemini
      loadingPhase: 'agent',
      coverageCells: null,
      missionTargets: null,
    }
  }

  function upsertHistory(item: HistoryItem) {
    setCurrent(item)
    setHistory((prev) => {
      const without = prev.filter((h) => h.id !== item.id)
      return [item, ...without].slice(0, 12)
    })
  }

  function newChat() {
    setQ(null)
    setMissing([])
    setHypothesis(null)
    setCurrent(null)
    setMessages([])
    setDraft('')
    setError(null)
    setScreen('chat')
    syncSnap({
      q: null,
      missing: [],
      hypothesis: null,
      current: null,
      messages: [],
    })
  }

  function confirmProfile() {
    if (!pendingProfile) return
    const snap = snapRef.current
    const changed = snap.profile !== null && snap.profile !== pendingProfile
    setProfile(pendingProfile)
    syncSnap({ profile: pendingProfile })

    if (snap.q && changed) {
      setScreen('chat')
      const profileName = t(`profile.${pendingProfile}.name`)
      const ai = makeAi(
        t('chat.profileSwitched', { name: profileName }),
        snap.q,
        snap.missing,
        pendingProfile,
        null,
      )
      setMessages((prev) => {
        const next = [...prev, ai]
        syncSnap({ messages: next })
        return next
      })
      hydrateAiWithAgent(
        ai.id,
        pendingProfile,
        snap.q,
        t('chat.reorderForProfile', { name: profileName }),
      )
      return
    }
    if (snap.q) {
      setScreen('chat')
      return
    }
    if (history.length) setScreen('home')
    else newChat()
  }

  function openDoc(h: HistoryItem) {
    const prof = snapRef.current.profile
    if (!prof) return
    setQ({ ...h.q })
    setHypothesis({ text: h.text, claim: h.claim })
    setMissing([])
    setCurrent(h)
    const ai = makeAi(
      t('bubble.thinking'),
      h.q,
      [],
      prof,
      null,
    )
    const msgs: ChatMessage[] = [
      { kind: 'user', id: `${reactId}-${nextId('u')}`, text: h.text },
      ai,
    ]
    setMessages(msgs)
    syncSnap({
      q: { ...h.q },
      missing: [],
      hypothesis: { text: h.text, claim: h.claim },
      current: h,
      messages: msgs,
    })
    hydrateAiWithAgent(ai.id, prof, h.q, h.text, {
      claimForVerdict: h.claim,
      shouldVerdict: true,
    })
    setScreen('chat')
  }

  function sendText(
    raw: string,
    opts?: { profile?: ProfileId | null; asFirst?: boolean },
  ) {
    const snap = snapRef.current
    const activeProfile = opts?.profile ?? snap.profile
    if (!activeProfile) return
    const text = raw.trim()
    if (text.length < 4) {
      setError(t('chat.writeHypothesis'))
      return
    }
    setError(null)
    setDraft('')

    const p = parseHypothesis(text)
    const first = opts?.asFirst || !snap.q
    const seedEnv: EnvId = p.env ?? environment
    const base: QueryState = first
      ? buildQueryDefaults(seedEnv, environmentsRef.current)
      : { ...snap.q! }

    const changed: Array<keyof QueryState> = []
    for (const [k] of MAIN_KEYS) {
      const val = p[k as keyof typeof p]
      if (val !== null && val !== undefined) {
        if (base[k] !== val) changed.push(k)
        ;(base as Record<string, unknown>)[k] = val
      }
    }
    for (const k of EXTRA_KEYS) {
      const val = p[k]
      if (val !== null && val !== undefined) {
        if (base[k] !== val) changed.push(k)
        ;(base as Record<string, unknown>)[k] = val
      }
    }

    const nextMissing = first
      ? MAIN_KEYS.filter(([k]) => p[k as keyof typeof p] === null).map(([k]) => k)
      : snap.missing.filter((k) => (p as Record<string, unknown>)[k] === null)

    const claimForVerdict: ClaimId =
      p.claim ?? (first ? null : (snap.hypothesis?.claim ?? null))
    const shouldVerdict = first || !!p.claim
    const nextHypothesis =
      first || p.claim ? { text, claim: p.claim } : snap.hypothesis

    const placeholderVerdict = shouldVerdict
      ? buildVerdict(claimForVerdict, 'unknown', t)
      : null
    const aiMsg = makeAi(
      t('bubble.thinking'),
      base,
      nextMissing,
      activeProfile,
      placeholderVerdict,
    )
    const userMsg: ChatMessage = {
      kind: 'user',
      id: `${reactId}-${nextId('u')}`,
      text,
    }
    const nextMessages = [...snap.messages, userMsg, aiMsg]

    setHypothesis(nextHypothesis)
    setQ(base)
    setEnvironment(base.env)
    setMissing(nextMissing)
    setMessages(nextMessages)

    let nextCurrent = snap.current
    if (first) {
      nextCurrent = {
        id: `${reactId}-${nextId('hist')}`,
        when: nowLabel(locale),
        text,
        claim: p.claim,
        q: { ...base },
        level: aiMsg.r.level,
        top: '',
        topIds: [],
      }
      upsertHistory(nextCurrent)
    } else if (snap.current) {
      nextCurrent = {
        ...snap.current,
        q: { ...base },
        level: aiMsg.r.level,
        top: '',
        topIds: [],
      }
      upsertHistory(nextCurrent)
    }

    syncSnap({
      q: base,
      missing: nextMissing,
      hypothesis: nextHypothesis,
      current: nextCurrent,
      messages: nextMessages,
      profile: activeProfile,
    })
    hydrateAiWithAgent(aiMsg.id, activeProfile, base, text, {
      claimForVerdict,
      shouldVerdict,
    })
  }

  function applyConditions(nq: QueryState, fromMsgId: string) {
    const snap = snapRef.current
    const prof = snap.profile
    if (!prof) return

    const source = snap.messages.find(
      (m): m is Extract<ChatMessage, { kind: 'ai' }> =>
        m.kind === 'ai' && m.id === fromMsgId,
    )
    const baseline = source?.q ?? snap.q
    if (!baseline) return

    const baselineMissing = source?.missing ?? snap.missing
    const changed = (Object.keys(nq) as Array<keyof QueryState>).filter(
      (k) => nq[k] !== baseline[k],
    )
    const nextMissing = baselineMissing.filter(
      (k) => !changed.includes(k as keyof QueryState),
    )
    const conditionNote = changed.length
      ? t('chat.conditionsAdjusted', {
          list: changed.map((k) => condLabel(k, nq[k], t)).join(', '),
        })
      : t('chat.rerunSame')
    const aiMsg = makeAi(t('bubble.thinking'), nq, nextMissing, prof, null)
    const nextMessages = [...snap.messages, aiMsg]

    setQ(nq)
    setEnvironment(nq.env)
    setMissing(nextMissing)
    setMessages(nextMessages)

    let nextCurrent = snap.current
    if (snap.current) {
      nextCurrent = {
        ...snap.current,
        q: { ...nq },
        level: aiMsg.r.level,
        top: '',
        topIds: [],
      }
      upsertHistory(nextCurrent)
    }

    syncSnap({
      q: nq,
      missing: nextMissing,
      current: nextCurrent,
      messages: nextMessages,
    })
    hydrateAiWithAgent(aiMsg.id, prof, nq, conditionNote)
  }

  function startExample(text: string) {
    const prof = snapRef.current.profile
    setQ(null)
    setMissing([])
    setHypothesis(null)
    setCurrent(null)
    setMessages([])
    setDraft('')
    setError(null)
    setScreen('chat')
    syncSnap({
      q: null,
      missing: [],
      hypothesis: null,
      current: null,
      messages: [],
    })
    sendText(text, { profile: prof, asFirst: true })
  }

  return {
    booted,
    screen,
    setScreen,
    profile,
    pendingProfile,
    setPendingProfile,
    environment,
    q,
    history,
    messages,
    draft,
    setDraft,
    error,
    setError,
    newChat,
    confirmProfile,
    openDoc,
    sendText,
    applyConditions,
    startExample,
    goHome: () => {
      if (!snapRef.current.profile) {
        setScreen('profile')
        return
      }
      setScreen('home')
    },
    goProfile: () => {
      setPendingProfile(snapRef.current.profile)
      setScreen('profile')
    },
  }
}
