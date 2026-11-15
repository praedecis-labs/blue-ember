import { useEffect, useState } from 'react'
import { fetchHealth, type HealthStatus } from '@/services/api/health'

export function useApiHealth(): HealthStatus {
  const [health, setHealth] = useState<HealthStatus>('loading')

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then(() => {
        if (!cancelled) setHealth('ok')
      })
      .catch(() => {
        if (!cancelled) setHealth('down')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return health
}
