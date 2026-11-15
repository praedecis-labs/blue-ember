import { useEffect, useRef, type KeyboardEvent } from 'react'
import { EXAMPLES, PROFILES } from '../data'
import type { ChatMessage, ProfileId, QueryState } from '../types'
import { AiBubble } from './AiBubble'

type Props = {
  profile: ProfileId
  messages: ChatMessage[]
  draft: string
  error: string | null
  onDraftChange: (v: string) => void
  onSend: () => void
  onFollowup: (text: string) => void
  onApplyConditions: (q: QueryState, fromMsgId: string) => void
  onExampleFill: (text: string) => void
}

export function ChatScreen({
  profile,
  messages,
  draft,
  error,
  onDraftChange,
  onSend,
  onFollowup,
  onApplyConditions,
  onExampleFill,
}: Props) {
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
              <span className="step">Perfil: {PROFILES[profile].name}</span>
              <h1>O que você quer saber sobre fogo na sua missão?</h1>
              <p className="why">
                Escreva sua hipótese do seu jeito. A resposta vem resumida, com
                os detalhes a um clique: condições, investigações da NASA, força
                da evidência e o que falta testar.
              </p>
              <div className="chips" style={{ justifyContent: 'center' }}>
                {EXAMPLES.map(([label, text]) => (
                  <button
                    key={label}
                    type="button"
                    className="chip"
                    onClick={() => onExampleFill(text)}
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
              />
            ),
          )}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            aria-label="Mensagem"
            placeholder="Ex.: o tecido da cabine continua seguro no habitat lunar a 8,2 psi e 34% de O₂?"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {error ? <span className="error">{error}</span> : null}
          <div className="actions">
            <span className="hint">Enter envia · Shift+Enter quebra a linha</span>
            <button type="button" className="send" onClick={onSend}>
              Enviar
            </button>
          </div>
        </div>
        <p className="hint composer-note">
          Nomes, PSI, DOIs, faixas de teste e atmosferas são reais; notas,
          critérios e textos da IA são fictícios.
        </p>
      </div>
    </section>
  )
}
