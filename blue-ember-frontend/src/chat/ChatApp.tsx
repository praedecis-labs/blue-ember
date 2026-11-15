import { useEffect, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast-provider'
import { AnalysesHome } from './components/AnalysesHome'
import { AppSidebar } from './components/AppSidebar'
import { ChatHeader } from './components/ChatHeader'
import { ChatScreen } from './components/ChatScreen'
import {
  ProfileScreen,
  profileDisplayName,
} from './components/ProfileScreen'
import { PROFILES } from './data'
import { loadTheme, saveTheme } from './storage'
import type { ThemeId } from './types'
import { useApiHealth } from './use-api-health'
import { useChatSession } from './use-chat-session'
import { useEnvironments } from './use-environments'
import { useProfiles } from './use-profiles'
import './ChatApp.css'

export function ChatApp() {
  const [theme, setTheme] = useState<ThemeId>(() =>
    typeof window !== 'undefined' ? loadTheme() : 'light',
  )
  const health = useApiHealth()
  const profilesState = useProfiles()
  const environmentsState = useEnvironments()
  const environments =
    environmentsState.status === 'ok' ? environmentsState.data : null
  const session = useChatSession({ environments })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    const next: ThemeId = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveTheme(next)
  }

  const profileLabel = session.profile
    ? profileDisplayName(session.profile, profilesState)
    : null

  if (!session.booted) return null

  return (
    <TooltipProvider>
      <ToastProvider>
        <SidebarProvider>
          <AppSidebar
            screen={session.screen}
            profile={session.profile}
            profileLabel={profileLabel}
            theme={theme}
            history={session.history}
            onHome={session.goHome}
            onNew={() =>
              session.profile ? session.newChat() : session.setScreen('profile')
            }
            onProfile={session.goProfile}
            onOpenDoc={session.openDoc}
            onToggleTheme={toggleTheme}
          />
          <SidebarInset>
            <div className="chat-app" data-theme={theme}>
              <ChatHeader
                screen={session.screen}
                profile={session.profile}
                profileLabel={profileLabel}
                theme={theme}
                apiHealth={health}
                onHome={session.goHome}
                onNew={() =>
                  session.profile
                    ? session.newChat()
                    : session.setScreen('profile')
                }
                onWho={session.goProfile}
                onToggleTheme={toggleTheme}
              />
              {session.screen === 'profile' ? (
                <ProfileScreen
                  pending={session.pendingProfile}
                  profilesState={profilesState}
                  onSelect={session.setPendingProfile}
                  onContinue={session.confirmProfile}
                />
              ) : null}
              {session.screen === 'home' && session.profile ? (
                <AnalysesHome
                  history={session.history}
                  environments={environments}
                  onNew={session.newChat}
                  onOpen={session.openDoc}
                  onExample={session.startExample}
                />
              ) : null}
              {session.screen === 'chat' && session.profile ? (
                <ChatScreen
                  profileLabel={
                    profileLabel ?? PROFILES[session.profile].name
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
