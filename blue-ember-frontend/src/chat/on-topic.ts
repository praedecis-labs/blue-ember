import { parseHypothesis } from './engine'
import type { ParseResult } from './types'

const DOMAIN_RE =
  /\b(?:fire|burn|flame|combust(?:ion|ão|ivel)?|smoke|oxygen|o₂|o2|psi|kpa|iss|moon|mars|lunar|marte|lua|habitat|cabin|fabric|cotton|acrylic|pmma|nomex|suppress|extinguish|detect(?:ion)?|alarm|toxic|toxicity|moc|saffire|bass|fogo|chama|queim[ao]|fuma[cç]a|oxig[eê]nio|tecido|pano|roupa|algod[aã]o|acr[ií]lico|pl[aá]stico|l[ií]quido|apagar|extin[gğ]|detectar|sensor|alarme|press[aã]o|ventila|fluxo|gravidade|microgravidade|prevenc|deteccao|supress|segur(?:o|a|ança)?|risco|perig|material|investigac)/i

export function hasParsedTopicSignal(parsed: ParseResult): boolean {
  return (
    parsed.env != null ||
    parsed.material != null ||
    parsed.o2 != null ||
    parsed.psi != null ||
    parsed.flow != null ||
    parsed.thick != null ||
    parsed.dir != null ||
    parsed.gas != null ||
    parsed.goal != null ||
    parsed.claim != null
  )
}

/** True when the text is long enough and in Blue Ember fire-safety / habitat scope. */
export function isOnTopicHypothesis(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 4) return false
  if (hasParsedTopicSignal(parseHypothesis(trimmed))) return true
  return DOMAIN_RE.test(trimmed)
}
