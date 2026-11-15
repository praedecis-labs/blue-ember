import { useEffect, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToastProvider } from '@/components/ui/toast-provider'
import { AnalysesHome } from './components/AnalysesHome'
import { AppSidebar } from './components/AppSidebar'
import { ChatHeader } from './components/ChatHeader'
import { ChatScreen } from './components/ChatScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { loadTheme, saveTheme } from './storage'
import type { ThemeId } from './types'
import { useChatSession } from './use-chat-session'
import { useApiHealth } from './use-api-health'
import './ChatApp.css'

export function ChatApp() {
  const [theme, setTheme] = useState<ThemeId>(() =>
    typeof window !== 'undefined' ? loadTheme() : 'light',
  )
  const health = useApiHealth()
  const session = useChatSession()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    const next: ThemeId = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveTheme(next)
  }

  if (!session.booted) return null

  return (
    <TooltipProvider>
      <ToastProvider>
        <SidebarProvider>
          <AppSidebar
          screen={session.screen}
          profile={session.profile}
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
                onSelect={session.setPendingProfile}
                onContinue={session.confirmProfile}
              />
            ) : null}
            {session.screen === 'home' && session.profile ? (
              <AnalysesHome
                history={session.history}
                onNew={session.newChat}
                onOpen={session.openDoc}
                onExample={session.startExample}
              />
            ) : null}
            {session.screen === 'chat' && session.profile ? (
              <ChatScreen
                profile={session.profile}
                messages={session.messages}
                draft={session.draft}
                error={session.error}
                onDraftChange={(v) => {
                  session.setDraft(v)
                  if (session.error) session.setError(null)
                }}
                onSend={() => session.sendText(session.draft)}
                onFollowup={(text) => session.sendText(text)}
                onApplyConditions={session.applyConditions}
                onExampleFill={session.setDraft}
              />
            ) : null}
          </div>
        </SidebarInset>
      </SidebarProvider>
      </ToastProvider>
    </TooltipProvider>
  )
}
