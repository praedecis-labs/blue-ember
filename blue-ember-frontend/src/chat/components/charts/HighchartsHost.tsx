import { useEffect, useRef } from 'react'
import type { Options } from 'highcharts'
import { loadHighchartsWithHeatmap } from './highcharts-setup.ts'

type Props = {
  options: Options
  className?: string
}

export function HighchartsHost({ options, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    let cancelled = false
    let chart: { destroy: () => void } | null = null

    void loadHighchartsWithHeatmap().then((hc) => {
      if (cancelled || !el.isConnected) return
      chart = hc.chart(el, options)
    })

    return () => {
      cancelled = true
      chart?.destroy()
    }
  }, [options])

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', minHeight: 220 }}
    />
  )
}
