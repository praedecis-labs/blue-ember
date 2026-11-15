import type { ExportQueryParams, ExportResponse } from './contracts'
import { buildQuery, requestBlob, requestJson } from './http'

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
