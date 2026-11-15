import { memo, useMemo } from 'react'
import type { CoverageCellDto } from '@/services/shared/contracts'
import type { Options } from 'highcharts'
import Highcharts from 'highcharts'
import HeatmapModule from 'highcharts/modules/heatmap'
import type { ScoredInvestigation } from '../../domain/types'
import { HighchartsHost } from './HighchartsHost'

const Navy = '#1B2B85'
const Blue = '#0050D8'
const Sky = '#2491FF'
const Gap = '#B23E00'

type HeatmapFactory = (hc: typeof Highcharts) => void
const applyHeatmap = HeatmapModule as unknown as HeatmapFactory
if (typeof applyHeatmap === 'function') {
  applyHeatmap(Highcharts)
}

function isChatDark(): boolean {
  if (typeof document === 'undefined') return false
  return (
    document.documentElement.dataset.theme === 'dark' ||
    Boolean(document.querySelector('.chat-app[data-theme="dark"]'))
  )
}

function chartPalette(dark: boolean) {
  return {
    ink: dark ? '#E8EAF2' : '#151622',
    muted: dark ? '#9AA0B8' : '#8A8D9B',
    field: dark ? '#2A2F4C' : '#ECEEF4',
    heatMin: dark ? '#331F12' : '#FFF0E6',
    heatBorder: dark ? '#1C2034' : '#fff',
  }
}

function chartBase(dark: boolean): Partial<Options> {
  const p = chartPalette(dark)
  return {
    credits: { enabled: false },
    accessibility: { enabled: true },
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: '"Fira Sans", system-ui, sans-serif',
        color: p.ink,
      },
    },
    title: { text: undefined },
    legend: { enabled: false },
  }
}

export const RankingTop3Chart = memo(function RankingTop3Chart({
  top,
  emptyLabel,
}: {
  top: ScoredInvestigation[]
  emptyLabel: string
}) {
  const dark = isChatDark()
  const items = useMemo(() => top.slice(0, 3), [top])

  const options = useMemo(() => {
    if (items.length === 0) return null
    const p = chartPalette(dark)
    const opts: Options = {
      ...chartBase(dark),
      chart: { ...chartBase(dark).chart, type: 'bar', height: 220 },
      xAxis: {
        categories: items.map((i) => i.name),
        title: { text: undefined },
        lineColor: p.field,
        tickColor: p.field,
        labels: { style: { color: p.ink } },
      },
      yAxis: {
        min: 0,
        max: 10,
        title: { text: undefined },
        gridLineColor: p.field,
        labels: { style: { color: p.muted } },
      },
      tooltip: {
        pointFormat: '<b>{point.y:.1f}</b> / 10',
      },
      series: [
        {
          type: 'bar',
          name: 'Score',
          data: items.map((i) => ({
            y: Math.round(i.nota * 10) / 10,
            color: i.nota >= 7.5 ? Gap : i.nota >= 5 ? Blue : Sky,
          })),
          dataLabels: {
            enabled: true,
            format: '{y:.1f}',
            color: p.ink,
            style: {
              fontSize: '11px',
              fontWeight: '600',
              color: p.ink,
              textOutline: 'none',
            },
          },
        },
      ],
    }
    return opts
  }, [items, dark])

  if (!options) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>
  }

  return <HighchartsHost options={options} />
})

export const CriteriaBarsChart = memo(function CriteriaBarsChart({
  top,
  labels,
  emptyLabel,
  noMeasurement,
}: {
  top: ScoredInvestigation[]
  labels: [string, string, string, string, string]
  emptyLabel: string
  noMeasurement: string
}) {
  const dark = isChatDark()
  const item = top[0]
  const labelKey = labels.join('\0')

  const options = useMemo(() => {
    if (!item) return null
    const cats = labelKey.split('\0') as [
      string,
      string,
      string,
      string,
      string,
    ]
    const p = chartPalette(dark)
    const keys = ['prox', 'moc', 'spread', 'hrr', 'tox'] as const
    const data = keys.map((k, idx) => {
      const v = item.vals[k]
      if (v == null || !Number.isFinite(v)) {
        return { y: null as number | null, color: p.field, name: cats[idx] }
      }
      return {
        y: Math.round(v * 100) / 10,
        color: Navy,
        name: cats[idx],
      }
    })

    const ppHint =
      item.ppO2Kpa != null
        ? ` · ppO₂ ${item.ppO2Kpa} kPa`
        : item.winningCondition?.provenance
          ? ` · ${item.winningCondition.provenance}`
          : ''

    const opts: Options = {
      ...chartBase(dark),
      chart: { ...chartBase(dark).chart, type: 'column', height: 240 },
      xAxis: {
        categories: cats,
        lineColor: p.field,
        tickColor: p.field,
        labels: { style: { color: p.ink } },
      },
      yAxis: {
        min: 0,
        max: 10,
        title: { text: undefined },
        gridLineColor: p.field,
        labels: { style: { color: p.muted } },
      },
      tooltip: {
        formatter() {
          if (this.y == null) return `${this.x}<br/>${noMeasurement}`
          return `<b>${this.x}</b>: ${Highcharts.numberFormat(Number(this.y), 1)}/10${ppHint}`
        },
      },
      series: [
        {
          type: 'column',
          name: item.name,
          data: data.map((d) => ({
            y: d.y,
            color: d.color,
          })),
          dataLabels: {
            enabled: true,
            format: '{y:.1f}',
            color: p.ink,
            style: {
              fontSize: '11px',
              fontWeight: '600',
              color: p.ink,
              textOutline: 'none',
            },
          },
        },
      ],
    }
    return opts
  }, [item, labelKey, noMeasurement, dark])

  if (!options) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>
  }

  return <HighchartsHost options={options} />
})

export const GapsHeatmapChart = memo(function GapsHeatmapChart({
  cells,
  emptyLabel,
}: {
  cells: CoverageCellDto[] | null | undefined
  emptyLabel: string
}) {
  const dark = isChatDark()

  const options = useMemo(() => {
    if (!cells?.length) return null
    const p = chartPalette(dark)
    const o2Labels = [...new Set(cells.map((c) => `${c.o2Min}–${c.o2Max}`))]
    const pLabels = [
      ...new Set(cells.map((c) => `${c.pressureMinKpa}–${c.pressureMaxKpa}`)),
    ]

    const data: [number, number, number][] = cells.map((c) => {
      const x = o2Labels.indexOf(`${c.o2Min}–${c.o2Max}`)
      const y = pLabels.indexOf(`${c.pressureMinKpa}–${c.pressureMaxKpa}`)
      return [x, y, c.coverageCount]
    })

    const opts: Options = {
      ...chartBase(dark),
      chart: { ...chartBase(dark).chart, type: 'heatmap', height: 260 },
      xAxis: {
        categories: o2Labels,
        title: { text: 'O₂ %', style: { color: p.muted } },
        labels: { style: { color: p.ink } },
      },
      yAxis: {
        categories: pLabels,
        title: { text: 'kPa', style: { color: p.muted } },
        labels: { style: { color: p.ink } },
        reversed: true,
      },
      colorAxis: {
        min: 0,
        minColor: p.heatMin,
        maxColor: Navy,
      },
      legend: {
        enabled: true,
        align: 'right',
        layout: 'vertical',
        verticalAlign: 'middle',
        symbolHeight: 120,
        itemStyle: { color: p.ink },
      },
      tooltip: {
        formatter() {
          const pt = this as unknown as Highcharts.Point
          const o2 = o2Labels[Number(pt.x)] ?? ''
          const pressure = pLabels[Number(pt.y)] ?? ''
          return `O₂ ${o2}% · P ${pressure} kPa<br/><b>${pt.value}</b> investigations`
        },
      },
      series: [
        {
          type: 'heatmap',
          name: 'Coverage',
          data,
          dataLabels: {
            enabled: true,
            color: p.ink,
            style: {
              fontSize: '10px',
              color: p.ink,
              textOutline: 'none',
            },
          },
          borderWidth: 1,
          borderColor: p.heatBorder,
        },
      ],
    }
    return opts
  }, [cells, dark])

  if (!options) {
    return <span className="text-xs text-muted-foreground">{emptyLabel}</span>
  }

  return <HighchartsHost options={options} />
})
