import type { ChatMessage } from '../../domain/types'

export type AiMsg = Extract<ChatMessage, { kind: 'ai' }>

/**
 * Show DOI when the API returns a real one (synthetic 10.25923/nasa.psi-* are stripped server-side).
 */
export const SHOW_DOI = true

export function provenanceLabel(
  provenance: string | null | undefined,
  estimated: string,
  measured: string,
  unknown: string,
): string {
  const p = (provenance ?? '').toLowerCase()
  if (p === 'measured') return measured
  if (p === 'estimated') return estimated
  return unknown
}
