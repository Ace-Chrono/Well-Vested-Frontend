import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, Info, MessageSquare, Plus, RotateCw } from 'lucide-react'

type ChatTurn = {
  turnId: string
  conversationId: string
  message: string
  reply: string
  currency: string
  startDate: string
  endDate: string
  createdAt: string
}

type ChatRequest = {
  message: string
  conversationId?: string
  currency: string
  startDate: string
  endDate: string
}

const CONVERSATION_KEY = 'well-vested-chat-conversation'

function localDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultDateRange() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { startDate: localDate(start), endDate: localDate(end) }
}

async function errorMessage(response: Response) {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      for (const key of ['message', 'detail', 'error']) {
        const value = body[key as keyof typeof body]
        if (typeof value === 'string' && value !== 'Internal Server Error') return value
      }
    }
  } catch {
    // Fall back to the HTTP status for empty or non-JSON responses.
  }
  return `Request failed (${response.status}).`
}

function formatTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function ChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CONVERSATION_KEY)
    } catch {
      return null
    }
  })
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [message, setMessage] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [startDate, setStartDate] = useState(() => defaultDateRange().startDate)
  const [endDate, setEndDate] = useState(() => defaultDateRange().endDate)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
    let cancelled = false
    async function loadHistory() {
      setIsLoadingHistory(true)
      setError(null)
      try {
        const response = await fetch(`/api/chat/${encodeURIComponent(conversationId!)}`)
        if (!response.ok) throw new Error(await errorMessage(response))
        const history: ChatTurn[] = await response.json()
        if (!cancelled) setTurns(history)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load chat history.')
      } finally {
        if (!cancelled) setIsLoadingHistory(false)
      }
    }
    void loadHistory()
    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, isSending])

  function startNewConversation() {
    setConversationId(null)
    setTurns([])
    setError(null)
    setNotice(null)
    try {
      localStorage.removeItem(CONVERSATION_KEY)
    } catch {
      setNotice('This browser could not remember the conversation ID. The current thread will remain available until you leave this page.')
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = message.trim()
    if (!text || isSending || !/^[A-Z]{3}$/.test(currency)) return

    const request: ChatRequest = {
      message: text,
      ...(conversationId ? { conversationId } : {}),
      currency,
      startDate,
      endDate,
    }
    setMessage('')
    setIsSending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) throw new Error(await errorMessage(response))
      const turn: ChatTurn = await response.json()
      setConversationId(turn.conversationId)
      try {
        localStorage.setItem(CONVERSATION_KEY, turn.conversationId)
      } catch {
        setNotice('Conversation is active, but this browser could not save its ID for a later visit.')
      }
      setTurns((current) => [...current, turn])
    } catch (sendError) {
      setMessage(text)
      setError(sendError instanceof Error ? sendError.message : 'Could not send your message.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-5xl flex-col overflow-hidden rounded-md border bg-card">
      <header className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><MessageSquare className="size-5" /></span>
          <div>
            <h1 className="text-lg font-semibold">Portfolio assistant</h1>
            <p className="text-sm text-muted-foreground">Ask about your saved transactions and investments.</p>
          </div>
        </div>
        <button type="button" onClick={startNewConversation} className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md border px-3 text-sm font-medium hover:bg-muted sm:self-auto">
          <Plus className="size-4" /> New conversation
        </button>
      </header>

      <div className="flex items-start gap-2 border-b bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:px-6">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>AI-generated insights can be inaccurate. This assistant is not a financial advisor and does not provide financial advice. Use its responses as general information about your spending and portfolio, and verify important decisions independently.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-b bg-muted/20 px-4 py-3 sm:px-6">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">Currency
          <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} maxLength={3} pattern="[A-Z]{3}" required className="h-9 w-24 rounded-md border bg-background px-3 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">From
          <input type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} required className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">To
          <input type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} required className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" />
        </label>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
        {isLoadingHistory && <p className="text-center text-sm text-muted-foreground">Loading conversation…</p>}
        {!isLoadingHistory && turns.length === 0 && (
          <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-12 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <h2 className="font-medium">Start a conversation</h2>
            <p className="text-sm text-muted-foreground">Ask about spending patterns, holdings, or your portfolio over the selected date range.</p>
          </div>
        )}
        {turns.map((turn) => (
          <article key={turn.turnId} className="space-y-4">
            <div className="ml-auto max-w-[85%] rounded-md bg-primary px-4 py-3 text-sm text-primary-foreground sm:max-w-[75%]">
              <p className="whitespace-pre-wrap">{turn.message}</p>
              <time className="mt-2 block text-xs text-primary-foreground/70">{formatTime(turn.createdAt)}</time>
            </div>
            <div className="max-w-[90%] rounded-md bg-muted px-4 py-3 text-sm sm:max-w-[80%]">
              <p className="whitespace-pre-wrap leading-relaxed">{turn.reply}</p>
            </div>
          </article>
        ))}
        {isSending && <p className="text-sm text-muted-foreground">Thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {(error || notice) && (
        <p role={error ? 'alert' : 'status'} className={`border-t px-4 py-2 text-sm sm:px-6 ${error ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>
          {error || notice}
        </p>
      )}

      <form onSubmit={sendMessage} className="flex items-end gap-2 border-t p-3 sm:p-4">
        <label className="sr-only" htmlFor="chat-message">Message</label>
        <textarea
          id="chat-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          maxLength={4000}
          rows={2}
          placeholder="Ask about your finances…"
          className="max-h-40 min-h-11 flex-1 resize-y rounded-md border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button type="submit" aria-label="Send message" disabled={isSending || !message.trim() || !/^[A-Z]{3}$/.test(currency) || startDate > endDate} className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isSending ? <RotateCw className="size-4 animate-spin" /> : <ArrowUp className="size-5" />}
        </button>
      </form>
    </section>
  )
}