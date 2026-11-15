import type { EnvironmentListResponse } from './contracts'
import { requestJson } from './http'

export function getEnvironments(): Promise<EnvironmentListResponse> {
  return requestJson<EnvironmentListResponse>('/api/environments')
}
