import type {
  CoverageCellDto,
  DashboardSpec,
  MissionTargetsDto,
} from '@/services/shared/contracts'
import type { RequestStatus } from '@/services/shared/request-state'

export type ProfileId = 'eng' | 'pesq' | 'est'
export type EnvId = 'lua' | 'marte' | 'iss'
export type MaterialId = 'tecido' | 'plastico' | 'liquido'
export type GoalId = 'prevenir' | 'detectar' | 'apagar'
export type ThickId = 'fina' | 'grossa' | ''
export type DirId = 'favor' | 'contra' | ''
export type GasId = 'co2' | 'he' | 'n2' | ''
export type ClaimId = 'safe' | 'risky' | null
export type EvidenceLevel = 'strong' | 'moderate' | 'weak' | 'unknown'
export type ScreenId = 'profile' | 'home' | 'chat'
export type ThemeId = 'light' | 'dark'
export type PanelId = 'cond' | 'inv' | 'ev' | 'gaps' | 'src'
export type CritKey = 'prox' | 'moc' | 'spread' | 'hrr' | 'tox'
export type CritWeights = Record<CritKey, number>

export type QueryState = {
  env: EnvId
  material: MaterialId
  o2: number
  psi: number
  flow: number
  thick: ThickId
  dir: DirId
  gas: GasId
  goal: GoalId
}

export type ParseResult = {
  env: EnvId | null
  material: MaterialId | null
  o2: number | null
  psi: number | null
  flow: number | null
  thick: ThickId | null
  dir: DirId | null
  gas: GasId | null
  goal: GoalId | null
  claim: ClaimId
}

export type Investigation = {
  id: string
  name: string
  what: string
  materials: MaterialId[]
  o2: [number, number]
  flow: [number, number]
  thick: Array<'fina' | 'grossa'>
  gases: Array<'co2' | 'he' | 'n2'>
  goal: GoalId
  where: string
  doi: string | null
  /** Official PSI URL from API summary when available. */
  nasaPsiUrl?: string | null
  c: { moc: number | null; spread: number | null; hrr: number | null; tox: number | null }
}

export type ScoredInvestigation = Investigation & {
  vals: Record<CritKey, number | null>
  nota: number
  have: number
}

export type ComputeResult = {
  top: ScoredInvestigation[]
  level: [EvidenceLevel, string]
  gaps: string[]
  near: number
  maxO2: number
  /** Sigla da investigação (da API) com o maior O₂ testado. */
  maxO2Source?: string
  above: boolean
  partialG: boolean
  /** Trimmed partial-gravity warning from gaps API (GapsPanel callout). */
  partialGravityWarning: string
  /** Featured fire-safety count from gaps API (evidence panel denominator). */
  featuredCount: number
}

export type HistoryItem = {
  id: string
  when: string
  text: string
  claim: ClaimId
  q: QueryState
  level: [EvidenceLevel, string]
  /** Display label of the top investigation (acronym/name). */
  top: string
  /** Canonical investigation ids from the last API ranking (top N). */
  topIds: string[]
}

export type ChatMessage =
  | { kind: 'user'; id: string; text: string }
  | {
      kind: 'ai'
      id: string
      lead: string
      q: QueryState
      missing: string[]
      r: ComputeResult
      prof: ProfileId
      verdict: [EvidenceLevel, string] | null
      rankingStatus: RequestStatus
      rankingError: string | null
      weights: CritWeights | null
<<<<<<< HEAD:blue-ember-frontend/src/chat/types.ts
      /** True when `lead` came from agent prose (skip template summary). */
=======
      /** True when `lead` came from Gemini agent prose (skip templte summary). */
>>>>>>> origin/main:blue-ember-frontend/src/chat/domain/types.ts
      agentReply?: boolean
      offTopic?: boolean
      dashboard?: DashboardSpec | null
      coverageCells?: CoverageCellDto[] | null
      missionTargets?: MissionTargetsDto | null
      /** Etapa real do carregamento: esperando o agente (LLM), o ranking (sem IA) ou os painéis. */
      loadingPhase?: 'agent' | 'ranking' | 'panels'
    }

export type PersistedState = {
  profile: ProfileId | null
  /** Last selected mission environment (UI id; storage serializes API id). */
  environment: EnvId
  history: HistoryItem[]
}
