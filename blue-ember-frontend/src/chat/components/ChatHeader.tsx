import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import type { HealthStatus } from '@/services/api/health'
import type { ProfileId, ScreenId, ThemeId } from '../domain/types'

type Props = {
  screen: ScreenId
  profile: ProfileId | null
  profileLabel: string | null
  /** Tema e idioma agora ficam só na barra lateral */
  theme?: ThemeId
  apiHealth: HealthStatus
  environmentsError?: string | null
  canExport?: boolean
  exportBusy?: boolean
  onExportCsv?: () => void
  onExportJson?: () => void
  /** Mantidos por compatibilidade: Início e Nova análise agora ficam só na barra lateral */
  onHome?: () => void
  onNew?: () => void
  onWho: () => void
  onToggleTheme?: () => void
}

export function ChatHeader({
  screen,
  profile,
  profileLabel,
  apiHealth,
  environmentsError = null,
  canExport = false,
  exportBusy = false,
  onExportCsv,
  onExportJson,
  onWho,
}: Props) {
  const { t } = useI18n()
  // Menu "Exportar ▾" (CSV ou JSON), fecha ao clicar fora ou com Esc
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!exportOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExportOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [exportOpen])

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
    <header className="relative z-2 flex min-w-0 shrink-0 items-center justify-between gap-2 bg-[#1B2B85] px-3 py-2.5 text-white md:gap-3 md:px-5 md:py-3">
      {/* Esquerda: menu lateral + perfil (como o seletor de modelo do Gemini/ChatGPT).
          Início, Nova análise, idioma e tema ficam só na barra lateral. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="header-sidebar-trigger size-9 shrink-0 rounded-lg bg-white/14 text-white! shadow-none! hover:bg-white/24!" />
        {profile && screen !== 'profile' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onWho}
            title={t('header.profileHint')}
            className="min-w-0 max-w-[min(60vw,280px)] gap-1.5 rounded-full bg-white/14 text-white hover:bg-white/22"
          >
            <span className="hidden shrink-0 text-[#C9CEEA] sm:inline">{t('header.profileLabel')}</span>
            <span className="truncate font-semibold">{profileLabel ?? profile}</span>
            <span aria-hidden>▾</span>
          </Button>
        ) : null}
      </div>

      {/* Direita: exportar e status da API (a origem dos dados fica no aviso ao passar o mouse) */}
      <div className="flex shrink-0 items-center gap-1.5">
        {onExportCsv || onExportJson ? (
          <span ref={exportRef} className="relative inline-flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!canExport}
              aria-busy={exportBusy}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen((v) => !v)}
              className="rounded-full bg-white/14 px-3 text-xs text-white hover:bg-white/24 sm:text-[13px]"
            >
              {t('header.export')} <span aria-hidden>▾</span>
            </Button>
            {exportOpen ? (
              <span
                role="menu"
                className="absolute right-0 top-[calc(100%+6px)] z-50 flex min-w-44 flex-col rounded-xl border border-white/15 bg-[#0E2258] p-1 text-sm text-white shadow-lg"
              >
                {onExportCsv ? (
                  <button
                    type="button"
                    role="menuitem"
                    data-slot="button"
                    className="rounded-lg px-3 py-2 text-left hover:bg-white/12"
                    onClick={() => {
                      setExportOpen(false)
                      onExportCsv()
                    }}
                  >
                    {t('header.exportMenuCsv')}
                  </button>
                ) : null}
                {onExportJson ? (
                  <button
                    type="button"
                    role="menuitem"
                    data-slot="button"
                    className="rounded-lg px-3 py-2 text-left hover:bg-white/12"
                    onClick={() => {
                      setExportOpen(false)
                      onExportJson()
                    }}
                  >
                    {t('header.exportMenuJson')}
                  </button>
                ) : null}
              </span>
            ) : null}
          </span>
        ) : null}

        <Badge
          variant={healthVariant}
          size="sm"
          className="h-auto gap-1.5"
          title={`${healthLabel} · ${t('header.scoreTag')}`}
        >
          <span aria-hidden className="inline-block size-1.5 rounded-full bg-current" />
          <span className="hidden sm:inline">{healthLabel}</span>
          <span className="sm:hidden">{healthShort}</span>
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
