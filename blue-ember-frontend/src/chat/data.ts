import type {
  CritKey,
  EnvId,
  GasId,
  GoalId,
  Investigation,
  MaterialId,
  ProfileId,
  QueryState,
} from './types'

export const DATA: Investigation[] = [
  {
    id: 'PSI-25',
    name: 'BASS-II',
    what: 'tecido algodão-fibra de vidro e acrílico (PMMA) em fluxo baixo',
    materials: ['tecido', 'plastico'],
    o2: [15, 21],
    flow: [0, 55],
    thick: ['fina', 'grossa'],
    gases: [],
    goal: 'prevenir',
    where: 'ISS',
    doi: '10.60555/4qc4-de67',
    c: { moc: 0.6, spread: 0.5, hrr: null, tox: 0.4 },
  },
  {
    id: 'PSI-98',
    name: 'SAFFIRE-I',
    what: 'fogo em grande escala em tecido de 94 × 40 cm',
    materials: ['tecido'],
    o2: [21, 21.7],
    flow: [20, 20],
    thick: ['fina'],
    gases: [],
    goal: 'prevenir',
    where: 'Cygnus',
    doi: null,
    c: { moc: null, spread: 0.6, hrr: 0.7, tox: null },
  },
  {
    id: 'PSI-99',
    name: 'SAFFIRE-II',
    what: '9 amostras: acrílico, silicone, tecido e Nomex',
    materials: ['tecido', 'plastico'],
    o2: [22, 22.1],
    flow: [20, 25],
    thick: ['fina', 'grossa'],
    gases: [],
    goal: 'prevenir',
    where: 'Cygnus',
    doi: '10.60555/2chp-m469',
    c: { moc: 0.7, spread: 0.5, hrr: null, tox: null },
  },
  {
    id: 'PSI-100',
    name: 'SAFFIRE-III',
    what: 'fogo em grande escala com outro fluxo de ar',
    materials: ['tecido'],
    o2: [21, 21.5],
    flow: [20, 30],
    thick: ['fina'],
    gases: [],
    goal: 'prevenir',
    where: 'Cygnus',
    doi: '10.60555/040q-4h36',
    c: { moc: null, spread: 0.6, hrr: 0.7, tox: null },
  },
  {
    id: 'PSI-26',
    name: 'BASS',
    what: 'inflamabilidade de sólidos e agente inerte',
    materials: ['tecido', 'plastico'],
    o2: [15, 21],
    flow: [0, 40],
    thick: ['fina'],
    gases: ['n2'],
    goal: 'prevenir',
    where: 'ISS',
    doi: '10.60555/58h4-dy80',
    c: { moc: 0.5, spread: 0.4, hrr: null, tox: null },
  },
  {
    id: 'PSI-101',
    name: 'SAME-R',
    what: 'tamanho das partículas de fumaça para detectores',
    materials: ['tecido', 'plastico'],
    o2: [21, 21],
    flow: [5, 15],
    thick: ['fina', 'grossa'],
    gases: [],
    goal: 'detectar',
    where: 'ISS',
    doi: '10.60555/2np7-jv14',
    c: { moc: null, spread: null, hrr: null, tox: 0.8 },
  },
  {
    id: 'PSI-69',
    name: 'FLEX',
    what: 'gotas de combustível e extintores (CO₂, hélio)',
    materials: ['liquido'],
    o2: [15, 40],
    flow: [0, 5],
    thick: [],
    gases: ['co2', 'he'],
    goal: 'apagar',
    where: 'ISS',
    doi: '10.60555/mbq8-0451',
    c: { moc: 0.6, spread: null, hrr: null, tox: null },
  },
]

export const CRIT: Array<[CritKey, string]> = [
  ['prox', 'C₁ Proximidade'],
  ['moc', 'C₂ Margem MOC'],
  ['spread', 'C₃ Propagação'],
  ['hrr', 'C₄ Calor (HRR)'],
  ['tox', 'C₅ Toxicidade'],
]

export const WEIGHTS: Record<ProfileId, Record<CritKey, number>> = {
  eng: { prox: 0.15, moc: 0.25, spread: 0.25, hrr: 0.2, tox: 0.15 },
  pesq: { prox: 0.35, moc: 0.15, spread: 0.15, hrr: 0.15, tox: 0.2 },
  est: { prox: 0.2, moc: 0.2, spread: 0.2, hrr: 0.2, tox: 0.2 },
}

/** Fallback English labels; UI prefers t('profile.*') / API labels. */
export const PROFILES: Record<ProfileId, { name: string; focus: string }> = {
  eng: {
    name: 'Ship engineer',
    focus:
      'Approve or reject materials and contain damage. Weighs oxygen margin and flame spread more.',
  },
  pesq: {
    name: 'Researcher',
    focus:
      'Data rigor and gaps. Weighs how closely tests match your conditions more.',
  },
  est: {
    name: 'Student',
    focus: 'Understand fire physics in space. All criteria weighted equally.',
  },
}

export const ENV: Record<EnvId, string> = {
  lua: 'base lunar',
  marte: 'base em Marte',
  iss: 'ISS',
}

export const GRAV: Record<EnvId, [string, boolean]> = {
  lua: ['0,16 g (Lua)', true],
  marte: ['0,38 g (Marte)', true],
  iss: ['Microgravidade (~0 g)', false],
}

export const MAT: Record<MaterialId, string> = {
  tecido: 'tecido',
  plastico: 'plástico',
  liquido: 'combustível líquido',
}

export const THICK = {
  fina: 'material fino',
  grossa: 'material grosso',
} as const

export const DIR = {
  favor: 'ar a favor da chama',
  contra: 'ar contra a chama',
} as const

export const GAS: Record<Exclude<GasId, ''>, string> = {
  co2: 'CO₂',
  he: 'hélio',
  n2: 'nitrogênio',
}

export const GOAL: Record<GoalId, string> = {
  prevenir: 'prevenir',
  detectar: 'detectar',
  apagar: 'apagar',
}

export const EXAMPLES: Array<[string, string]> = [
  [
    'Tecido seguro na Lua?',
    'Acho que o tecido fino da cabine continua seguro no habitat lunar a 8,2 psi e 34% de O₂, com ventilação de 10 cm/s.',
  ],
  [
    'Acrílico em Marte',
    'Um plástico grosso tipo acrílico queima mais rápido em Marte a 10,2 psi e 26,5% de oxigênio se o ar vier a favor da chama?',
  ],
  [
    'Apagar líquido na ISS',
    'O combustível líquido apaga mais fácil com CO₂ na ISS a 21% de O₂ e ar parado.',
  ],
  [
    'Detectar fumaça',
    'Os detectores de fumaça da ISS percebem um tecido queimando com ventilação de 5 cm/s?',
  ],
]

export const DEFAULTS: QueryState = {
  env: 'lua',
  material: 'tecido',
  o2: 34,
  psi: 8.2,
  flow: 10,
  thick: '',
  dir: '',
  gas: '',
  goal: 'prevenir',
}

export const MAIN_KEYS: Array<[keyof QueryState, string]> = [
  ['env', 'ambiente'],
  ['material', 'material'],
  ['o2', 'oxigênio'],
  ['psi', 'pressão'],
  ['flow', 'fluxo de ar'],
]

export const EXTRA_KEYS = ['thick', 'dir', 'gas', 'goal'] as const

export const LOGO_SRC = '/chama-traco-unico-escuro.svg'
