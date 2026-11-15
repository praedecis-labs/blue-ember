import { ENV, EXAMPLES, MAT } from '../data'
import { fmt } from '../engine'
import type { HistoryItem } from '../types'

type Props = {
  history: HistoryItem[]
  onNew: () => void
  onOpen: (item: HistoryItem) => void
  onExample: (text: string) => void
}

export function AnalysesHome({ history, onNew, onOpen, onExample }: Props) {
  return (
    <section id="screen-home" className="screen">
      <div className="home">
        <div className="home-head">
          <div>
            <span className="step">Início</span>
            <h1>Suas análises</h1>
            <p className="why">Retome uma conversa ou comece uma nova.</p>
          </div>
          <button type="button" onClick={onNew}>
            + Nova análise
          </button>
        </div>
        <h2>Últimas análises</h2>
        <div className="docs">
          {history.length === 0 ? (
            <p className="why">Nenhuma análise ainda.</p>
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
                    ENV[h.q.env],
                    MAT[h.q.material],
                    `${fmt(h.q.o2)}% O₂`,
                    `${fmt(h.q.psi)} psi`,
                  ].map((c) => (
                    <span key={c}>{c}</span>
                  ))}
                </div>
                <span className="top1">
                  Mais relevante: <b>{h.top}</b>
                </span>
              </button>
            ))
          )}
        </div>
        <h2>Comece por um exemplo</h2>
        <div className="chips">
          {EXAMPLES.map(([label, text]) => (
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
