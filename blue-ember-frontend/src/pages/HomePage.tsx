import { useEffect, useState } from 'react'
import { fetchHealth, type HealthStatus } from '@/services/health'
import './HomePage.css'

export function HomePage() {
  const [health, setHealth] = useState<HealthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    fetchHealth()
      .then(() => {
        if (!cancelled) setHealth('ok')
      })
      .catch(() => {
        if (!cancelled) setHealth('down')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const healthLabel =
    health === 'loading'
      ? 'Checando API…'
      : health === 'ok'
        ? 'API online'
        : 'API offline'

  return (
    <main className="home">
      <div className="home__atmosphere" aria-hidden="true" />
      <div className="home__ember" aria-hidden="true" />

      <div className="home__content">
        <p className="home__challenge">
          NASA Space Apps 2026 · Flame in Freefall
        </p>

        <h1 className="home__brand">Blue Ember</h1>

        <p className="home__tagline">
          Insights de segurança contra fogo a partir de dados de combustão em
          microgravidade.
        </p>

        <div className="home__meta">
          <span className={`home__status home__status--${health}`}>
            <span className="home__status-dot" aria-hidden="true" />
            {healthLabel}
          </span>
          <span className="home__cycle">
            material → fogo → fumaça → extinção
          </span>
        </div>
      </div>
    </main>
  )
}
