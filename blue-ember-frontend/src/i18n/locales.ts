export type AppLocale = 'en-US' | 'pt-BR'

export const LOCALES: AppLocale[] = ['en-US', 'pt-BR']

export const DEFAULT_LOCALE: AppLocale = 'en-US'

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en-US' || value === 'pt-BR'
}
