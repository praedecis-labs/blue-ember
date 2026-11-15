import type { EnvironmentDto } from '@/services/contracts'
import {
  envTargetsToQueryPartial,
  fromApiEnvironment,
  toApiEnvironment,
} from './adapters'
import { DEFAULTS, ENV } from './data'
import type { EnvId, QueryState } from './types'

export function findEnvironmentDto(
  env: EnvId,
  environments?: EnvironmentDto[] | null,
): EnvironmentDto | null {
  if (!environments?.length) return null
  const apiId = toApiEnvironment(env)
  return (
    environments.find((e) => e.id === apiId) ??
    environments.find((e) => fromApiEnvironment(e.id) === env) ??
    null
  )
}

/** Seed QueryState from API targets when available; else local DEFAULTS. */
export function buildQueryDefaults(
  preferredEnv: EnvId,
  environments?: EnvironmentDto[] | null,
): QueryState {
  const base: QueryState = { ...DEFAULTS, env: preferredEnv }
  const dto = findEnvironmentDto(preferredEnv, environments)
  if (dto) {
    return { ...base, ...envTargetsToQueryPartial(dto) }
  }
  // Offline ISS preset matching the old prototype chips.
  if (preferredEnv === 'iss') {
    return { ...base, o2: 21, psi: 14.7, flow: 10 }
  }
  return base
}

export function environmentLabel(
  env: EnvId,
  environments?: EnvironmentDto[] | null,
): string {
  return findEnvironmentDto(env, environments)?.label ?? ENV[env]
}
