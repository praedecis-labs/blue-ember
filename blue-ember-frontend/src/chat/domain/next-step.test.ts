import { describe, expect, it } from 'vitest'
import { splitNextStep } from './next-step'

describe('splitNextStep', () => {
  it('separa a linha em português', () => {
    const r = splitNextStep('Há testes em ar de cabine.\nPróximo passo: ensaiar em solo com fluxo baixo.')
    expect(r).toEqual({ body: 'Há testes em ar de cabine.', next: 'ensaiar em solo com fluxo baixo.' })
  })
  it('separa a linha em inglês na mesma linha', () => {
    const r = splitNextStep('Few tests match. Next step: run a ground test at 34% O2.')
    expect(r.next).toBe('run a ground test at 34% O2.')
    expect(r.body).toBe('Few tests match.')
  })
  it('sem a linha, não muda nada', () => {
    expect(splitNextStep('Só texto.')).toEqual({ body: 'Só texto.', next: null })
  })
})
