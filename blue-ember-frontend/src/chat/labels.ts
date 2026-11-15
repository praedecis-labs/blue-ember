import type { TFunction } from '@/i18n'
import { fmt, kpa } from './engine'
import type { QueryState } from './types'

export function condLabel(
  k: keyof QueryState,
  v: QueryState[keyof QueryState],
  t: TFunction,
): string {
  switch (k) {
    case 'env':
      return t(`env.${v as QueryState['env']}`)
    case 'material':
      return t(`material.${v as QueryState['material']}`)
    case 'o2':
      return `${fmt(v as number)}% O₂`
    case 'psi':
      return `${fmt(v as number)} psi · ${fmt(kpa(v as number), 0)} kPa`
    case 'flow':
      return (v as number) === 0
        ? t('cond.stillAir')
        : `${fmt(v as number)} cm/s`
    case 'thick':
      return v ? t(`thick.${v as 'fina' | 'grossa'}`) : t('thick.unknown')
    case 'dir':
      return v ? t(`dir.${v as 'favor' | 'contra'}`) : t('dir.unknown')
    case 'gas':
      return v ? t(`gas.${v as 'co2' | 'he' | 'n2'}`) : t('gas.none')
    case 'goal':
      return t('goal.label', {
        goal: t(`goal.${v as QueryState['goal']}`),
      })
  }
}
