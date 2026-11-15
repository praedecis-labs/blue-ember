import Highcharts from 'highcharts'
import { useEffect, useRef } from 'react'

type Props = {
  options: Highcharts.Options
  className?: string
}

export function HighchartsHost({ options, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const chart = Highcharts.chart(ref.current, options)
    return () => {
      chart.destroy()
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
