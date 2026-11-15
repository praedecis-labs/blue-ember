import { useT } from '@/i18n'
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
      <h3 className="dash-widget-title">{children}</h3>
      {subtitle ? <span className="hint">{subtitle}</span> : null}
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
    <section className="dash-widget">
      <WidgetTitle>{title || t('dashboard.hazardTitle')}</WidgetTitle>
      {items.length === 0 ? (
        <span className="hint">{t('dashboard.noRanking')}</span>
      ) : (
        <ol className="dash-hazard">
          {items.map((item, i) => {
            const level =
              item.nota >= 7.5 ? 'high' : item.nota >= 5 ? 'mid' : 'low'
            return (
              <li key={item.id} data-level={level}>
                <span className="dash-hazard-rank">{i + 1}</span>
                <div>
                  <b>{item.name}</b>
                  <span className="hint">
                    {item.id} · {item.where}
                  </span>
                </div>
                <span
                  className={`pill ${level === 'high' ? 'weak' : level === 'mid' ? 'moderate' : 'strong'}`}
                >
                  {item.nota.toFixed(1)}
                </span>
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
    <section className="dash-widget">
      <WidgetTitle>{title || t('dashboard.predictabilityTitle')}</WidgetTitle>
      <div className="dash-scenarios">
        {scenarios.map((s) => {
          const pred = String(s.predictability).toLowerCase()
          const pill =
            pred === 'high' ? 'strong' : pred === 'low' ? 'weak' : 'moderate'
          const label =
            pred === 'high'
              ? t('dash.predHigh')
              : pred === 'low'
                ? t('dash.predLow')
                : t('dash.predMedium')
          return (
            <article
              key={`${s.environment}-${s.label}`}
              className="dash-scenario"
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b>{s.label}</b>
                <span className={`pill ${pill}`}>{label}</span>
              </div>
              <span className="hint">{s.environment}</span>
              {s.note ? <p className="why">{s.note}</p> : null}
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
    <section className="dash-widget insight">
      <WidgetTitle>{title || t('dashboard.insightTitle')}</WidgetTitle>
      <p className="why">{body}</p>
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
        <section className="dash-widget">
          <WidgetTitle subtitle={t('dash.rankingSubtitle')}>
            {widget.title || t('dash.rankingTitle')}
          </WidgetTitle>
          <RankingTop3Chart top={top} emptyLabel={t('dash.emptyChart')} />
        </section>
      )
    case 'criteriaBars':
      return (
        <section className="dash-widget">
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
        <section className="dash-widget">
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

export function HypothesisDashboard({ spec, top, coverageCells }: Props) {
  const t = useT()
  const widgets = spec?.widgets ?? []
  const charts = pickChartWidgets(widgets)
  const interpretive = widgets.filter((w) => INTERPRETIVE.has(w.type))

  const title = spec?.title || t('dashboard.label')
  const subtitle = spec?.subtitle
  const intent = String(spec?.intent ?? 'ranking')

  return (
    <div className="hypothesis-dashboard" data-intent={intent}>
      <div className="dash-head">
        <div>
          <span className="step">
            {t('dashboard.label')}
            {spec ? (
              <span className="dash-ai-badge">{t('dashboard.aiBadge')}</span>
            ) : null}
          </span>
          <h2>{title}</h2>
          {subtitle ? <p className="why">{subtitle}</p> : null}
        </div>
      </div>

      <div className="dash-grid charts">
        {charts.map((w, i) => (
          <div key={`chart-${w.type}-${i}`} className="dash-cell">
            {renderChartWidget(w, top, coverageCells, t)}
          </div>
        ))}
      </div>

      {interpretive.length > 0 ? (
        <div className="dash-grid interpretive">
          {interpretive.map((w, i) => (
            <div key={`interp-${w.type}-${i}`} className="dash-cell">
              {renderInterpretive(w, top, t)}
            </div>
          ))}
        </div>
      ) : null}

      {interpretive.some((w) => w.type === 'insight') ? null : (
        <p className="dash-legend hint">{legendForIntent(intent, t)}</p>
      )}
    </div>
  )
}
