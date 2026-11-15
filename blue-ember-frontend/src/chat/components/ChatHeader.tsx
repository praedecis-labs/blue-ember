import type { HealthStatus } from '@/services/health'
import type { ProfileId, ScreenId, ThemeId } from '../types'

type Props = {
  screen: ScreenId
  profile: ProfileId | null
  profileLabel: string | null
  theme: ThemeId
  apiHealth: HealthStatus
  environmentsError?: string | null
  canExport?: boolean
  exportBusy?: boolean
  onExportCsv?: () => void
  onExportJson?: () => void
  onHome: () => void
  onNew: () => void
  onWho: () => void
  onToggleTheme: () => void
}

export function ChatHeader({
  screen,
  profile,
  profileLabel,
  theme,
  apiHealth,
  environmentsError = null,
  canExport = false,
  exportBusy = false,
  onExportCsv,
  onExportJson,
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
          {profileLabel ?? profile} ▾
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
      {onExportCsv || onExportJson ? (
        <span className="export-actions">
          <button
            type="button"
            className="export-btn"
            disabled={!canExport}
            aria-busy={exportBusy}
            onClick={onExportCsv}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="export-btn"
            disabled={!canExport}
            aria-busy={exportBusy}
            onClick={onExportJson}
          >
            JSON
          </button>
        </span>
      ) : null}
      <span className={`tag tag-health tag-health--${apiHealth}`}>
        {healthLabel}
      </span>
      <span className="tag">Score via API · síntese local</span>
      {environmentsError ? (
        <span className="tag tag-warn" role="alert">
          Ambientes: {environmentsError}
        </span>
      ) : null}
    </header>
  )
}
