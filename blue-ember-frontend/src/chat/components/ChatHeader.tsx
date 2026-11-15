import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
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

  const healthVariant =
    apiHealth === 'ok' ? 'success' : apiHealth === 'down' ? 'critical' : 'secondary'

  return (
    <header className="relative z-2 flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 bg-[#1B2B85] px-3 py-2.5 text-white md:flex-nowrap md:gap-3 md:px-5 md:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <SidebarTrigger className="header-sidebar-trigger size-9 shrink-0 rounded-lg bg-white/14 text-white! shadow-none! hover:bg-white/24!" />
        <nav className="hidden min-w-0 flex-1 gap-1 md:flex">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-current={screen === 'home' ? 'page' : undefined}
            onClick={onHome}
            className={cn(
              'text-[#C9CEEA] hover:bg-white/8 hover:text-white',
              screen === 'home' && 'bg-white/16 text-white hover:bg-white/16',
            )}
          >
            {t('nav.home')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-current={screen === 'chat' ? 'page' : undefined}
            onClick={onNew}
            className={cn(
              'text-[#C9CEEA] hover:bg-white/8 hover:text-white',
              screen === 'chat' && 'bg-white/16 text-white hover:bg-white/16',
            )}
          >
            {t('nav.newAnalysis')}
          </Button>
        </nav>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
        {profile && screen !== 'profile' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onWho}
            className="max-w-[min(42vw,160px)] truncate rounded-full bg-white/14 text-white hover:bg-white/22 md:max-w-[220px]"
          >
            <span className="truncate">{profileLabel ?? profile}</span>
            <span aria-hidden>▾</span>
          </Button>
        ) : null}

        <span
          className="header-desktop-only hidden items-center gap-0.5 rounded-lg bg-white/10 p-0.5 md:inline-flex!"
          role="group"
          aria-label={t('header.toggleLang')}
        >
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={locale === 'en-US'}
            onClick={() => setLocale('en-US')}
            className={cn(
              'px-2 font-semibold tracking-wide text-[#C9CEEA] hover:text-white',
              locale === 'en-US' && 'bg-white/20 text-white',
            )}
          >
            {t('header.langEn')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-pressed={locale === 'pt-BR'}
            onClick={() => setLocale('pt-BR')}
            className={cn(
              'px-2 font-semibold tracking-wide text-[#C9CEEA] hover:text-white',
              locale === 'pt-BR' && 'bg-white/20 text-white',
            )}
          >
            {t('header.langPt')}
          </Button>
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="header-desktop-only hidden rounded-full bg-white/14 text-white hover:bg-white/24 md:inline-flex!"
          aria-label={t('nav.toggleTheme')}
          aria-pressed={theme === 'dark'}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? `☀ ${t('header.light')}` : `☾ ${t('header.dark')}`}
        </Button>

        {onExportCsv || onExportJson ? (
          <span className="inline-flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canExport}
              aria-busy={exportBusy}
              onClick={onExportCsv}
              className="rounded-full bg-white/14 px-2.5 text-xs text-white hover:bg-white/24 sm:text-[13px]"
            >
              <span className="hidden sm:inline">{t('header.exportCsv')}</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canExport}
              aria-busy={exportBusy}
              onClick={onExportJson}
              className="rounded-full bg-white/14 px-2.5 text-xs text-white hover:bg-white/24 sm:text-[13px]"
            >
              {t('header.exportJson')}
            </Button>
          </span>
        ) : null}

        <Badge
          variant={healthVariant}
          size="sm"
          className="h-auto"
          title={healthLabel}
        >
          <span className="hidden sm:inline">{healthLabel}</span>
          <span className="sm:hidden">{healthShort}</span>
        </Badge>
        <Badge
          variant="warning"
          size="sm"
          className="header-desktop-only hidden h-auto !text-[var(--ink)] md:inline-flex!"
        >
          {t('header.scoreTag')}
        </Badge>
        {environmentsError ? (
          <Badge variant="critical" size="sm" className="h-auto max-w-[min(280px,100%)] truncate" role="alert">
            {t('header.environmentsError', { error: environmentsError })}
          </Badge>
        ) : null}
      </div>
    </header>
  )
}
