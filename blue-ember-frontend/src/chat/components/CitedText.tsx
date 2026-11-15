import { Fragment, type ReactNode } from 'react'
import { useT } from '@/i18n'
import { psiUrl } from '../domain/psi-url'

type Inv = { id: string; name: string; nasaPsiUrl?: string | null }

function escapeRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Texto da resposta com chips de fonte: cada menção a uma investigação (sigla ou PSI-n)
 *  ganha um chip "PSI-n ↗" para a página oficial. Sem menção, cita a 1ª do ranking no fim. */
export function CitedText({ text, invs }: { text: string; invs: Inv[] }) {
  const t = useT()
  const byKey = new Map<string, Inv>()
  for (const d of invs) {
    byKey.set(d.id.toUpperCase(), d)
    if (d.name && d.name.length >= 3) byKey.set(d.name.toUpperCase(), d)
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
  if (!keys.length) return <>{text}</>
  const rx = new RegExp(`(?<![\\w-])(${keys.join('|')})(?![\\w-])`, 'gi')
  const out: ReactNode[] = []
  const seen = new Set<string>()
  let last = 0
  for (const m of text.matchAll(rx)) {
    const d = byKey.get(m[0].toUpperCase())
    if (!d) continue
    const end = (m.index ?? 0) + m[0].length
    out.push(<Fragment key={`t${last}`}>{text.slice(last, end)}</Fragment>)
    if (!seen.has(d.id)) {
      seen.add(d.id)
      out.push(' ', chip(d, `c${end}`))
    }
    last = end
  }
  out.push(<Fragment key="tail">{text.slice(last)}</Fragment>)
  if (!seen.size && invs[0]) out.push(' ', chip(invs[0], 'first'))
  return <>{out}</>
}
