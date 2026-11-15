import { getCurrentLocale } from '@/i18n/locales'
import { CRIT, DATA, GAS, MAT, WEIGHTS } from './data'
import type {
  ClaimId,
  ComputeResult,
  CritKey,
  EvidenceLevel,
  ParseResult,
  ProfileId,
  QueryState,
  ScoredInvestigation,
} from './types'

/** Separador decimal do idioma da tela: vírgula em pt-BR, ponto em inglês. */
const dec = (text: string) =>
  getCurrentLocale() === 'pt-BR' ? text.replace('.', ',') : text

export const fmt = (n: number, d = 1) =>
  dec((Math.round(n * 10 ** d) / 10 ** d).toString())

export const f1 = (n: number) => dec(n.toFixed(1))

export const kpa = (psi: number) => psi * 6.895

export const nowLabel = (locale = 'en-US') =>
  new Date().toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const num = (s: string) => Number(s.replace(',', '.'))

const distTo = (v: number, [a, b]: [number, number]) =>
  v < a ? a - v : v > b ? v - b : 0

/**
 * Lê a pergunta em português ou inglês e extrai as condições.
 * Cada regra aceita as duas línguas; números aceitam vírgula ou ponto.
 */
export function parseHypothesis(t: string): ParseResult {
  const s = t.toLowerCase()
  const o2m = s.match(/(\d{2,3}(?:[.,]\d+)?)\s*%/)
  const psim = s.match(/(\d{1,2}(?:[.,]\d+)?)\s*psi/)
  const flm = s.match(/(\d{1,3}(?:[.,]\d+)?)\s*cm\s*\/\s*s/)

  let flow: number | null = null
  if (flm) flow = num(flm[1])
  else if (
    /ar parado|sem ventila|sem fluxo|still air|stagnant air|quiescent|no (?:air ?flow|airflow|flow|ventilation)/.test(
      s,
    )
  )
    flow = 0
  else if (
    /pouca ventila|ventila[cç][aã]o fraca|low (?:air ?flow|airflow|ventilation)|weak (?:air ?flow|airflow|ventilation)/.test(
      s,
    )
  )
    flow = 5

  // Negação de segurança primeiro ("not safe", "não é seguro", "unsafe")
  let claim: ClaimId = null
  if (
    /(?:not|isn'?t|is not|no longer) safe|unsafe|n[aã]o [eé] segur|inseguro|insegura/.test(
      s,
    )
  )
    claim = 'risky'
  else if (
    /segur|n[aã]o (pega|queima)|baixo risco|apaga mais f[aá]cil|percebe|\bsafe\b|low risk|won'?t (?:burn|ignite|catch fire)|(?:does ?n'?t|does not|do ?n'?t|do not) (?:burn|ignite|catch fire)|extinguish(?:es)? (?:more )?easily|easier to (?:extinguish|put out)|\bnotice|\bdetect(?:s)? (?:it|the)/.test(
      s,
    )
  )
    claim = 'safe'
  else if (
    /perig|risco alto|mais r[aá]pido|queima mais|pega fogo|danger|high risk|faster|burns? more|catch(?:es)? fire|more flammable/.test(
      s,
    )
  )
    claim = 'risky'

  return {
    env: /marte|\bmars\b|martian/.test(s)
      ? 'marte'
      : /\biss\b|esta[cç][aã]o espacial|space station/.test(s)
        ? 'iss'
        : /lua\b|lunar|\bmoon/.test(s)
          ? 'lua'
          : null,
    material: /l[ií]quido|combust[ií]vel|gota|liquid|\bfuel|droplet/.test(s)
      ? 'liquido'
      : /pl[aá]stico|acr[ií]lico|pmma|plastic|acrylic|plexiglas/.test(s)
        ? 'plastico'
        : /tecido|pano|roupa|nomex|algod[aã]o|cortina|fabric|cloth|textile|cotton|curtain|garment/.test(
              s,
            )
          ? 'tecido'
          : null,
    o2: o2m ? num(o2m[1]) : null,
    psi: psim ? num(psim[1]) : null,
    flow,
    thick: /\bfin[oa]s?\b|filme|\bleve\b|\bthin\b|\bfilm\b/.test(s)
      ? 'fina'
      : /gross[oa]|espess[oa]|placa|bloco|\bthick\b|\bslab|\bblock|\bplate\b/.test(
            s,
          )
        ? 'grossa'
        : null,
    dir: /a favor|mesma dire[cç][aã]o|with the flame|same direction|concurrent|flows? with/.test(
      s,
    )
      ? 'favor'
      : /contra a chama|contra o fogo|against the flame|opposed|opposing|counter-?flow/.test(
            s,
          )
        ? 'contra'
        : null,
    gas: /co2|co₂|di[oó]xido|carbon dioxide/.test(s)
      ? 'co2'
      : /h[eé]lio|helium/.test(s)
        ? 'he'
        : /nitrog/.test(s)
          ? 'n2'
          : null,
    goal: /apag|extin|suprim|suppress|put (?:it )?out/.test(s)
      ? 'apagar'
      : /detect|fuma[cç]a|sensor|alarme|smoke|alarm|notice/.test(s)
        ? 'detectar'
        : /evitar|prevenir|segur|risco|queima|prevent|avoid|\bsafe|risk|burn|ignit/.test(
              s,
            )
          ? 'prevenir'
          : null,
    claim,
  }
}

/**
 * Local maxO2/above (+ legacy gap strings for `compute` tests).
 * Chat Gaps panel uses GET /api/gaps via gapsFromApi (T4).
 */
export function localGaps(q: QueryState): {
  gaps: string[]
  maxO2: number
  above: boolean
} {
  const same = DATA.filter((d) => d.materials.includes(q.material))
  const maxO2 = same.length ? Math.max(...same.map((d) => d.o2[1])) : 0
  const maxFlow = same.length ? Math.max(...same.map((d) => d.flow[1])) : 0
  const above = same.length > 0 && q.o2 > maxO2
  const flowOut = same.length > 0 && q.flow > maxFlow
  const partialG = q.env !== 'iss'
  const lowP = q.psi < 14

  const gaps: string[] = []
  if (partialG) {
    gaps.push(
      q.env === 'lua'
        ? 'Gravidade parcial: o PSI não tem testes na gravidade da Lua (0,16 g). Estudos da NASA indicam que, perto da gravidade lunar, materiais podem queimar com menos oxigênio do que na Terra. O experimento FM2 vai medir isso na Lua.'
        : 'Gravidade parcial: o PSI não tem testes na gravidade de Marte (0,38 g). Estudos da NASA indicam que, em gravidade parcial, materiais podem queimar com menos oxigênio do que na Terra. Dados futuros (ex.: FM2) ajudarão a fechar essa lacuna.',
    )
  }
  if (above)
    gaps.push(`Nenhum teste com ${MAT[q.material]} acima de ${fmt(maxO2)}% de O₂.`)
  if (flowOut)
    gaps.push(
      `Nenhum teste com fluxo de ar acima de ${maxFlow} cm/s para ${MAT[q.material]}.`,
    )
  if (lowP)
    gaps.push(
      `Os testes do PSI foram feitos perto de 14,7 psi; nenhum a ${fmt(q.psi)} psi.`,
    )
  if (q.thick === 'grossa' && !same.some((d) => d.thick.includes('grossa')))
    gaps.push('Nenhum teste com material grosso nessas condições.')
  if (q.gas && !same.some((d) => d.gases.includes(q.gas as 'co2' | 'he' | 'n2')))
    gaps.push(`Nenhum teste apagando ${MAT[q.material]} com ${GAS[q.gas]}.`)

  return { gaps, maxO2, above }
}

/** @deprecated Local DATA ranking — kept for legacy unit tests only. Chat uses API. */
function score(
  d: (typeof DATA)[number],
  q: QueryState,
  prof: ProfileId,
): Pick<ScoredInvestigation, 'vals' | 'nota' | 'have'> {
  const mat = d.materials.includes(q.material) ? 1 : 0.35
  const goal = d.goal === q.goal ? 1 : 0.85
  const prox = Math.max(
    0,
    mat *
      goal *
      (1 -
        0.5 * Math.min(1, distTo(q.o2, d.o2) / 15) -
        0.3 * Math.min(1, distTo(q.flow, d.flow) / 30) -
        0.2 * Math.min(1, Math.abs(q.psi - 14.7) / 7)),
  )
  const vals: Record<CritKey, number | null> = {
    prox,
    moc: d.c.moc,
    spread: d.c.spread,
    hrr: d.c.hrr,
    tox: d.c.tox,
  }
  const w = WEIGHTS[prof]
  let sum = 0
  let wsum = 0
  let have = 0
  for (const [k] of CRIT) {
    if (vals[k] !== null) {
      sum += w[k] * (vals[k] as number)
      wsum += w[k]
      have++
    }
  }
  return { vals, nota: wsum ? (sum / wsum) * 10 : 0, have }
}

/** @deprecated Prefer API ranking + localGaps. Kept for legacy engine tests. */
export function compute(q: QueryState, prof: ProfileId): ComputeResult {
  const top = DATA.map((d) => ({ ...d, ...score(d, q, prof) }))
    .sort((a, b) => b.vals.prox! - a.vals.prox! || b.nota - a.nota)
    .slice(0, 3)

  const { gaps, maxO2, above } = localGaps(q)
  const missingCrit = CRIT.filter(
    ([k]) => k !== 'prox' && top.every((d) => d.vals[k] === null),
  ).map(([, l]) => l.replace(/^C\S+ /, ''))
  const gapsWithCrit = [...gaps]
  if (missingCrit.length)
    gapsWithCrit.push(
      `Nenhuma das 3 investigações mediu: ${missingCrit.join(', ')}.`,
    )

  const partialG = q.env !== 'iss'
  const same = DATA.filter((d) => d.materials.includes(q.material))
  const maxFlow = same.length ? Math.max(...same.map((d) => d.flow[1])) : 0
  const flowOut = same.length > 0 && q.flow > maxFlow
  const issues = [above, partialG, flowOut].filter(Boolean).length
  const level: [EvidenceLevel, string] =
    issues >= 2
      ? ['weak', 'Evidência fraca']
      : issues === 1
        ? ['moderate', 'Evidência moderada']
        : ['strong', 'Evidência forte']

  const near = DATA.filter(
    (d) =>
      d.materials.includes(q.material) &&
      distTo(q.o2, d.o2) <= 2 &&
      distTo(q.flow, d.flow) <= 5,
  ).length

  return {
    top,
    level,
    gaps: gapsWithCrit,
    near,
    maxO2,
    above,
    partialG,
    partialGravityWarning: partialG
      ? 'Gravidade parcial: dados locais (legado; preferir API).'
      : '',
    featuredCount: DATA.length,
  }
}

type Translate = (key: string, vars?: Record<string, string | number>) => string

const defaultT: Translate = (key) => key

export function buildVerdict(
  claim: ClaimId,
  level: EvidenceLevel,
  t: Translate = defaultT,
): [EvidenceLevel, string] {
  if (claim === 'safe')
    return level === 'strong'
      ? ['strong', t('verdict.sustained')]
      : ['weak', t('verdict.unconfirmed')]
  if (claim === 'risky')
    return level === 'strong'
      ? ['moderate', t('verdict.plausibleNear')]
      : ['moderate', t('verdict.plausibleNoDirect')]
  return ['unknown', t('verdict.noClaim')]
}

export function summaryFor(
  q: QueryState,
  r: ComputeResult,
  t: Translate = defaultT,
): string {
  const best = r.top[0]
  const source = r.maxO2Source ? ` (${r.maxO2Source})` : ''
  const o2Range =
    best?.o2[1]
      ? t('summary.o2Range', { lo: fmt(best.o2[0]), hi: fmt(best.o2[1]) })
      : ''
  const base = r.above
    ? t('summary.above', {
        maxO2: fmt(r.maxO2),
        source,
        o2: fmt(q.o2),
      })
    : best
      ? t('summary.near', { best: best.name, o2Range })
      : t('summary.searching')
  const extra =
    r.partialG && q.env !== 'iss'
      ? t('summary.partialG', {
          env: q.env === 'lua' ? t('summary.envMoon') : t('summary.envMars'),
        })
      : ''
  return base + extra
}
