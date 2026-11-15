import { enUS } from './messages/en-US'
import { ptBR } from './messages/pt-BR'

/**
 * Textos já gravados numa resposta (veredito, nível de evidência) ficam no idioma
 * em que a resposta foi feita. Este índice acha a chave de um texto fixo nos dois
 * catálogos para mostrá-lo de novo no idioma atual. Textos com variáveis não entram.
 */
type Tree = { [k: string]: string | Tree }
const index = new Map<string, string>()

function walk(tree: Tree, prefix: string) {
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') {
      if (!v.includes('{{') && !index.has(v)) index.set(v, key)
    } else walk(v, key)
  }
}
walk(enUS as unknown as Tree, '')
walk(ptBR as unknown as Tree, '')

export function retranslate(text: string, t: (key: string) => string): string {
  const key = index.get(text)
  return key ? t(key) : text
}
