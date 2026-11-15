import type { ErrorResponse } from './contracts'

export class ApiError extends Error {
  readonly status: number
  readonly body: ErrorResponse | null

  constructor(status: number, body: ErrorResponse | null, fallbackMessage?: string) {
    const message = body?.error ?? fallbackMessage ?? `Request failed: ${status}`
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type QueryValue = string | number | boolean | undefined | null

/** Build `?a=1&b=2` from a params object; omits null/undefined. */
export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function parseErrorBody(response: Response): Promise<ErrorResponse | null> {
  try {
    const data: unknown = await response.json()
    if (
      data !== null &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as ErrorResponse).error === 'string'
    ) {
      return data as ErrorResponse
    }
  } catch {
    // non-JSON body
  }
  return null
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ApiError(response.status, body)
  }
  return response.json() as Promise<T>
}

export async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(path, init)
  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ApiError(response.status, body)
  }
  return response.blob()
}
