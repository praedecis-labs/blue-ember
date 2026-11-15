import {
  DEFAULT_LOCALE,
  isAppLocale,
  type AppLocale,
} from '@/i18n/locales'
import {
  fromApiEnvironment,
  fromApiProfile,
  toApiEnvironment,
  toApiProfile,
} from './adapters'
import { isOnTopicHypothesis } from './on-topic'
import type {
  ClaimId,
  EnvId,
  EvidenceLevel,
  HistoryItem,
  PersistedState,
  QueryState,
  ThemeId,
} from './types'

const STATE_KEY = 'blueEmberChat'
const THEME_KEY = 'blueEmberTheme'
const LOCALE_KEY = 'blueEmberLocale'
const DEFAULT_ENV: EnvId = 'lua'

const EVIDENCE_LEVELS: EvidenceLevel[] = [
  'strong',
  'moderate',
  'weak',
  'unknown',
]

function isClaim(value: unknown): value is ClaimId {
  return value === null || value === 'safe' || value === 'risky'
}

function isQueryState(value: unknown): value is QueryState {
  if (!value || typeof value !== 'object') return false
  const q = value as Record<string, unknown>
  const env =
    typeof q.env === 'string' ? fromApiEnvironment(q.env) : null
  if (!env) return false
  // Normalize legacy/API env ids inside history queries to UI ids.
  ;(q as { env: EnvId }).env = env
  return (
    (q.material === 'tecido' ||
      q.material === 'plastico' ||
      q.material === 'liquido') &&
    typeof q.o2 === 'number' &&
    Number.isFinite(q.o2) &&
    typeof q.psi === 'number' &&
    Number.isFinite(q.psi) &&
    typeof q.flow === 'number' &&
    Number.isFinite(q.flow) &&
    (q.thick === '' || q.thick === 'fina' || q.thick === 'grossa') &&
    (q.dir === '' || q.dir === 'favor' || q.dir === 'contra') &&
    (q.gas === '' || q.gas === 'co2' || q.gas === 'he' || q.gas === 'n2') &&
    (q.goal === 'prevenir' || q.goal === 'detectar' || q.goal === 'apagar')
  )
}

function sanitizeHistoryItem(raw: unknown, index: number): HistoryItem | null {
  if (!raw || typeof raw !== 'object') return null
  const h = raw as Record<string, unknown>
  if (typeof h.text !== 'string' || !h.text.trim()) return null
  if (!isOnTopicHypothesis(h.text)) return null
  if (!isQueryState(h.q)) return null
  if (!isClaim(h.claim)) return null
  if (typeof h.top !== 'string') return null
  if (!Array.isArray(h.level) || h.level.length !== 2) return null
  const [levelId, levelLabel] = h.level
  if (
    typeof levelId !== 'string' ||
    !EVIDENCE_LEVELS.includes(levelId as EvidenceLevel) ||
    typeof levelLabel !== 'string'
  ) {
    return null
  }
  const topIds = Array.isArray(h.topIds)
    ? h.topIds.filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    : []
  const when =
    typeof h.when === 'string' && h.when.trim()
      ? h.when
      : `legacy-${index}`
  const id =
    typeof h.id === 'string' && h.id.trim()
      ? h.id
      : `hist-${when}-${index}`
  return {
    id,
    when,
    text: h.text,
    claim: h.claim,
    q: h.q,
    level: [levelId as EvidenceLevel, levelLabel],
    top: h.top,
    topIds,
  }
}

function emptyPersisted(): PersistedState {
  return { profile: null, environment: DEFAULT_ENV, history: [] }
}

export function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return emptyPersisted()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const profile =
      typeof parsed.profile === 'string'
        ? fromApiProfile(parsed.profile)
        : null
    const environment =
      typeof parsed.environment === 'string'
        ? (fromApiEnvironment(parsed.environment) ?? DEFAULT_ENV)
        : DEFAULT_ENV
    const history = Array.isArray(parsed.history)
      ? parsed.history
          .map(sanitizeHistoryItem)
          .filter((item): item is HistoryItem => item !== null)
          .slice(0, 12)
      : []
    return { profile, environment, history }
  } catch {
    return emptyPersisted()
  }
}

export function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        profile: state.profile ? toApiProfile(state.profile) : null,
        environment: toApiEnvironment(state.environment),
        history: state.history.slice(0, 12),
      }),
    )
  } catch {
    /* ignore quota */
  }
}

export function loadTheme(): ThemeId {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function saveTheme(theme: ThemeId) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function loadLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_KEY)
    if (isAppLocale(raw)) return raw
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function saveLocale(locale: AppLocale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    /* ignore */
  }
}
