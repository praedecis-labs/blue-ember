export type AppLocale = 'en-US' | 'pt-BR'

export const LOCALES: AppLocale[] = ['en-US', 'pt-BR']

export const DEFAULT_LOCALE: AppLocale = 'en-US'

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en-US' || value === 'pt-BR'
}

/**
 * Idioma atual para código fora do React (formatação de números, mensagens de erro).
 * O I18nProvider mantém este valor em sincronia com o idioma escolhido.
 */
let currentLocale: AppLocale = DEFAULT_LOCALE

export function setCurrentLocale(locale: AppLocale): void {
  currentLocale = locale
}

export function getCurrentLocale(): AppLocale {
  return currentLocale
}
