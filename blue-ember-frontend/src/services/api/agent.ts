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

export type AgentTranslateResponse = { text: string; locale: string; provider: string }

/** Traduz a resposta da IA para o idioma da tela (POST /api/agent/translate). */
export function translateAgentText(
  text: string,
  targetLocale: string,
): Promise<AgentTranslateResponse> {
  return requestJson<AgentTranslateResponse>('/api/agent/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLocale }),
  })
}
