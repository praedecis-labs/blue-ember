import { isEnvId, isProfileId } from './adapters'
import type {
  ClaimId,
  EvidenceLevel,
  HistoryItem,
  PersistedState,
  QueryState,
  ThemeId,
} from './types'

const STATE_KEY = 'blueEmberChat'
const THEME_KEY = 'blueEmberTheme'

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
  return (
    isEnvId(q.env) &&
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
  }
}

export function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return { profile: null, history: [] }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const profile = isProfileId(parsed.profile) ? parsed.profile : null
    const history = Array.isArray(parsed.history)
      ? parsed.history
          .map(sanitizeHistoryItem)
          .filter((item): item is HistoryItem => item !== null)
          .slice(0, 12)
      : []
    return { profile, history }
  } catch {
    return { profile: null, history: [] }
  }
}

export function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({
        profile: state.profile,
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
