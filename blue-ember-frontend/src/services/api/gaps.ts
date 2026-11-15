import type { GapsQueryParams, GapsResponse } from '../shared/contracts'
import { buildQuery, requestJson } from '../shared/http'

export function getGaps(params?: GapsQueryParams): Promise<GapsResponse> {
  return requestJson<GapsResponse>(`/api/gaps${buildQuery(params)}`)
}
