/** Separa a linha final "Próximo passo:" / "Next step:" que o agente acrescenta à resposta.
 *  Sem essa linha, devolve o texto como está (next = null). */
const RX = /(?:^|\n|\s)(?:pr[óo]ximo passo|next step|o que fazer|what to do)\s*:\s*([^\n]+)\s*$/i

export function splitNextStep(text: string): { body: string; next: string | null } {
  const m = RX.exec(text)
  if (!m || m.index === undefined) return { body: text, next: null }
  const body = text.slice(0, m.index).trim()
  const next = m[1].trim()
  if (!body || !next) return { body: text, next: null }
  return { body, next }
}
