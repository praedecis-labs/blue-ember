export type HealthStatus = 'loading' | 'ok' | 'down'

export type HealthPayload = {
  status: string
  service: string
}

export async function fetchHealth(): Promise<HealthPayload> {
  const response = await fetch('/api/health')
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }
  return response.json() as Promise<HealthPayload>
}
