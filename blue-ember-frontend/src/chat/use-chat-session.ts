import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { DEFAULTS, EXTRA_KEYS, MAIN_KEYS, PROFILES } from './data'
import {
  buildVerdict,
  compute,
  nowLabel,
  parseHypothesis,
} from './engine'
import { condLabel } from './labels'
import { loadPersisted, savePersisted } from './storage'
import type {
  ChatMessage,
  ClaimId,
  EvidenceLevel,
  HistoryItem,
  ProfileId,
  QueryState,
  ScreenId,
} from './types'

type Hypothesis = { text: string; claim: ClaimId }

type SessionSnap = {
  profile: ProfileId | null
  q: QueryState | null
  missing: string[]
  hypothesis: Hypothesis | null
  current: HistoryItem | null
  messages: ChatMessage[]
}

let msgSeq = 0
const nextId = (prefix: string) => `${prefix}-${++msgSeq}`

export function useChatSession() {
  const reactId = useId()
  const [screen, setScreen] = useState<ScreenId>('profile')
  const [profile, setProfile] = useState<ProfileId | null>(null)
  const [pendingProfile, setPendingProfile] = useState<ProfileId | null>(null)
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
    setHistory(saved.history)
    syncSnap({ profile: saved.profile })
    if (!saved.profile) setScreen('profile')
    else if (saved.history.length) setScreen('home')
    else setScreen('chat')
    setBooted(true)
  }, [syncSnap])

  useEffect(() => {
    if (!booted) return
    savePersisted({ profile, history })
  }, [booted, profile, history])

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
      r: compute(query, prof),
      prof,
      verdict,
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
    const msgs: ChatMessage[] = [
      { kind: 'user', id: `${reactId}-${nextId('u')}`, text: h.text },
      makeAi(
        'Análise reaberta. Pergunte de novo ou abra os detalhes abaixo.',
        h.q,
        [],
        prof,
        null,
      ),
    ]
    setMessages(msgs)
    syncSnap({
      q: { ...h.q },
      missing: [],
      hypothesis: { text: h.text, claim: h.claim },
      current: h,
      messages: msgs,
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
      setError('Escreva sua hipótese ou pergunta.')
      return
    }
    setError(null)
    setDraft('')

    const p = parseHypothesis(text)
    const first = opts?.asFirst || !snap.q
    const base: QueryState = first ? { ...DEFAULTS } : { ...snap.q! }
    if (first && p.env === 'iss') {
      base.o2 = 21
      base.psi = 14.7
    }

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

    const verdict = shouldVerdict
      ? buildVerdict(claimForVerdict, compute(base, activeProfile).level[0])
      : null
    const aiMsg = makeAi(lead, base, nextMissing, activeProfile, verdict)
    const userMsg: ChatMessage = {
      kind: 'user',
      id: `${reactId}-${nextId('u')}`,
      text,
    }
    const nextMessages = [...snap.messages, userMsg, aiMsg]

    setHypothesis(nextHypothesis)
    setQ(base)
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
        top: aiMsg.r.top[0].name,
      }
      upsertHistory(nextCurrent)
    } else if (snap.current) {
      nextCurrent = {
        ...snap.current,
        q: { ...base },
        level: aiMsg.r.level,
        top: aiMsg.r.top[0].name,
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
    const lead = changed.length
      ? `Refiz com as condições ajustadas: ${changed
          .map((k) => condLabel(k, nq[k]))
          .join(', ')}.`
      : 'Refiz com as mesmas condições.'
    const aiMsg = makeAi(lead, nq, nextMissing, prof, null)
    const nextMessages = [...snap.messages, aiMsg]

    setQ(nq)
    setMissing(nextMissing)
    setMessages(nextMessages)

    let nextCurrent = snap.current
    if (snap.current) {
      nextCurrent = {
        ...snap.current,
        q: { ...nq },
        level: aiMsg.r.level,
        top: aiMsg.r.top[0].name,
      }
      upsertHistory(nextCurrent)
    }

    syncSnap({
      q: nq,
      missing: nextMissing,
      current: nextCurrent,
      messages: nextMessages,
    })
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
