import { useEffect, useState } from 'react'
import type { ProfileDto } from '@/services/contracts'
import { getProfiles } from '@/services/profiles'
import {
  errorState,
  idleState,
  loadingState,
  messageFromUnknown,
  okState,
  type RequestState,
} from '@/services/request-state'

export function useProfiles(): RequestState<ProfileDto[]> {
  const [state, setState] = useState<RequestState<ProfileDto[]>>(idleState)

  useEffect(() => {
    let cancelled = false
    setState((prev) => loadingState(prev))
    getProfiles()
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
