import { translatedExamples, useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/contracts'
import { environmentLabel } from '../env-defaults'
import { fmt } from '../engine'
import type { HistoryItem } from '../types'

type Props = {
  history: HistoryItem[]
  environments?: EnvironmentDto[] | null
  onNew: () => void
  onOpen: (item: HistoryItem) => void
  onExample: (text: string) => void
}

export function AnalysesHome({
  history,
  environments = null,
  onNew,
  onOpen,
  onExample,
}: Props) {
  const t = useT()
  const examples = translatedExamples(t)

  return (
    <section id="screen-home" className="screen">
      <div className="home">
        <div className="home-head">
          <div>
            <span className="step">{t('home.step')}</span>
            <h1>{t('home.title')}</h1>
            <p className="why">{t('home.why')}</p>
          </div>
          <button type="button" onClick={onNew}>
            {t('home.newAnalysis')}
          </button>
        </div>
        <h2>{t('home.latest')}</h2>
        <div className="docs">
          {history.length === 0 ? (
            <p className="why">{t('home.empty')}</p>
          ) : (
            history.map((h, i) => (
              <button
                key={`${h.when}-${i}`}
                type="button"
                className="doc"
                onClick={() => onOpen(h)}
              >
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="meta">{h.when}</span>
                  <span className={`pill ${h.level[0]}`}>{h.level[1]}</span>
                </div>
                <q>{h.text}</q>
                <div className="mini">
                  {[
                    environmentLabel(h.q.env, environments),
                    t(`material.${h.q.material}`),
                    `${fmt(h.q.o2)}% O₂`,
                    `${fmt(h.q.psi)} psi`,
                  ].map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <span className="top1">
                  {t('home.mostRelevant')} <b>{h.top}</b>
                </span>
              </button>
            ))
          )}
        </div>
        <h2>{t('home.examplesTitle')}</h2>
        <div className="chips">
          {examples.map(([label, text]) => (
            <button
              key={label}
              type="button"
              className="chip"
              onClick={() => onExample(text)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
