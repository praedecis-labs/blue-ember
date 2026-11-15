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
const Field = '#ECEEF4'

type HeatmapFactory = (hc: typeof Highcharts) => void
const applyHeatmap = HeatmapModule as unknown as HeatmapFactory
if (typeof applyHeatmap === 'function') {
  applyHeatmap(Highcharts)
}

function chartBase(): Partial<Options> {
  return {
    credits: { enabled: false },
    accessibility: { enabled: true },
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: '"Fira Sans", system-ui, sans-serif' },
    },
    title: { text: undefined },
    legend: { enabled: false },
  }
}

export function RankingTop3Chart({
  top,
  emptyLabel,
}: {
  top: ScoredInvestigation[]
  emptyLabel: string
}) {
  const items = top.slice(0, 3)
  if (items.length === 0) {
    return <span className="hint">{emptyLabel}</span>
  }

  const options: Options = {
    ...chartBase(),
    chart: { ...chartBase().chart, type: 'bar', height: 220 },
    xAxis: {
      categories: items.map((i) => i.name),
      title: { text: undefined },
      lineColor: Field,
      tickColor: Field,
    },
    yAxis: {
      min: 0,
      max: 10,
      title: { text: undefined },
      gridLineColor: Field,
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
          style: { fontSize: '11px', fontWeight: '600', textOutline: 'none' },
        },
      },
    ],
  }

  return <HighchartsHost options={options} />
}

export function CriteriaBarsChart({
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
  const item = top[0]
  if (!item) return <span className="hint">{emptyLabel}</span>

  const keys = ['prox', 'moc', 'spread', 'hrr', 'tox'] as const
  const data = keys.map((k, idx) => {
    const v = item.vals[k]
    if (v == null || !Number.isFinite(v)) {
      return { y: null as number | null, color: Field, name: labels[idx] }
    }
    return {
      y: Math.round(v * 100) / 10,
      color: Navy,
      name: labels[idx],
    }
  })

  const ppHint =
    item.ppO2Kpa != null
      ? ` · ppO₂ ${item.ppO2Kpa} kPa`
      : item.winningCondition?.provenance
        ? ` · ${item.winningCondition.provenance}`
        : ''

  const options: Options = {
    ...chartBase(),
    chart: { ...chartBase().chart, type: 'column', height: 240 },
    xAxis: {
      categories: labels,
      lineColor: Field,
      tickColor: Field,
    },
    yAxis: {
      min: 0,
      max: 10,
      title: { text: undefined },
      gridLineColor: Field,
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
      },
    ],
  }

  return <HighchartsHost options={options} />
}

export function GapsHeatmapChart({
  cells,
  emptyLabel,
}: {
  cells: CoverageCellDto[] | null | undefined
  emptyLabel: string
}) {
  if (!cells?.length) return <span className="hint">{emptyLabel}</span>

  const o2Labels = [...new Set(cells.map((c) => `${c.o2Min}–${c.o2Max}`))]
  const pLabels = [...new Set(cells.map((c) => `${c.pressureMinKpa}–${c.pressureMaxKpa}`))]

  const data: [number, number, number][] = cells.map((c) => {
    const x = o2Labels.indexOf(`${c.o2Min}–${c.o2Max}`)
    const y = pLabels.indexOf(`${c.pressureMinKpa}–${c.pressureMaxKpa}`)
    return [x, y, c.coverageCount]
  })

  const options: Options = {
    ...chartBase(),
    chart: { ...chartBase().chart, type: 'heatmap', height: 260 },
    xAxis: {
      categories: o2Labels,
      title: { text: 'O₂ %' },
    },
    yAxis: {
      categories: pLabels,
      title: { text: 'kPa' },
      reversed: true,
    },
    colorAxis: {
      min: 0,
      minColor: '#FFF0E6',
      maxColor: Navy,
    },
    legend: {
      enabled: true,
      align: 'right',
      layout: 'vertical',
      verticalAlign: 'middle',
      symbolHeight: 120,
    },
    tooltip: {
      formatter() {
        const pt = this as unknown as Highcharts.Point
        const o2 = o2Labels[Number(pt.x)] ?? ''
        const p = pLabels[Number(pt.y)] ?? ''
        return `O₂ ${o2}% · P ${p} kPa<br/><b>${pt.value}</b> investigations`
      },
    },
    series: [
      {
        type: 'heatmap',
        name: 'Coverage',
        data,
        dataLabels: {
          enabled: true,
          color: '#151622',
          style: { fontSize: '10px', textOutline: 'none' },
        },
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }

  return <HighchartsHost options={options} />
}
