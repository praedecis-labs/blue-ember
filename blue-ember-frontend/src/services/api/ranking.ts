import type { RankingQueryParams, RankingResponse } from '../shared/contracts'
import { buildQuery, requestJson } from '../shared/http'

export function getRanking(params?: RankingQueryParams): Promise<RankingResponse> {
  return requestJson<RankingResponse>(`/api/ranking${buildQuery(params)}`)
}

export function getRankingFireSafety(
  params?: Omit<RankingQueryParams, 'featured'>,
): Promise<RankingResponse> {
  return requestJson<RankingResponse>(
    `/api/ranking/fire-safety${buildQuery(params)}`,
  )
}
