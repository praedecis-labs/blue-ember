import type { ApiEnvironmentId, ApiProfileId } from '@/services/contracts'
import type { EnvId, ProfileId } from './types'

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
