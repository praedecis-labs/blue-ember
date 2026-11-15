import type { GapsQueryParams, GapsResponse } from './contracts'
import { buildQuery, requestJson } from './http'

export function getGaps(params?: GapsQueryParams): Promise<GapsResponse> {
  return requestJson<GapsResponse>(`/api/gaps${buildQuery(params)}`)
}
