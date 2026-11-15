import { describe, expect, it } from 'vitest'
import { enUS } from './messages/en-US'
import { ptBR } from './messages/pt-BR'
import { retranslate } from './retranslate'

const tEn = (k: string) => k.split('.').reduce<any>((o, p) => o?.[p], enUS) ?? k
describe('retranslate', () => {
  it('troca um texto fixo do português para o inglês', () => {
    expect(retranslate(ptBR.evidence.moderateFull, tEn)).toBe(enUS.evidence.moderateFull)
  })
  it('deixa texto desconhecido como está', () => {
    expect(retranslate('texto livre da IA', tEn)).toBe('texto livre da IA')
  })
})
