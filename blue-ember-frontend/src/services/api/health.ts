import type { HealthPayload } from '../shared/contracts'
import { requestJson } from '../shared/http'

export type { HealthPayload }
export type HealthStatus = 'loading' | 'ok' | 'down'

export function getHealth(): Promise<HealthPayload> {
  return requestJson<HealthPayload>('/api/health')
}

/** @deprecated Prefer getHealth — kept for existing chat/header callers. */
export function fetchHealth(): Promise<HealthPayload> {
  return getHealth()
}
