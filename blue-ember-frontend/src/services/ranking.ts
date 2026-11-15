import type { RankingQueryParams, RankingResponse } from './contracts'
import { buildQuery, requestJson } from './http'

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
