import { useEffect, useRef, type KeyboardEvent } from 'react'
import { translatedExamples, useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/contracts'
import type { ChatMessage, QueryState } from '../types'
import { AiBubble } from './AiBubble'

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
    <section id="screen-chat" className="screen">
      <div className="thread" ref={threadRef} id="thread">
        <div className="thread-inner" id="thread-inner">
          {empty ? (
            <div className="welcome" id="welcome">
              <span className="step">
                {t('chat.profileStep', { name: profileLabel })}
              </span>
              <h1>{t('chat.welcomeTitle')}</h1>
              <p className="why">{t('chat.welcomeWhy')}</p>
              <div className="chips" style={{ justifyContent: 'center' }}>
                {examples.map(([label, text]) => (
                  <button
                    key={label}
                    type="button"
                    className="chip"
                    onClick={() => onExample(text)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) =>
            m.kind === 'user' ? (
              <div className="msg-user" key={m.id}>
                {m.text}
              </div>
            ) : (
              <AiBubble
                key={m.id}
                msg={m}
                onFollowup={onFollowup}
                onApplyConditions={(q) => onApplyConditions(q, m.id)}
                environments={environments}
              />
            ),
          )}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            aria-label={t('chat.messageAria')}
            placeholder={t('chat.placeholder')}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {error ? <span className="error">{error}</span> : null}
          <div className="actions">
            <span className="hint">{t('chat.hintKeys')}</span>
            <button type="button" className="send" onClick={onSend}>
              {t('chat.send')}
            </button>
          </div>
        </div>
        <p className="hint composer-note">{t('chat.composerNote')}</p>
      </div>
    </section>
  )
}
