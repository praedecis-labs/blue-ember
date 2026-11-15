import { House, Languages, Moon, Plus, Sun } from 'lucide-react'
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
import { LOGO_SRC } from '../domain/data'
import type { HistoryItem, ScreenId, ThemeId } from '../domain/types'

type Props = {
  screen: ScreenId
  theme: ThemeId
  history: HistoryItem[]
  onHome: () => void
  onNew: () => void
  onOpenDoc: (item: HistoryItem) => void
  onToggleTheme: () => void
}

export function AppSidebar({
  screen,
  theme,
  history,
  onHome,
  onNew,
  onOpenDoc,
  onToggleTheme,
}: Props) {
  const { locale, setLocale, t } = useI18n()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={onHome} tooltip="Blue Ember">
              <img
                src={LOGO_SRC}
                alt=""
                className="aspect-square size-8 shrink-0 rounded-lg object-contain"
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
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Ação principal no topo, como o "Novo chat" do Gemini/ChatGPT */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onNew}
                  tooltip={t('nav.newAnalysis')}
                  className="sidebar-new bg-[#E7F434] font-semibold text-[#151622] hover:bg-[#F0FA6A] hover:text-[#151622] active:bg-[#E7F434] active:text-[#151622]"
                >
                  <Plus />
                  <span>{t('nav.newAnalysis')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {history.length > 0 ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
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
              aria-label={t('header.toggleLang')}
              onClick={() =>
                setLocale(locale === 'en-US' ? 'pt-BR' : 'en-US')
              }
            >
              <Languages />
              <span>{t('nav.language')}</span>
              {/* EN | PT, com o idioma atual destacado */}
              <span className="ml-auto inline-flex gap-0.5 rounded-md bg-white/10 p-0.5 text-[11px] font-semibold tracking-wide">
                <span className={locale === 'en-US' ? 'rounded bg-white/25 px-1.5 text-white' : 'px-1.5 opacity-70'}>EN</span>
                <span className={locale === 'pt-BR' ? 'rounded bg-white/25 px-1.5 text-white' : 'px-1.5 opacity-70'}>PT</span>
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
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
