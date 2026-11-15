import type { HealthStatus } from '@/services/health'
import { PROFILES } from '../data'
import type { ProfileId, ScreenId, ThemeId } from '../types'

type Props = {
  screen: ScreenId
  profile: ProfileId | null
  theme: ThemeId
  apiHealth: HealthStatus
  onHome: () => void
  onNew: () => void
  onWho: () => void
  onToggleTheme: () => void
}

export function ChatHeader({
  screen,
  profile,
  theme,
  apiHealth,
  onHome,
  onNew,
  onWho,
  onToggleTheme,
}: Props) {
  const healthLabel =
    apiHealth === 'loading'
      ? 'API…'
      : apiHealth === 'ok'
        ? 'API online'
        : 'API offline'

  return (
    <header>
      <nav>
        <button
          type="button"
          aria-current={screen === 'home' ? 'page' : undefined}
          onClick={onHome}
        >
          Início
        </button>
        <button
          type="button"
          aria-current={screen === 'chat' ? 'page' : undefined}
          onClick={onNew}
        >
          Nova análise
        </button>
      </nav>
      {profile && screen !== 'profile' ? (
        <button type="button" className="who" onClick={onWho}>
          {PROFILES[profile].name} ▾
        </button>
      ) : null}
      <button
        type="button"
        className="theme-btn"
        aria-label="Alternar tema claro e escuro"
        aria-pressed={theme === 'dark'}
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? '☀ Claro' : '☾ Escuro'}
      </button>
      <span className={`tag tag-health tag-health--${apiHealth}`}>
        {healthLabel}
      </span>
      <span className="tag">Score local · síntese protótipo</span>
    </header>
  )
}
