import type { ProfileListResponse } from '../shared/contracts'
import { requestJson } from '../shared/http'

export function getProfiles(): Promise<ProfileListResponse> {
  return requestJson<ProfileListResponse>('/api/profiles')
}
