import { XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { translatedExamples, useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { environmentLabel } from '../domain/env-defaults'
import { fmt } from '../domain/engine'
import type { EvidenceLevel, HistoryItem } from '../domain/types'

type Props = {
  history: HistoryItem[]
  environments?: EnvironmentDto[] | null
  onNew: () => void
  onOpen: (item: HistoryItem) => void
  onDelete: (id: string) => void
  onExample: (text: string) => void
}

function evidenceBadgeVariant(
  level: EvidenceLevel,
): 'success' | 'warning' | 'critical' | 'secondary' {
  if (level === 'strong') return 'success'
  if (level === 'moderate') return 'warning'
  if (level === 'weak') return 'critical'
  return 'secondary'
}

export function AnalysesHome({
  history,
  environments = null,
  onNew,
  onOpen,
  onDelete,
  onExample,
}: Props) {
  const t = useT()
  const examples = translatedExamples(t)

  return (
    <section id="screen-home" className="screen min-w-0 overflow-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4.5 px-4 py-5 md:gap-6 md:px-6 md:py-9">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" size="sm" className="w-fit uppercase tracking-wide">
              {t('home.step')}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-[26px]">
              {t('home.title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('home.why')}</p>
          </div>
          <Button
            type="button"
            size="lg"
            onClick={onNew}
            className="w-full !bg-[var(--yellow)] !text-[var(--ink)] hover:!bg-[var(--yellow)]/90 md:w-auto"
          >
            {t('home.newAnalysis')}
          </Button>
        </div>

        <h2 className="text-lg font-semibold">{t('home.latest')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] md:gap-3.5">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('home.empty')}</p>
          ) : (
            history.map((h) => (
              <Card
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(h)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen(h)
                  }
                }}
                className="relative cursor-pointer text-left shadow-none hover:shadow-none"
              >
                <CardHeader className="gap-3 space-y-0 p-4 pr-11">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{h.when}</span>
                    <Badge
                      variant={evidenceBadgeVariant(h.level[0])}
                      size="sm"
                      className="h-auto"
                    >
                      {h.level[1]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-normal italic leading-snug">
                    {h.text}
                  </CardTitle>
                </CardHeader>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground"
                  aria-label={t('home.deleteAnalysis')}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(h.id)
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <XIcon className="size-4" />
                </Button>
                <CardContent className="flex flex-col gap-2.5 px-4 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      environmentLabel(h.q.env, environments),
                      t(`material.${h.q.material}`),
                      `${fmt(h.q.o2)}% O₂`,
                      `${fmt(h.q.psi)} psi`,
                    ].map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        size="sm"
                        className="h-auto font-medium text-muted-foreground"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <CardDescription>
                    {t('home.mostRelevant')}{' '}
                    <span className="font-semibold text-[var(--navy)]">
                      {h.top}
                    </span>
                  </CardDescription>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <h2 className="text-lg font-semibold">{t('home.examplesTitle')}</h2>
        <div className="flex flex-wrap gap-1.5">
          {examples.map(([label, text]) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full font-medium"
              onClick={() => onExample(text)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
