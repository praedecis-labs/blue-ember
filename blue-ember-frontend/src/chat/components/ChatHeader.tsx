import { useI18n } from '@/i18n'
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
  const { locale, setLocale, t } = useI18n()

  const healthLabel =
    apiHealth === 'loading'
      ? t('header.apiLoading')
      : apiHealth === 'ok'
        ? t('header.apiOnline')
        : t('header.apiOffline')

  return (
    <header>
      <nav>
        <button
          type="button"
          aria-current={screen === 'home' ? 'page' : undefined}
          onClick={onHome}
        >
          {t('nav.home')}
        </button>
        <button
          type="button"
          aria-current={screen === 'chat' ? 'page' : undefined}
          onClick={onNew}
        >
          {t('nav.newAnalysis')}
        </button>
      </nav>
      {profile && screen !== 'profile' ? (
        <button type="button" className="who" onClick={onWho}>
          {profileLabel ?? profile} ▾
        </button>
      ) : null}
      <span className="lang-toggle" role="group" aria-label={t('header.toggleLang')}>
        <button
          type="button"
          className="lang-btn"
          aria-pressed={locale === 'en-US'}
          onClick={() => setLocale('en-US')}
        >
          {t('header.langEn')}
        </button>
        <button
          type="button"
          className="lang-btn"
          aria-pressed={locale === 'pt-BR'}
          onClick={() => setLocale('pt-BR')}
        >
          {t('header.langPt')}
        </button>
      </span>
      <button
        type="button"
        className="theme-btn"
        aria-label={t('nav.toggleTheme')}
        aria-pressed={theme === 'dark'}
        onClick={onToggleTheme}
      >
        {theme === 'dark' ? `☀ ${t('header.light')}` : `☾ ${t('header.dark')}`}
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
            {t('header.exportCsv')}
          </button>
          <button
            type="button"
            className="export-btn"
            disabled={!canExport}
            aria-busy={exportBusy}
            onClick={onExportJson}
          >
            {t('header.exportJson')}
          </button>
        </span>
      ) : null}
      <span className={`tag tag-health tag-health--${apiHealth}`}>
        {healthLabel}
      </span>
      <span className="tag">{t('header.scoreTag')}</span>
      {environmentsError ? (
        <span className="tag tag-warn" role="alert">
          {t('header.environmentsError', { error: environmentsError })}
        </span>
      ) : null}
    </header>
  )
}
