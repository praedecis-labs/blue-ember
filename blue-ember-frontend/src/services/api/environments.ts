import type { EnvironmentListResponse } from '../shared/contracts'
import { requestJson } from '../shared/http'

export function getEnvironments(): Promise<EnvironmentListResponse> {
  return requestJson<EnvironmentListResponse>('/api/environments')
}
