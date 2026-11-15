import { describe, expect, it } from 'vitest'
import { psiUrl } from './psi-url'

describe('psiUrl', () => {
  it('monta o link /data/ a partir do id, ignorando o link quebrado da API', () => {
    expect(
      psiUrl({ id: 'PSI-99', nasaPsiUrl: 'https://psi.nasa.gov/physci/repo/investigations/PSI-99' }),
    ).toBe('https://psi.nasa.gov/physci/repo/data/investigations/PSI-99')
  })
  it('corrige o link da API quando o id não é PSI-n', () => {
    expect(
      psiUrl({ id: 'x', nasaPsiUrl: 'https://psi.nasa.gov/physci/repo/investigations/PSI-7' }),
    ).toBe('https://psi.nasa.gov/physci/repo/data/investigations/PSI-7')
  })
  it('cai na busca do PSI sem id nem link', () => {
    expect(psiUrl({ id: '' })).toBe('https://psi.nasa.gov/physci/repo/search')
  })
})
