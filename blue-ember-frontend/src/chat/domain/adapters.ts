import type {
  ApiEnvironmentId,
  ApiProfileId,
  EnvironmentDto,
  RankingItemDto,
  RankingQueryParams,
  ScoreCriteriaDto,
} from '@/services/shared/contracts'
import type {
  CritKey,
  EnvId,
  GoalId,
  ProfileId,
  QueryState,
  ScoredInvestigation,
} from './types'

/** Inverse of engine `kpa` (psi * 6.895). */
export function kpaToPsi(kpa: number): number {
  return kpa / 6.895
}

/** Map API environment targets into QueryState numeric fields (psi from kPa). */
export function envTargetsToQueryPartial(dto: EnvironmentDto): {
  o2: number
  psi: number
  flow: number
} {
  return {
    o2: dto.targetO2Percent,
    psi: kpaToPsi(dto.targetPressureKpa),
    flow: dto.targetFlowCms,
  }
}

export type { ApiEnvironmentId, ApiProfileId }

const PROFILE_TO_API: Record<ProfileId, ApiProfileId> = {
  eng: 'ShipEngineer',
  pesq: 'Researcher',
  est: 'Student',
}

const API_TO_PROFILE: Record<ApiProfileId, ProfileId> = {
  ShipEngineer: 'eng',
  Researcher: 'pesq',
  Student: 'est',
}

const ENV_TO_API: Record<EnvId, ApiEnvironmentId> = {
  lua: 'Moon',
  marte: 'Mars',
  iss: 'Iss',
}

const API_TO_ENV: Record<ApiEnvironmentId, EnvId> = {
  Moon: 'lua',
  Mars: 'marte',
  Iss: 'iss',
}

export const PROFILE_IDS: ProfileId[] = ['eng', 'pesq', 'est']
export const ENV_IDS: EnvId[] = ['lua', 'marte', 'iss']

export function isProfileId(value: unknown): value is ProfileId {
  return typeof value === 'string' && PROFILE_IDS.includes(value as ProfileId)
}

export function isEnvId(value: unknown): value is EnvId {
  return typeof value === 'string' && ENV_IDS.includes(value as EnvId)
}

export function toApiProfile(id: ProfileId): ApiProfileId {
  return PROFILE_TO_API[id]
}

export function fromApiProfile(id: string): ProfileId | null {
  if (id in API_TO_PROFILE) return API_TO_PROFILE[id as ApiProfileId]
  if (isProfileId(id)) return id
  return null
}

export function toApiEnvironment(id: EnvId): ApiEnvironmentId {
  return ENV_TO_API[id]
}

export function fromApiEnvironment(id: string): EnvId | null {
  if (id in API_TO_ENV) return API_TO_ENV[id as ApiEnvironmentId]
  if (isEnvId(id)) return id
  return null
}

const GOAL_TO_CATEGORY: Record<GoalId, string> = {
  prevenir: 'prevencao',
  detectar: 'deteccao',
  apagar: 'supressao',
}

/** Map UI goal to ranking/export `category` query param. */
export function toApiCategory(goal: GoalId): string {
  return GOAL_TO_CATEGORY[goal]
}

/** Build ranking query params from profile + parsed QueryState. */
export function rankingParamsFromQuery(
  profile: ProfileId,
  q: Pick<QueryState, 'env' | 'goal'>,
): Pick<RankingQueryParams, 'profile' | 'environment' | 'category'> {
  return {
    profile: toApiProfile(profile),
    environment: toApiEnvironment(q.env),
    category: toApiCategory(q.goal),
  }
}

/** Map API C1–C5 criteria onto UI CritKey vals (0–1). */
export function criteriaToVals(
  c: ScoreCriteriaDto,
): Record<CritKey, number | null> {
  return {
    prox: c.c1Proximidade,
    moc: c.c2MargemMoc,
    spread: c.c3Cinetica,
    hrr: c.c4SeveridadeTermica,
    tox: c.c5Toxicidade,
  }
}

function o2Tuple(range: number[]): [number, number] {
  if (range.length >= 2) return [range[0], range[1]]
  if (range.length === 1) return [range[0], range[0]]
  return [0, 0]
}

/** Map a ranking item into the chat panel ScoredInvestigation shape. */
export function rankingItemToScored(item: RankingItemDto): ScoredInvestigation {
  const inv = item.investigation
  const vals = criteriaToVals(item.criteria)
  const have = (Object.values(vals) as Array<number | null>).filter(
    (v) => v !== null && Number.isFinite(v),
  ).length
  const wc = item.winningCondition
  const flow: [number, number] =
    wc?.flowSpeedCms != null
      ? [wc.flowSpeedCms, wc.flowSpeedCms]
      : [0, 0]
  const o2 =
    wc?.o2Percent != null ? ([wc.o2Percent, wc.o2Percent] as [number, number]) : o2Tuple(inv.o2Range)
  return {
    id: inv.id,
    name: inv.acronym,
    what: inv.title,
    materials: [],
    o2,
    flow,
    thick: [],
    gases: [],
    goal: 'prevenir',
    where: inv.platform,
    doi: null,
    nasaPsiUrl: inv.nasaPsiUrl,
    c: { moc: null, spread: null, hrr: null, tox: null },
    vals,
    nota: item.score,
    have,
    category: inv.category,
    winningCondition: wc
      ? {
          index: wc.index,
          material: wc.material,
          o2Percent: wc.o2Percent,
          pressureKpa: wc.pressureKpa,
          flowSpeedCms: wc.flowSpeedCms,
          ppO2Kpa: wc.ppO2Kpa,
          provenance: wc.provenance,
          regime: wc.regime,
        }
      : null,
    ppO2Kpa: item.criteria.ppO2Kpa ?? wc?.ppO2Kpa ?? null,
  }
}
