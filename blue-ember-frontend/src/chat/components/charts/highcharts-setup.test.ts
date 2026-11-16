import { describe, expect, it } from 'vitest'
import { applyHighchartsModule, resolveHighcharts } from './highcharts-setup.ts'

describe('resolveHighcharts', () => {
  it('unwraps nested default export used by some bundlers', () => {
    const inner = { Axis: {}, chart: () => null }
    expect(resolveHighcharts({ default: inner })).toBe(inner)
  })

  it('returns the module itself when already unwrapped', () => {
    const hc = { Axis: {}, chart: () => null }
    expect(resolveHighcharts(hc)).toBe(hc)
  })
})

describe('applyHighchartsModule', () => {
  it('calls factory with Highcharts instance', () => {
    const hc = { Axis: {} }
    let received: unknown
    applyHighchartsModule((target: unknown) => {
      received = target
    }, hc)
    expect(received).toBe(hc)
  })

  it('unwraps default-exported factory', () => {
    const hc = { Axis: {} }
    let received: unknown
    applyHighchartsModule(
      {
        default: (target: unknown) => {
          received = target
        },
      },
      hc,
    )
    expect(received).toBe(hc)
  })
})
