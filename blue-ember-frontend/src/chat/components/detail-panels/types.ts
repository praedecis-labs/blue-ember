import type { ChatMessage } from '../../types'

export type AiMsg = Extract<ChatMessage, { kind: 'ai' }>

/**
 * DOIs escondidos até o backend trocar pelos reais.
 * Os DOIs da API (10.25923/nasa.psi-…) não existem no doi.org; os reais do PSI
 * usam o prefixo 10.60555 (ex.: SAFFIRE-II = 10.60555/2chp-m469). O link do PSI
 * continua visível e a página dele mostra o DOI verdadeiro.
 * Quando o backend corrigir, basta trocar para true.
 */
export const SHOW_DOI = false
