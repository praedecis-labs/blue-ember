import type {
  AgentAskRequest,
  AgentAskResponse,
} from '../shared/contracts'
import { requestJson } from '../shared/http'

export function askAgent(body: AgentAskRequest): Promise<AgentAskResponse> {
  return requestJson<AgentAskResponse>('/api/agent/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
