import { Fragment, type ReactNode } from 'react'
import { useT } from '@/i18n'
import { psiUrl } from '../domain/psi-url'

type Inv = { id: string; name: string; nasaPsiUrl?: string | null }

// A IA às vezes usa hífens tipográficos ("PSI‑99" com U+2011); tratamos todos como "-"
const DASHES = /[\u2010-\u2015\u2212]/g
const norm = (s: string) => s.replace(DASHES, '-').toUpperCase()

function escapeRx(s: string) {
  return s
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/-/g, '[-\u2010-\u2015\u2212]')
}

// Mensagens de recurso do backend (a IA não fechou o texto): não recebem chip de fonte
export const FALLBACK = /did not finish the prose|could not finish a prose|não fechou a prosa|não consegui fechar uma resposta/i

/** Texto da resposta com chips de fonte: cada menção a uma investigação (sigla ou PSI-n)
 *  ganha um chip "PSI-n ↗" para a página oficial. Sem menção, cita a 1ª do ranking no fim. */
export function CitedText({ text, invs }: { text: string; invs: Inv[] }) {
  const t = useT()
  const byKey = new Map<string, Inv>()
  for (const d of invs) {
    byKey.set(norm(d.id), d)
    if (d.name && d.name.length >= 3) byKey.set(norm(d.name), d)
  }
  const keys = [...byKey.keys()].sort((a, b) => b.length - a.length).map(escapeRx)
  const chip = (d: Inv, k: string) => (
    <a
      key={k}
      className="cite-chip"
      href={psiUrl(d)}
      target="_blank"
      rel="noopener noreferrer"
      title={t('panels.onPsi', { id: d.id })}
    >
      {d.id} ↗
    </a>
  )
  if (!keys.length || FALLBACK.test(text)) return <>{text}</>
  const rx = new RegExp(`(?<![\\w\\u2010-\\u2015-])(${keys.join('|')})(?![\\w\\u2010-\\u2015-])`, 'gi')
  const out: ReactNode[] = []
  const seen = new Set<string>()
  let last = 0
  for (const m of text.matchAll(rx)) {
    const d = byKey.get(norm(m[0]))
    if (!d) continue
    const start = m.index ?? 0
    const end = start + m[0].length
    const isId = norm(m[0]) === norm(d.id)
    if (isId && !seen.has(d.id)) {
      // A IA escreveu o próprio ID: ele vira o chip (sem repetir "PSI-99 PSI-99 ↗")
      out.push(<Fragment key={`t${last}`}>{text.slice(last, start)}</Fragment>)
      seen.add(d.id)
      out.push(chip(d, `c${end}`))
    } else {
      out.push(<Fragment key={`t${last}`}>{text.slice(last, end)}</Fragment>)
      if (!seen.has(d.id)) {
        seen.add(d.id)
        out.push(' ', chip(d, `c${end}`))
      }
    }
    last = end
  }
  out.push(<Fragment key="tail">{text.slice(last)}</Fragment>)
  if (!seen.size && invs[0]) out.push(' ', chip(invs[0], 'first'))
  return <>{out}</>
}
