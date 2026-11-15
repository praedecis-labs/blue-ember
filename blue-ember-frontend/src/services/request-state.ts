import { ApiError } from './http'

export type RequestStatus = 'idle' | 'loading' | 'ok' | 'error'

export type RequestState<T> = {
  status: RequestStatus
  data: T | null
  message: string | null
}

export function idleState<T>(): RequestState<T> {
  return { status: 'idle', data: null, message: null }
}

export function loadingState<T>(previous?: RequestState<T>): RequestState<T> {
  return { status: 'loading', data: previous?.data ?? null, message: null }
}

export function okState<T>(data: T): RequestState<T> {
  return { status: 'ok', data, message: null }
}

export function errorState<T>(message: string, previous?: RequestState<T>): RequestState<T> {
  return { status: 'error', data: previous?.data ?? null, message }
}

/** Map thrown values to a short user-facing message. */
export function messageFromUnknown(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.body?.error) return err.body.error
    if (err.status === 0 || err.message.includes('Failed to fetch')) {
      return 'Não foi possível conectar à API. Verifique se o backend está no ar.'
    }
    return err.message || `Erro da API (${err.status})`
  }
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return 'Não foi possível conectar à API. Verifique se o backend está no ar.'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Algo deu errado ao falar com a API.'
}
