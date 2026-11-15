/** API profile ids (BlueEmber.Api Domain.Profiles). */
export type ApiProfileId = 'Student' | 'Researcher' | 'ShipEngineer'

/** API environment ids (BlueEmber.Api Domain.Environments). */
export type ApiEnvironmentId = 'Iss' | 'Moon' | 'Mars'

export type ErrorResponse = {
  error: string
  missing?: string[]
}

export type HealthPayload = {
  status: string
  service: string
}

export type ScoreWeightsDto = {
  w1: number
  w2: number
  w3: number
  w4: number
  w5: number
}

export type ScoreCriteriaDto = {
  c1Proximidade: number
  c2MargemMoc: number
  c3Cinetica: number
  c4SeveridadeTermica: number
  c5Toxicidade: number
  ppO2Kpa?: number | null
  winningConditionIndex?: number | null
}

export type TestConditionDto = {
  material?: string | null
  geometry?: string | null
  o2Percent?: number | null
  pressureKpa?: number | null
  flowSpeedCms?: number | null
  flameSpreadRateMms?: number | null
  mocPercent?: number | null
  hrrKw?: number | null
  coPpm?: number | null
  provenance: string
  regime?: string | null
  ppO2Kpa?: number | null
}

export type WinningConditionDto = {
  index: number
  material?: string | null
  o2Percent?: number | null
  pressureKpa?: number | null
  flowSpeedCms?: number | null
  ppO2Kpa?: number | null
  provenance: string
  regime?: string | null
}

export type ProfileDto = {
  id: string
  label: string
  weights: ScoreWeightsDto
}

export type ProfileListResponse = {
  items: ProfileDto[]
}

export type EnvironmentDto = {
  id: string
  label: string
  targetO2Percent: number
  targetPressureKpa: number
  targetFlowCms: number
}

export type EnvironmentListResponse = {
  items: EnvironmentDto[]
}

export type InvestigationSummaryDto = {
  id: string
  acronym: string
  title: string
  category: string
  platform: string
  o2Range: number[]
  pressureKpa: number[]
  isFeaturedFireSafety: boolean
  nasaPsiUrl: string
  testConditionCount?: number
}

export type InvestigationDetailDto = {
  id: string
  acronym: string
  title: string
  platform: string
  hardware: string
  hardwareLink: string
  discipline: string
  subDiscipline: string
  category: string
  objectives: string
  approach: string
  hypothesis: string
  earthBenefits: string
  materials: string[]
  geometry: string
  o2Range: number[]
  pressureKpa: number[]
  flowSpeedCms: number[]
  flameSpreadRateMms: number | null
  mocPercent: number | null
  hrrKw: number | null
  coPpm: number | null
  relevanceHabitat: string[]
  isFeaturedFireSafety: boolean
  nasaPsiUrl: string
  doi: string
  testConditions?: TestConditionDto[]
}

export type InvestigationListResponse = {
  featured: boolean
  count: number
  items: InvestigationSummaryDto[]
}

export type CompareResponse = {
  count: number
  items: InvestigationDetailDto[]
}

export type RankingItemDto = {
  rank: number
  score: number
  criteria: ScoreCriteriaDto
  investigation: InvestigationSummaryDto
  winningCondition?: WinningConditionDto | null
}

export type RankingResponse = {
  profile: string
  environment: string
  featured: boolean
  weights: ScoreWeightsDto
  count: number
  items: RankingItemDto[]
}

export type MissionTargetsDto = {
  o2Percent: number
  pressureKpa: number
  flowCms: number
}

export type CoverageCellDto = {
  o2Min: number
  o2Max: number
  pressureMinKpa: number
  pressureMaxKpa: number
  coverageCount: number
  investigationIds: string[]
}

export type GapsResponse = {
  environment: string
  targets: MissionTargetsDto
  partialGravityWarning: string
  nearTargetInvestigationIds: string[]
  coverageCells: CoverageCellDto[]
  featuredCount: number
}

export type ExportItemDto = {
  id: string
  acronym: string
  title: string
  category: string
  score: number
  criteria: ScoreCriteriaDto
  nasaPsiUrl: string
  doi: string
}

export type ExportResponse = {
  profile: string
  environment: string
  featured: boolean
  weights: ScoreWeightsDto
  count: number
  items: ExportItemDto[]
}

export type RankingQueryParams = {
  profile?: ApiProfileId | string
  environment?: ApiEnvironmentId | string
  category?: string
  featured?: boolean
  w1?: number
  w2?: number
  w3?: number
  w4?: number
  w5?: number
}

export type InvestigationQueryParams = {
  q?: string
  category?: string
  featured?: boolean
  o2Min?: number
  o2Max?: number
  pressureMin?: number
  pressureMax?: number
}

export type GapsQueryParams = {
  environment?: ApiEnvironmentId | string
}

export type ExportQueryParams = {
  format?: 'json' | 'csv'
  profile?: ApiProfileId | string
  environment?: ApiEnvironmentId | string
  category?: string
  featured?: boolean
}

export type AgentQueryStateDto = {
  env?: string | null
  material?: string | null
  o2?: number | null
  psi?: number | null
  flow?: number | null
  goal?: string | null
  claim?: string | null
}

export type AgentHistoryTurnDto = {
  role: 'user' | 'model' | 'assistant'
  text: string
}

export type AgentLocale = 'en-US' | 'pt-BR'

export type AgentAskRequest = {
  message: string
  profile?: ApiProfileId | string
  environment?: ApiEnvironmentId | string
  category?: string
  locale?: AgentLocale | string
  query?: AgentQueryStateDto
  history?: AgentHistoryTurnDto[]
}

export type DashboardIntent =
  | 'hazard'
  | 'prediction'
  | 'coverage'
  | 'ranking'
  | 'custom'

export type DashboardPredictability = 'high' | 'medium' | 'low'

export type DashboardScenario = {
  label: string
  environment: ApiEnvironmentId | string
  note?: string | null
  predictability: DashboardPredictability | string
}

export type DashboardWidget =
  | { type: 'rankingTop3'; title?: string | null }
  | { type: 'gapsHeatmap'; title?: string | null }
  | {
      type: 'criteriaBars'
      title?: string | null
      investigationId?: string | null
    }
  | {
      type: 'materialHazard'
      title?: string | null
      limit?: number | null
    }
  | {
      type: 'scenarioPredictability'
      title?: string | null
      scenarios: DashboardScenario[]
    }
  | { type: 'insight'; title?: string | null; body: string }

export type DashboardSpec = {
  title: string
  subtitle?: string | null
  intent: DashboardIntent | string
  widgets: DashboardWidget[]
}

export type AgentAskResponse = {
  text: string
  ranking: RankingResponse | null
  gaps: GapsResponse | null
  toolsUsed: string[]
  dashboard: DashboardSpec | null
}
