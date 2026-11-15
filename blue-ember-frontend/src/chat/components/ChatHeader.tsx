import { SidebarTrigger } from '@/components/ui/sidebar'
import { useI18n } from '@/i18n'
import type { HealthStatus } from '@/services/api/health'
import type { ProfileId, ScreenId, ThemeId } from '../domain/types'

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

  const healthShort =
    apiHealth === 'loading' ? '…' : apiHealth === 'ok' ? 'API' : 'API!'

  return (
    <header>
      <div className="header-leading">
        <SidebarTrigger className="header-sidebar-trigger" />
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
      </div>

      <div className="header-tools">
        {profile && screen !== 'profile' ? (
          <button type="button" className="who" onClick={onWho}>
            <span className="who-label">{profileLabel ?? profile}</span>
            <span aria-hidden> ▾</span>
          </button>
        ) : null}

        <span
          className="lang-toggle header-desktop-only"
          role="group"
          aria-label={t('header.toggleLang')}
        >
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
          className="theme-btn header-desktop-only"
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
              <span className="export-label-full">{t('header.exportCsv')}</span>
              <span className="export-label-short">CSV</span>
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

        <span
          className={`tag tag-health tag-health--${apiHealth}`}
          title={healthLabel}
        >
          <span className="health-label-full">{healthLabel}</span>
          <span className="health-label-short">{healthShort}</span>
        </span>
        <span className="tag tag-score header-desktop-only">
          {t('header.scoreTag')}
        </span>
        {environmentsError ? (
          <span className="tag tag-warn" role="alert">
            {t('header.environmentsError', { error: environmentsError })}
          </span>
        ) : null}
      </div>
    </header>
  )
}
