import { DIR, ENV, GAS, GOAL, MAT, THICK } from './data'
import { fmt, kpa } from './engine'
import type { QueryState } from './types'

export function condLabel(k: keyof QueryState, v: QueryState[keyof QueryState]): string {
  switch (k) {
    case 'env':
      return ENV[v as QueryState['env']]
    case 'material':
      return MAT[v as QueryState['material']]
    case 'o2':
      return `${fmt(v as number)}% O₂`
    case 'psi':
      return `${fmt(v as number)} psi · ${fmt(kpa(v as number), 0)} kPa`
    case 'flow':
      return (v as number) === 0 ? 'ar parado' : `${fmt(v as number)} cm/s`
    case 'thick':
      return v ? THICK[v as 'fina' | 'grossa'] : 'espessura: não sei'
    case 'dir':
      return v ? DIR[v as 'favor' | 'contra'] : 'direção do ar: não sei'
    case 'gas':
      return v ? GAS[v as 'co2' | 'he' | 'n2'] : 'sem gás extintor'
    case 'goal':
      return `objetivo: ${GOAL[v as QueryState['goal']]}`
  }
}
