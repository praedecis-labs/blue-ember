import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type {
  CoverageCellDto,
  DashboardSpec,
  DashboardWidget,
} from '@/services/shared/contracts'
import type { ScoredInvestigation } from '../domain/types'
import {
  CriteriaBarsChart,
  GapsHeatmapChart,
  RankingTop3Chart,
} from './charts/dashboard-charts'

type Props = {
  spec?: DashboardSpec | null
  top: ScoredInvestigation[]
  coverageCells?: CoverageCellDto[] | null
}

const CHART_TYPES = new Set(['rankingTop3', 'criteriaBars', 'gapsHeatmap'])
const INTERPRETIVE = new Set([
  'materialHazard',
  'scenarioPredictability',
  'insight',
])

const DEFAULT_CHARTS: DashboardWidget[] = [
  { type: 'rankingTop3' },
  { type: 'criteriaBars' },
  { type: 'gapsHeatmap' },
]

function WidgetTitle({
  children,
  subtitle,
}: {
  children: string
  subtitle?: string
}) {
  return (
    <div>
      <h3 className="m-0 text-[13px] font-semibold text-[var(--navy)]">
        {children}
      </h3>
      {subtitle ? (
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      ) : null}
    </div>
  )
}

function MaterialHazard({
  title,
  top,
  limit,
  t,
}: {
  title?: string | null
  top: ScoredInvestigation[]
  limit?: number | null
  t: (key: string) => string
}) {
  const n = Math.min(Math.max(limit ?? 5, 1), 8)
  const items = top.slice(0, n)
  return (
    <section className="flex flex-col gap-2">
      <WidgetTitle>{title || t('dashboard.hazardTitle')}</WidgetTitle>
      {items.length === 0 ? (
        <span className="text-xs text-muted-foreground">
          {t('dashboard.noRanking')}
        </span>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, i) => {
            const level =
              item.nota >= 7.5 ? 'high' : item.nota >= 5 ? 'mid' : 'low'
            return (
              <li
                key={item.id}
                className="flex items-center gap-2.5 rounded-[10px] bg-[var(--field)] px-2.5 py-2"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[#1B2B85] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{item.name}</b>
                  <span className="text-xs text-muted-foreground">
                    {item.id} · {item.where}
                  </span>
                </div>
                <Badge
                  variant={
                    level === 'high'
                      ? 'critical'
                      : level === 'mid'
                        ? 'warning'
                        : 'success'
                  }
                  size="sm"
                  className="h-auto"
                >
                  {item.nota.toFixed(1)}
                </Badge>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function ScenarioPredictability({
  title,
  widget,
  t,
}: {
  title?: string | null
  widget: Extract<DashboardWidget, { type: 'scenarioPredictability' }>
  t: (key: string) => string
}) {
  const scenarios = widget.scenarios ?? []
  return (
    <section className="flex flex-col gap-2">
      <WidgetTitle>{title || t('dashboard.predictabilityTitle')}</WidgetTitle>
      <div className="grid gap-2 md:grid-cols-3">
        {scenarios.map((s) => {
          const pred = String(s.predictability).toLowerCase()
          const variant =
            pred === 'high' ? 'success' : pred === 'low' ? 'critical' : 'warning'
          const label =
            pred === 'high'
              ? t('dash.predHigh')
              : pred === 'low'
                ? t('dash.predLow')
                : t('dash.predMedium')
          return (
            <article
              key={`${s.environment}-${s.label}`}
              className="flex flex-col gap-1 rounded-[10px] bg-[var(--field)] p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <b className="text-sm">{s.label}</b>
                <Badge variant={variant} size="sm" className="h-auto">
                  {label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {s.environment}
              </span>
              {s.note ? (
                <p className="m-0 text-sm text-[var(--sub)]">{s.note}</p>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Insight({
  title,
  body,
  t,
}: {
  title?: string | null
  body: string
  t: (key: string) => string
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[10px] bg-[var(--info)] p-3">
      <WidgetTitle>{title || t('dashboard.insightTitle')}</WidgetTitle>
      <p className="m-0 text-sm text-[var(--sub)]">{body}</p>
    </section>
  )
}

function legendForIntent(intent: string, t: (key: string) => string): string {
  const i = intent.toLowerCase()
  if (i === 'prediction') return t('dashboard.legendPrediction')
  if (i === 'hazard') return t('dashboard.legendHazard')
  return t('dashboard.legendDefault')
}

function pickChartWidgets(specWidgets: DashboardWidget[]): DashboardWidget[] {
  const fromSpec = specWidgets.filter((w) => CHART_TYPES.has(w.type)).slice(0, 3)
  return fromSpec.length > 0 ? fromSpec : DEFAULT_CHARTS
}

function renderChartWidget(
  widget: DashboardWidget,
  top: ScoredInvestigation[],
  coverageCells: CoverageCellDto[] | null | undefined,
  t: (key: string) => string,
) {
  switch (widget.type) {
    case 'rankingTop3':
      return (
        <section className="flex flex-col gap-2">
          <WidgetTitle subtitle={t('dash.rankingSubtitle')}>
            {widget.title || t('dash.rankingTitle')}
          </WidgetTitle>
          <RankingTop3Chart top={top} emptyLabel={t('dash.emptyChart')} />
        </section>
      )
    case 'criteriaBars':
      return (
        <section className="flex flex-col gap-2">
          <WidgetTitle subtitle={t('dash.criteriaSubtitle')}>
            {widget.title || t('dash.criteriaTitle')}
          </WidgetTitle>
          <CriteriaBarsChart
            top={top}
            labels={[
              t('crit.prox'),
              t('crit.moc'),
              t('crit.spread'),
              t('crit.hrr'),
              t('crit.tox'),
            ]}
            emptyLabel={t('dash.emptyChart')}
            noMeasurement={t('dash.noMeasurement')}
          />
        </section>
      )
    case 'gapsHeatmap':
      return (
        <section className="flex flex-col gap-2">
          <WidgetTitle subtitle={t('dash.gapsSubtitle')}>
            {widget.title || t('dash.gapsTitle')}
          </WidgetTitle>
          <GapsHeatmapChart
            cells={coverageCells}
            emptyLabel={t('dash.emptyChart')}
          />
        </section>
      )
    default:
      return null
  }
}

function renderInterpretive(
  widget: DashboardWidget,
  top: ScoredInvestigation[],
  t: (key: string) => string,
) {
  switch (widget.type) {
    case 'materialHazard':
      return (
        <MaterialHazard
          title={widget.title}
          top={top}
          limit={widget.limit}
          t={t}
        />
      )
    case 'scenarioPredictability':
      return (
        <ScenarioPredictability title={widget.title} widget={widget} t={t} />
      )
    case 'insight':
      return <Insight title={widget.title} body={widget.body} t={t} />
    default:
      return null
  }
}

export const HypothesisDashboard = memo(function HypothesisDashboard({
  spec,
  top,
  coverageCells,
}: Props) {
  const t = useT()
  const widgets = spec?.widgets ?? []
  const charts = pickChartWidgets(widgets)
  const interpretive = widgets.filter((w) => INTERPRETIVE.has(w.type))

  const title = spec?.title || t('dashboard.label')
  const subtitle = spec?.subtitle
  const intent = String(spec?.intent ?? 'ranking')

  return (
    <div
      className="mt-2.5 flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--navy)_12%,transparent)] bg-[var(--bg)] p-3.5"
      data-intent={intent}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t('dashboard.label')}
            {spec ? (
              <Badge
                variant="info"
                size="sm"
                className="h-auto normal-case tracking-normal"
              >
                {t('dashboard.aiBadge')}
              </Badge>
            ) : null}
          </span>
          <h2 className="mt-0.5 text-[17px] font-semibold text-[var(--navy)]">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 text-sm text-[var(--sub)]">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-3',
          charts.length > 1 && 'md:grid-cols-2',
        )}
      >
        {charts.map((w, i) => (
          <div
            key={`chart-${w.type}-${i}`}
            className={cn(
              'min-w-0',
              charts.length > 1 &&
                i === charts.length - 1 &&
                charts.length % 2 === 1 &&
                'md:col-span-2',
            )}
          >
            {renderChartWidget(w, top, coverageCells, t)}
          </div>
        ))}
      </div>

      {interpretive.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {interpretive.map((w, i) => (
            <div
              key={`interp-${w.type}-${i}`}
              className={cn(
                'min-w-0',
                w.type === 'insight' && 'md:col-span-2',
              )}
            >
              {renderInterpretive(w, top, t)}
            </div>
          ))}
        </div>
      ) : null}

      {interpretive.some((w) => w.type === 'insight') ? null : (
        <p className="m-0 border-t border-[color-mix(in_srgb,var(--navy)_10%,transparent)] pt-1 text-xs text-muted-foreground">
          {legendForIntent(intent, t)}
        </p>
      )}
    </div>
  )
})
