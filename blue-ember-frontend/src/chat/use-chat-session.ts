import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { EnvironmentDto } from '@/services/contracts'
import { getGaps } from '@/services/gaps'
import { getInvestigation } from '@/services/investigations'
import { getRankingFireSafety } from '@/services/ranking'
import { messageFromUnknown } from '@/services/request-state'
import {
  rankingItemToScored,
  rankingParamsFromQuery,
  toApiEnvironment,
} from './adapters'
import { EXTRA_KEYS, MAIN_KEYS, PROFILES } from './data'
import { buildQueryDefaults } from './env-defaults'
import { evidenceFromRankingAndGaps } from './evidence-from-api'
import { gapsFromApi } from './gaps-from-api'
import {
  buildVerdict,
  localGaps,
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

function emptyComputeResult(q: QueryState) {
  const { maxO2, above } = localGaps(q)
  return {
    top: [],
    level: ['unknown', 'Carregando evidência…'] as [EvidenceLevel, string],
    gaps: [] as string[],
    near: 0,
    maxO2,
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

  function hydrateAiRanking(
    msgId: string,
    prof: ProfileId,
    query: Pick<QueryState, 'env' | 'goal'>,
    opts: HydrateOpts = {},
  ) {
    const rankingParams = rankingParamsFromQuery(prof, query)
    const environmentApi = toApiEnvironment(query.env)
    void (async () => {
      try {
        const [ranking, gaps] = await Promise.all([
          getRankingFireSafety(rankingParams),
          getGaps({ environment: environmentApi }),
        ])
        const stillThere = snapRef.current.messages.some(
          (m) => m.kind === 'ai' && m.id === msgId,
        )
        if (!stillThere) return

        const evidence = evidenceFromRankingAndGaps(ranking, gaps)
        const gapUi = gapsFromApi(gaps)
        const topBase = ranking.items.slice(0, 3).map(rankingItemToScored)
        const top = await enrichTopWithDetails(topBase)
        const topIds = top.map((t) => t.id)
        const weights = scoreWeightsToCrit(ranking.weights)
        const verdict =
          opts.shouldVerdict
            ? buildVerdict(opts.claimForVerdict ?? null, evidence.level[0])
            : undefined

        const stillThereAfterDetails = snapRef.current.messages.some(
          (m) => m.kind === 'ai' && m.id === msgId,
        )
        if (!stillThereAfterDetails) return

        patchAiMessage(msgId, (msg) => ({
          ...msg,
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
      r: emptyComputeResult(query),
      prof,
      verdict,
      rankingStatus: 'loading',
      rankingError: null,
      weights: null,
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
      const ai = makeAi(
        `Perfil trocado para ${PROFILES[pendingProfile].name}. Reordenei as investigações com os novos pesos.`,
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
      hydrateAiRanking(ai.id, pendingProfile, snap.q)
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
      'Análise reaberta. Pergunte de novo ou abra os detalhes abaixo.',
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
    hydrateAiRanking(ai.id, prof, h.q)
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
      setError('Escreva sua hipótese ou pergunta.')
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

    let lead = ''
    if (!first) {
      lead = changed.length
        ? `Atualizei: ${changed.map((k) => condLabel(k, base[k])).join(', ')}.`
        : 'Não encontrei condições novas nessa mensagem; mantive as anteriores.'
    }

    const placeholderVerdict = shouldVerdict
      ? buildVerdict(claimForVerdict, 'unknown')
      : null
    const aiMsg = makeAi(
      lead,
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
        when: nowLabel(),
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
    hydrateAiRanking(aiMsg.id, activeProfile, base, {
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
    const apiAffecting = changed.some((k) => k === 'env' || k === 'goal')
    let lead = changed.length
      ? `Refiz com as condições ajustadas: ${changed
          .map((k) => condLabel(k, nq[k]))
          .join(', ')}.`
      : 'Refiz com as mesmas condições.'
    if (changed.length && !apiAffecting) {
      lead +=
        ' O score da API usa ambiente e categoria; O₂/pressão/fluxo ficam na síntese da UI.'
    }
    const aiMsg = makeAi(lead, nq, nextMissing, prof, null)
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
    hydrateAiRanking(aiMsg.id, prof, nq)
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
