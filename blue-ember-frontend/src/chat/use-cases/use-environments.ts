import { useEffect, useState } from 'react'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { getEnvironments } from '@/services/api/environments'
import {
  errorState,
  idleState,
  loadingState,
  messageFromUnknown,
  okState,
  type RequestState,
} from '@/services/shared/request-state'

export function useEnvironments(): RequestState<EnvironmentDto[]> {
  const [state, setState] = useState<RequestState<EnvironmentDto[]>>(idleState)

  useEffect(() => {
    let cancelled = false
    setState((prev) => loadingState(prev))
    getEnvironments()
      .then((res) => {
        if (!cancelled) setState(okState(res.items))
      })
      .catch((err: unknown) => {
        if (!cancelled) setState(errorState(messageFromUnknown(err)))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
