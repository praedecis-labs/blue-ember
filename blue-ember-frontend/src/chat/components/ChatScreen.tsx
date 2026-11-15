import { useEffect, useRef, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { translatedExamples, useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/shared/contracts'
import type { ChatMessage, QueryState } from '../domain/types'
import { AiBubble } from './AiBubble'

/** O quadro interpretativo da IA só aparece quando a pessoa pede um dashboard. */
function asksForDashboard(prev: ChatMessage | undefined): boolean {
  return prev?.kind === 'user' && /dashboard|painel|\bmap\b|mapa|coverage|cobertura|where .*fall|onde .*cai/i.test(prev.text)
}

type Props = {
  profileLabel: string
  messages: ChatMessage[]
  draft: string
  error: string | null
  environments?: EnvironmentDto[] | null
  onDraftChange: (v: string) => void
  onSend: () => void
  onFollowup: (text: string) => void
  onApplyConditions: (q: QueryState, fromMsgId: string) => void
  onExample: (text: string) => void
}

export function ChatScreen({
  profileLabel,
  messages,
  draft,
  error,
  environments = null,
  onDraftChange,
  onSend,
  onFollowup,
  onApplyConditions,
  onExample,
}: Props) {
  const t = useT()
  const examples = translatedExamples(t)
  const threadRef = useRef<HTMLDivElement>(null)
  const empty = messages.length === 0

  useEffect(() => {
    const el = threadRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <section
      id="screen-chat"
      className="screen flex min-h-0 min-w-0 flex-col"
    >
      <div
        className="min-w-0 flex-1 overflow-auto"
        ref={threadRef}
        id="thread"
      >
        <div
          className="mx-auto flex w-full max-w-[820px] flex-col gap-3.5 px-3 py-4 md:gap-4.5 md:px-6 md:py-7"
          id="thread-inner"
        >
          {empty ? (
            <div
              className="flex flex-col items-center gap-3 px-0 py-[4vh] text-center"
              id="welcome"
            >
              <Badge
                variant="secondary"
                size="sm"
                className="w-fit uppercase tracking-wide"
              >
                {t('chat.profileStep', { name: profileLabel })}
              </Badge>
              <h1 className="max-w-[720px] text-balance text-2xl font-semibold tracking-tight text-[var(--navy)] md:text-[30px]">
                {t('chat.welcomeTitle')}
              </h1>
              <p className="max-w-[560px] text-sm text-muted-foreground">
                {t('chat.welcomeWhy')}
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
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
          ) : null}

          {messages.map((m, i) =>
            m.kind === 'user' ? (
              <div
                className="animate-[rise_0.35s_ease-out_both] max-w-[min(92%,520px)] self-end rounded-2xl rounded-br-sm bg-[#1B2B85] px-3.5 py-3 text-white [overflow-wrap:anywhere]"
                key={m.id}
              >
                {m.text}
              </div>
            ) : (
              <AiBubble
                key={m.id}
                msg={m}
                showDashboard={asksForDashboard(messages[i - 1])}
                onFollowup={onFollowup}
                onApplyConditions={(q) => onApplyConditions(q, m.id)}
                environments={environments}
              />
            ),
          )}
        </div>
      </div>

      <div className="shrink-0 bg-[var(--bg)] px-3 py-2 md:px-6 md:pb-4.5 md:pt-2">
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-2 rounded-2xl border border-border bg-card p-2.5 pl-3.5 text-card-foreground shadow-sm">
          <textarea
            aria-label={t('chat.messageAria')}
            placeholder={t('chat.placeholder')}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="min-h-[52px] w-full resize-none bg-transparent px-0 py-1.5 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {error ? (
            <span className="text-sm text-destructive" role="alert">
              {error}
            </span>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t('chat.hintKeys')}
            </span>
            <Button
              type="button"
              size="lg"
              onClick={onSend}
              className="!bg-[var(--yellow)] !text-[var(--ink)] hover:!bg-[var(--yellow)]/90"
            >
              {t('chat.send')}
            </Button>
          </div>
        </div>
        <p className="mx-auto mt-1.5 max-w-[820px] text-center text-xs text-muted-foreground">
          {t('chat.composerNote')}
        </p>
      </div>
    </section>
  )
}
