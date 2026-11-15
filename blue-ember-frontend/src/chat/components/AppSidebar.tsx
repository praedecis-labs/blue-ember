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
import { useI18n } from '@/i18n'
import type { HistoryItem, ProfileId, ScreenId, ThemeId } from '../types'

type Props = {
  screen: ScreenId
  profile: ProfileId | null
  profileLabel: string | null
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
  profileLabel,
  theme,
  history,
  onHome,
  onNew,
  onProfile,
  onOpenDoc,
  onToggleTheme,
}: Props) {
  const { locale, setLocale, t } = useI18n()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={onHome}>
              {/* Símbolo do StellarHub (fundo transparente: serve nos temas claro e escuro) */}
              <img
                src="/stellarhub-simbolo.png"
                alt="StellarHub"
                className="size-12 object-contain"
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
          <SidebarGroupLabel>{t('nav.analyses')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'home'}
                  onClick={onHome}
                  tooltip={t('nav.home')}
                >
                  <House />
                  <span>{t('nav.home')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'chat'}
                  onClick={onNew}
                  tooltip={t('nav.newAnalysis')}
                >
                  <MessageSquarePlus />
                  <span>{t('nav.newAnalysis')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={screen === 'profile'}
                  onClick={onProfile}
                  tooltip={t('nav.profile')}
                >
                  <UserRound />
                  <span>{t('nav.profile')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {history.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>{t('nav.recent')}</SidebarGroupLabel>
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
            <SidebarMenuButton
              tooltip={t('header.toggleLang')}
              onClick={() =>
                setLocale(locale === 'en-US' ? 'pt-BR' : 'en-US')
              }
            >
              <span className="font-semibold text-xs tracking-wide">
                {locale === 'en-US' ? 'EN' : 'PT'}
              </span>
              <span>
                {locale === 'en-US' ? t('header.langEn') : t('header.langPt')}
                {' · '}
                {locale === 'en-US' ? t('header.langPt') : t('header.langEn')}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onToggleTheme}
              tooltip={t('nav.toggleTheme')}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
              <span>
                {theme === 'dark' ? t('nav.themeLight') : t('nav.themeDark')}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {profile ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onProfile}
                tooltip={t('nav.switchProfile')}
              >
                <UserRound />
                <span className="truncate">
                  {profileLabel ?? profile}
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
