import type { ExportQueryParams, ExportResponse } from '../shared/contracts'
import { buildQuery, requestBlob, requestJson } from '../shared/http'

export async function exportRanking(
  params?: ExportQueryParams,
): Promise<ExportResponse | Blob> {
  const format = params?.format ?? 'json'
  const path = `/api/export${buildQuery(params)}`
  if (format === 'csv') {
    return requestBlob(path)
  }
  return requestJson<ExportResponse>(path)
}
