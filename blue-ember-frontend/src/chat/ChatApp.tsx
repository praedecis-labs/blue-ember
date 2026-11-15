import { useEffect, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast-provider'
import { toApiCategory, toApiEnvironment, toApiProfile } from './domain/adapters'
import { AnalysesHome } from './components/AnalysesHome'
import { AppSidebar } from './components/AppSidebar'
import { ChatHeader } from './components/ChatHeader'
import { ChatScreen } from './components/ChatScreen'
import {
  ProfileScreen,
  profileDisplayName,
} from './components/ProfileScreen'
import { useI18n } from '@/i18n'
import { loadTheme, saveTheme } from './domain/storage'
import type { ThemeId } from './domain/types'
import { useApiHealth } from './use-cases/use-api-health'
import { useChatSession } from './use-cases/use-chat-session'
import { useEnvironments } from './use-cases/use-environments'
import { useExportRanking } from './use-cases/use-export-ranking'
import { useProfiles } from './use-cases/use-profiles'
import './ChatApp.css'

export function ChatApp() {
  const { t } = useI18n()
  const [theme, setTheme] = useState<ThemeId>(() =>
    typeof window !== 'undefined' ? loadTheme() : 'light',
  )
  const health = useApiHealth()
  const profilesState = useProfiles()
  const environmentsState = useEnvironments()
  const environments =
    environmentsState.status === 'ok' ? environmentsState.data : null
  const session = useChatSession({ environments })

  const exportProfile = session.profile
    ? toApiProfile(session.profile)
    : null
  const exportEnvironment = toApiEnvironment(
    session.q?.env ?? session.environment,
  )
  const exportCategory = session.q ? toApiCategory(session.q.goal) : null
  const exporter = useExportRanking({
    profile: exportProfile,
    environment: exportEnvironment,
    category: exportCategory,
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    const next: ThemeId = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveTheme(next)
  }

  const profileLabel = session.profile
    ? profileDisplayName(
        session.profile,
        profilesState,
        t(`profile.${session.profile}.name`),
      )
    : null

  if (!session.booted) return null

  if (session.screen === 'profile') {
    return (
      <ToastProvider>
        <div className="chat-app" data-theme={theme}>
          <ProfileScreen
            pending={session.pendingProfile}
            profilesState={profilesState}
            onSelect={session.setPendingProfile}
            onContinue={session.confirmProfile}
          />
        </div>
      </ToastProvider>
    )
  }

  return (
    <TooltipProvider>
      <ToastProvider>
        <SidebarProvider>
          <AppSidebar
            screen={session.screen}
            theme={theme}
            history={session.history}
            onHome={session.goHome}
            onNew={() =>
              session.profile ? session.newChat() : session.setScreen('profile')
            }
            onOpenDoc={session.openDoc}
            onToggleTheme={toggleTheme}
          />
          <SidebarInset className="min-w-0 overflow-x-clip">
            <div className="chat-app" data-theme={theme}>
              <ChatHeader
                screen={session.screen}
                profile={session.profile}
                profileLabel={profileLabel}
                theme={theme}
                apiHealth={health}
                environmentsError={
                  environmentsState.status === 'error'
                    ? environmentsState.message
                    : null
                }
                canExport={exporter.canExport}
                exportBusy={exporter.busy}
                onExportCsv={exporter.exportCsv}
                onExportJson={exporter.exportJson}
                onHome={session.goHome}
                onNew={() =>
                  session.profile
                    ? session.newChat()
                    : session.setScreen('profile')
                }
                onWho={session.goProfile}
                onToggleTheme={toggleTheme}
              />
              {session.screen === 'home' && session.profile ? (
                <AnalysesHome
                  history={session.history}
                  environments={environments}
                  onNew={session.newChat}
                  onOpen={session.openDoc}
                  onDelete={session.removeHistory}
                  onExample={session.startExample}
                />
              ) : null}
              {session.screen === 'chat' && session.profile ? (
                <ChatScreen
                  profileLabel={
                    profileLabel ?? t(`profile.${session.profile}.name`)
                  }
                  messages={session.messages}
                  draft={session.draft}
                  error={session.error}
                  environments={environments}
                  onDraftChange={(v) => {
                    session.setDraft(v)
                    if (session.error) session.setError(null)
                  }}
                  onSend={() => session.sendText(session.draft)}
                  onFollowup={(text) => session.sendText(text)}
                  onApplyConditions={session.applyConditions}
                  onExample={session.startExample}
                />
              ) : null}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
