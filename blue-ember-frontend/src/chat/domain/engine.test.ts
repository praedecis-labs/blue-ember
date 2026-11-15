import { describe, expect, it } from 'vitest'
import { buildVerdict, compute, localGaps, parseHypothesis } from './engine'

describe('parseHypothesis', () => {
  it('extracts lunar habitat conditions', () => {
    const p = parseHypothesis(
      'Acho que o tecido fino da cabine continua seguro no habitat lunar a 8,2 psi e 34% de O₂, com ventilação de 10 cm/s.',
    )
    expect(p.env).toBe('lua')
    expect(p.material).toBe('tecido')
    expect(p.o2).toBe(34)
    expect(p.psi).toBe(8.2)
    expect(p.flow).toBe(10)
    expect(p.claim).toBe('safe')
  })

  it('detects ISS and still air', () => {
    const p = parseHypothesis(
      'O combustível líquido apaga mais fácil com CO₂ na ISS a 21% de O₂ e ar parado.',
    )
    expect(p.env).toBe('iss')
    expect(p.material).toBe('liquido')
    expect(p.gas).toBe('co2')
    expect(p.flow).toBe(0)
    expect(p.goal).toBe('apagar')
  })
})

describe('parseHypothesis (English)', () => {
  it('extracts lunar habitat conditions', () => {
    const p = parseHypothesis(
      'I think thin cabin fabric stays safe in a lunar habitat at 8.2 psi and 34% O₂, with 10 cm/s ventilation.',
    )
    expect(p.env).toBe('lua')
    expect(p.material).toBe('tecido')
    expect(p.o2).toBe(34)
    expect(p.psi).toBe(8.2)
    expect(p.flow).toBe(10)
    expect(p.thick).toBe('fina')
    expect(p.claim).toBe('safe')
  })

  it('detects Mars, thick acrylic, flow direction and a risk claim', () => {
    const p = parseHypothesis(
      'Does thick acrylic-like plastic burn faster on Mars at 10.2 psi and 26.5% oxygen if air flows with the flame?',
    )
    expect(p.env).toBe('marte')
    expect(p.material).toBe('plastico')
    expect(p.thick).toBe('grossa')
    expect(p.dir).toBe('favor')
    expect(p.o2).toBe(26.5)
    expect(p.claim).toBe('risky')
  })

  it('detects ISS, liquid fuel, CO2 and still air', () => {
    const p = parseHypothesis(
      'Liquid fuel extinguishes more easily with CO₂ on the ISS at 21% O₂ and still air.',
    )
    expect(p.env).toBe('iss')
    expect(p.material).toBe('liquido')
    expect(p.gas).toBe('co2')
    expect(p.flow).toBe(0)
    expect(p.goal).toBe('apagar')
    expect(p.claim).toBe('safe')
  })

  it('treats "not safe" as a risk claim', () => {
    const p = parseHypothesis('Fabric is not safe on the Moon at 30% O2.')
    expect(p.claim).toBe('risky')
    expect(p.env).toBe('lua')
  })

  it('reads detection questions', () => {
    const p = parseHypothesis(
      'Do ISS smoke detectors notice fabric burning at 5 cm/s ventilation?',
    )
    expect(p.goal).toBe('detectar')
    expect(p.flow).toBe(5)
    expect(p.env).toBe('iss')
  })
})

describe('localGaps', () => {
  it('flags lunar partial gravity and high O2 gaps', () => {
    const r = localGaps({
      env: 'lua',
      material: 'tecido',
      o2: 34,
      psi: 8.2,
      flow: 10,
      thick: 'fina',
      dir: '',
      gas: '',
      goal: 'prevenir',
    })
    expect(r.above).toBe(true)
    expect(r.gaps.some((g) => g.includes('Lua'))).toBe(true)
  })

  it('uses mars-specific gap copy', () => {
    const r = localGaps({
      env: 'marte',
      material: 'plastico',
      o2: 26.5,
      psi: 10.2,
      flow: 20,
      thick: 'grossa',
      dir: 'favor',
      gas: '',
      goal: 'prevenir',
    })
    const grav = r.gaps.find((g) => g.includes('Gravidade parcial'))
    expect(grav).toBeTruthy()
    expect(grav).toContain('Marte')
    expect(grav).not.toContain('gravidade lunar')
  })
})

describe('compute (legacy local DATA ranking)', () => {
  it('still ranks mock DATA for regression until removed', () => {
    const r = compute(
      {
        env: 'lua',
        material: 'tecido',
        o2: 34,
        psi: 8.2,
        flow: 10,
        thick: 'fina',
        dir: '',
        gas: '',
        goal: 'prevenir',
      },
      'eng',
    )
    expect(r.top.length).toBe(3)
    expect(r.featuredCount).toBeGreaterThan(0)
    expect(r.top[0].nota).toBeGreaterThan(0)
  })
})

describe('buildVerdict', () => {
  it('rejects safe claim when evidence is weak', () => {
    const t = (key: string) =>
      key === 'verdict.unconfirmed' ? 'Cannot confirm' : key
    expect(buildVerdict('safe', 'weak', t)).toEqual([
      'weak',
      'Cannot confirm',
    ])
  })
})
