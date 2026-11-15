import type { ChatMessage } from '../../types'

export type AiMsg = Extract<ChatMessage, { kind: 'ai' }>
