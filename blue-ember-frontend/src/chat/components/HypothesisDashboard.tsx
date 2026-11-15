import { useT } from '@/i18n'
import type { DashboardSpec, DashboardWidget } from '@/services/contracts'
import { f1 } from '../engine'
import type { ScoredInvestigation } from '../types'

type Props = {
  spec: DashboardSpec
  top: ScoredInvestigation[]
}

const INTERPRETIVE = new Set([
  'materialHazard',
  'scenarioPredictability',
  'insight',
])

function WidgetTitle({ children }: { children: string }) {
  return <h3 className="dash-widget-title">{children}</h3>
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
                  {f1(item.nota)}
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

function renderWidget(
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

export function HypothesisDashboard({ spec, top }: Props) {
  const t = useT()
  const widgets = (spec.widgets ?? []).filter((w) => INTERPRETIVE.has(w.type))
  if (!widgets.length) return null

  return (
    <div className="hypothesis-dashboard" data-intent={spec.intent}>
      {/* div, não <header>: o estilo global de header pinta o fundo de azul */}
      <div className="dash-head">
        <div>
          <span className="step">
            {t('dashboard.label')}
            <span className="dash-ai-badge">{t('dashboard.aiBadge')}</span>
          </span>
          <h2>{spec.title}</h2>
          {spec.subtitle ? <p className="why">{spec.subtitle}</p> : null}
        </div>
      </div>
      <div className="dash-grid interpretive">
        {widgets.map((w, i) => (
          <div key={`${w.type}-${i}`} className="dash-cell">
            {renderWidget(w, top, t)}
          </div>
        ))}
      </div>
      {/* Se a IA já trouxe "leitura e legendas", não repete a legenda fixa */}
      {widgets.some((w) => w.type === 'insight') ? null : (
        <p className="dash-legend hint">
          {legendForIntent(String(spec.intent), t)}
        </p>
      )}
    </div>
  )
}
