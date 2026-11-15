import {
  House,
  MessageSquarePlus,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { LOGO_SRC, PROFILES } from '../data'
import type { HistoryItem, ProfileId, ScreenId, ThemeId } from '../types'

type Props = {
  screen: ScreenId
  profile: ProfileId | null
  theme: ThemeId
  history: HistoryItem[]
  onHome: () => void
  onNew: () => void
  onProfile: () => void
  onOpenDoc: (item: HistoryItem) => void
  onToggleTheme: () => void
}

export function AppSidebar({
  screen,
  profile,
  theme,
  history,
  onHome,
  onNew,
  onProfile,
  onOpenDoc,
  onToggleTheme,
}: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={onHome}>
              <img
                src={LOGO_SRC}
                alt=""
                className="size-12 rounded-lg"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-semibold text-xl">Blue Ember</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Análises</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'home'}
                  onClick={onHome}
                  tooltip="Início"
                >
                  <House />
                  <span>Início</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'chat'}
                  onClick={onNew}
                  tooltip="Nova análise"
                >
                  <MessageSquarePlus />
                  <span>Nova análise</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'profile'}
                  onClick={onProfile}
                  tooltip="Perfil"
                >
                  <UserRound />
                  <span>Perfil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {history.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Recentes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {history.slice(0, 6).map((h) => (
                  <SidebarMenuItem key={h.id}>
                    <SidebarMenuButton
                      onClick={() => onOpenDoc(h)}
                      tooltip={h.text}
                    >
                      <span className="truncate">{h.text}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onToggleTheme} tooltip="Alternar tema">
              {theme === 'dark' ? <Sun /> : <Moon />}
              <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {profile ? (
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onProfile} tooltip="Trocar perfil">
                <UserRound />
                <span className="truncate">
                  {PROFILES[profile].name}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
