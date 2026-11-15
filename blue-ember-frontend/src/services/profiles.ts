import type { ProfileListResponse } from './contracts'
import { requestJson } from './http'

export function getProfiles(): Promise<ProfileListResponse> {
  return requestJson<ProfileListResponse>('/api/profiles')
}
