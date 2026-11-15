import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_LOCALE,
  isAppLocale,
  setCurrentLocale,
  type AppLocale,
} from './locales'
import { loadLocale, saveLocale } from '@/chat/storage'
import { enUS, type MessageTree } from './messages/en-US'
import { ptBR } from './messages/pt-BR'

type Dict = Record<string, unknown>

function getByPath(obj: Dict, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Dict)) {
      return (acc as Dict)[key]
    }
    return undefined
  }, obj)
}

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`,
  )
}

export type TFunction = (
  key: string,
  vars?: Record<string, string | number>,
) => string

type I18nContextValue = {
  locale: AppLocale
  setLocale: (locale: AppLocale) => void
  t: TFunction
  messages: MessageTree
}

const catalogs: Record<AppLocale, MessageTree> = {
  'en-US': enUS,
  'pt-BR': ptBR,
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE
    return loadLocale()
  })

  const setLocale = useCallback((next: AppLocale) => {
    if (!isAppLocale(next)) return
    setLocaleState(next)
    saveLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'pt-BR' ? 'pt-BR' : 'en'
  }, [locale])

  // Mantém números e mensagens fora do React no mesmo idioma da tela
  setCurrentLocale(locale)

  const messages = catalogs[locale]

  const t = useCallback<TFunction>(
    (key, vars) => {
      const raw = getByPath(messages as unknown as Dict, key)
      if (typeof raw === 'string') return interpolate(raw, vars)
      const fallback = getByPath(enUS as unknown as Dict, key)
      if (typeof fallback === 'string') return interpolate(fallback, vars)
      return key
    },
    [messages],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, messages }),
    [locale, setLocale, t, messages],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function useT(): TFunction {
  return useI18n().t
}

export { translatedExamples } from './examples'
export { DEFAULT_LOCALE, type AppLocale, isAppLocale }
export type { MessageTree }
