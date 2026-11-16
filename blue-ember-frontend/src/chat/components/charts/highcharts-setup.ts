import Highcharts from 'highcharts'

type HighchartsLike = typeof Highcharts

/** Some bundlers nest the real API under `.default`. */
export function resolveHighcharts(mod: unknown): HighchartsLike {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const nested = (mod as { default: unknown }).default
    if (
      nested &&
      typeof nested === 'object' &&
      'chart' in (nested as object)
    ) {
      return nested as HighchartsLike
    }
  }
  return mod as HighchartsLike
}

export function applyHighchartsModule(factory: unknown, hc: unknown): void {
  const fn =
    typeof factory === 'function'
      ? factory
      : factory &&
          typeof factory === 'object' &&
          'default' in factory &&
          typeof (factory as { default: unknown }).default === 'function'
        ? (factory as { default: (target: unknown) => void }).default
        : null
  if (typeof fn === 'function') fn(hc)
}

export const highcharts = resolveHighcharts(Highcharts)

function attachGlobal(hc: HighchartsLike) {
  const root = globalThis as typeof globalThis & {
    Highcharts?: HighchartsLike
    _Highcharts?: HighchartsLike
  }
  root.Highcharts = hc
  root._Highcharts = hc
}

let heatmapReady: Promise<HighchartsLike> | null = null

/**
 * Highcharts 13 heatmap UMD expects `window.Highcharts` before the module
 * evaluates — static `import 'highcharts/modules/heatmap'` crashes Vite prod.
 */
export function loadHighchartsWithHeatmap(): Promise<HighchartsLike> {
  if (!heatmapReady) {
    attachGlobal(highcharts)
    heatmapReady = import('highcharts/modules/heatmap')
      .then((mod) => {
        applyHighchartsModule(mod, highcharts)
        return highcharts
      })
      .catch(() => highcharts)
  }
  return heatmapReady
}
