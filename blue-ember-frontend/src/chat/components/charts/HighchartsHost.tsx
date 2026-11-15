import Highcharts from 'highcharts'
import { useEffect, useRef } from 'react'

type Props = {
  options: Highcharts.Options
  className?: string
}

export function HighchartsHost({ options, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Highcharts.Chart | null>(null)

  useEffect(() => {
    if (!ref.current) return
    chartRef.current = Highcharts.chart(ref.current, options)
    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.update(options, true, true)
  }, [options])

  return <div ref={ref} className={className} style={{ width: '100%', minHeight: 220 }} />
}
