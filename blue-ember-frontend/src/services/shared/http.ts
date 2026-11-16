import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
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

function asErrorBody(data: unknown): ErrorResponse | null {
  if (
    data !== null &&
    typeof data === 'object' &&
    'error' in data &&
    typeof (data as ErrorResponse).error === 'string'
  ) {
    return data as ErrorResponse
  }
  return null
}

function toAxiosConfig(init?: RequestInit): AxiosRequestConfig {
  if (!init) return {}
  const headers =
    init.headers instanceof Headers
      ? Object.fromEntries(init.headers.entries())
      : (init.headers as AxiosRequestConfig['headers'])

  return {
    method: init.method,
    headers,
    data: init.body,
    signal: init.signal ?? undefined,
  }
}

function throwApiError(error: unknown): never {
  if (isAxiosError(error) && error.response) {
    throw new ApiError(error.response.status, asErrorBody(error.response.data))
  }
  throw error
}

/** Prefix `/api/...` with `VITE_API_BASE_URL` in production; keep relative in local Vite proxy. */
export function resolveApiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
  if (!base) return path
  const normalizedBase = base.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const { data } = await axios.request<T>({
      url: resolveApiUrl(path),
      ...toAxiosConfig(init),
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  try {
    const { data } = await axios.request<Blob>({
      url: resolveApiUrl(path),
      responseType: 'blob',
      ...toAxiosConfig(init),
    })
    return data
  } catch (error) {
    throwApiError(error)
  }
}
