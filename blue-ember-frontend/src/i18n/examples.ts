import type { TFunction } from './index'

export function translatedExamples(
  t: TFunction,
): Array<[string, string]> {
  return [
    [t('examples.e1Label'), t('examples.e1Text')],
    [t('examples.e2Label'), t('examples.e2Text')],
    [t('examples.e3Label'), t('examples.e3Text')],
    [t('examples.e4Label'), t('examples.e4Text')],
  ]
}

export { translatedExamples as default }
