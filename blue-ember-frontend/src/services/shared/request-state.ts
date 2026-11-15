import { getCurrentLocale } from '@/i18n/locales'
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

const pt = () => getCurrentLocale() === 'pt-BR'
const offlineMsg = () =>
  pt()
    ? 'Não foi possível conectar à API. Verifique se o backend está no ar.'
    : 'Could not reach the API. Check that the backend is running.'

function appendMissing(base: string, missing?: string[]): string {
  if (!missing?.length) return base
  return `${base} (${pt() ? 'faltando' : 'missing'}: ${missing.join(', ')})`
}

/** Map thrown values to a short user-facing message. */
export function messageFromUnknown(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.body?.error) {
      return appendMissing(err.body.error, err.body.missing)
    }
    if (err.status === 0 || err.message.includes('Failed to fetch')) {
      return offlineMsg()
    }
    return appendMissing(
      err.message || `${pt() ? 'Erro da API' : 'API error'} (${err.status})`,
      err.body?.missing,
    )
  }
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return offlineMsg()
  }
  // axios sem resposta do servidor (backend fora do ar ou rede caiu)
  const code = (err as { code?: string } | null)?.code
  if (code === 'ERR_NETWORK' || code === 'ECONNREFUSED' || (err instanceof Error && err.message === 'Network Error')) {
    return offlineMsg()
  }
  if (err instanceof Error && err.message) return err.message
  return pt()
    ? 'Algo deu errado ao falar com a API.'
    : 'Something went wrong talking to the API.'
}
