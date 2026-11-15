import { describe, expect, it } from 'vitest'
import { sanitizeAgentProse } from './sanitize-agent-prose'

describe('sanitizeAgentProse', () => {
  it('removes markdown headings and bold', () => {
    const out = sanitizeAgentProse(
      '## Análise\n\n**Risco alto** no habitat lunar.\n\n- Item um\n- Item dois',
    )
    expect(out).not.toMatch(/#/)
    expect(out).not.toMatch(/\*\*/)
    expect(out).toContain('Risco alto')
    expect(out).toContain('Item um')
  })

  it('caps to six lines collapsed as sentences', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `Frase ${i + 1}.`)
    const out = sanitizeAgentProse(lines.join('\n'))
    expect(out.split(' Frase ').length).toBeLessThanOrEqual(7)
  })
})
