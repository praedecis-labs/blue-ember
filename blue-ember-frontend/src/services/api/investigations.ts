import type {
  CompareResponse,
  InvestigationDetailDto,
  InvestigationListResponse,
  InvestigationQueryParams,
} from '../shared/contracts'
import { buildQuery, requestJson } from '../shared/http'

export function getInvestigations(
  params?: InvestigationQueryParams,
): Promise<InvestigationListResponse> {
  return requestJson<InvestigationListResponse>(
    `/api/investigations${buildQuery(params)}`,
  )
}

export function getInvestigation(id: string): Promise<InvestigationDetailDto> {
  return requestJson<InvestigationDetailDto>(
    `/api/investigations/${encodeURIComponent(id)}`,
  )
}

export function compareInvestigations(ids: string[]): Promise<CompareResponse> {
  return requestJson<CompareResponse>(
    `/api/investigations/compare${buildQuery({ ids: ids.join(',') })}`,
  )
}
