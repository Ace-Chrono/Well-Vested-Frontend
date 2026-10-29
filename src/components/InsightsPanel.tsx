import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'

export type Insight = {
  insightId: string
  scope: string
  type: string
  severity: string
  subject: string
  message: string
  isoCurrencyCode: string
  startDate: string | null
  endDate: string | null
  value: number | null
  previousValue: number | null
  percentage: number | null
  generatedAt: string | null
}

type InsightKind = 'spending' | 'investments'
type InsightAction = 'generate' | 'save'
type OperationState = 'idle' | 'loading' | 'success' | 'error'

type InsightsPanelProps = {
  kind: InsightKind
}

function currency(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currencyCode || 'USD'}`
  }
}

function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function insightMetric(insight: Insight) {
  const parts: string[] = []
  if (insight.value !== null) parts.push(currency(insight.value, insight.isoCurrencyCode))
  if (insight.previousValue !== null) parts.push(`previously ${currency(insight.previousValue, insight.isoCurrencyCode)}`)
  if (insight.percentage !== null) parts.push(`${insight.percentage > 0 ? '+' : ''}${insight.percentage.toFixed(1)}%`)
  return parts
}

async function readError(response: Response) {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      for (const key of ['message', 'detail', 'error']) {
        const value = body[key as keyof typeof body]
        if (typeof value === 'string' && value !== 'Internal Server Error') return value
      }
    }
  } catch {
    // Fall back to the HTTP status.
  }
  return `Request failed (${response.status}).`
}

function getRange() {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export function InsightsPanel({ kind }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [operation, setOperation] = useState<OperationState>('idle')
  const [operationMessage, setOperationMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState(getRange)

  const loadInsights = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch(`/api/insights/${kind}?currency=USD`)
      if (!response.ok) throw new Error(await readError(response))
      const data: Insight[] = await response.json()
      setInsights(data)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load insights.')
    } finally {
      setIsLoading(false)
    }
  }, [kind])

  useEffect(() => {
    // Load saved insight records when this page's Insights view opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInsights()
  }, [loadInsights])

  async function runAction(action: InsightAction) {
    setOperation('loading')
    setOperationMessage(null)
    const query = new URLSearchParams({ currency: 'USD' })
    if (kind === 'spending') {
      query.set('startDate', dateRange.startDate)
      query.set('endDate', dateRange.endDate)
    }
    const endpoint = action === 'save' ? 'sync' : 'generate'

    try {
      const response = await fetch(`/api/insights/${kind}/${endpoint}?${query}`, { method: 'POST' })
      if (!response.ok) throw new Error(await readError(response))
      const result: Insight[] = await response.json()
      setInsights(result)
      setOperation('success')
      setOperationMessage(action === 'save' ? 'Insights generated and saved.' : 'Insights generated.')
    } catch (error) {
      setOperation('error')
      setOperationMessage(error instanceof Error ? error.message : 'Could not generate insights.')
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold">{kind === 'spending' ? 'Spending insights' : 'Investment insights'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Individual insights based on your persisted data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {kind === 'spending' && (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                From
                <input type="date" value={dateRange.startDate} max={dateRange.endDate} onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value }))} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                To
                <input type="date" value={dateRange.endDate} min={dateRange.startDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value }))} className="h-9 rounded-md border bg-background px-2 text-sm text-foreground" />
              </label>
            </>
          )}
          <button type="button" onClick={() => void loadInsights()} disabled={isLoading || operation === 'loading'} aria-label="Refresh saved insights" title="Refresh saved insights" className="inline-flex size-9 items-center justify-center rounded-md border hover:bg-muted disabled:opacity-50">
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => void runAction('generate')} disabled={operation === 'loading'} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <Sparkles className="size-4" /> Generate
          </button>
          <button type="button" onClick={() => void runAction('save')} disabled={operation === 'loading'} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <RefreshCw className={`size-4 ${operation === 'loading' ? 'animate-spin' : ''}`} />
            {operation === 'loading' ? 'Working…' : 'Generate and save'}
          </button>
        </div>
      </header>

      {operationMessage && (
        <p role={operation === 'error' ? 'alert' : 'status'} className={`text-sm ${operation === 'error' ? 'text-red-700 dark:text-red-300' : operation === 'success' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>
          {operationMessage}
        </p>
      )}
      {loadError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading saved insights…</p>
      ) : insights.length === 0 ? (
        <p className="rounded-md border py-10 text-center text-sm text-muted-foreground">No saved insights yet.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {insights.map((insight) => {
            const periodStart = dateLabel(insight.startDate)
            const periodEnd = dateLabel(insight.endDate)
            const metrics = insightMetric(insight)
            return (
              <li key={insight.insightId} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{insight.subject || insight.type}</h3>
                    <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">{insight.type.replaceAll('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground">{insight.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{insight.message}</p>
                </div>
                <div className="shrink-0 text-sm sm:text-right">
                  {metrics.map((metric) => <p key={metric} className="font-medium tabular-nums">{metric}</p>)}
                  {(periodStart || periodEnd) && <p className="mt-1 text-xs text-muted-foreground">{periodStart || '—'}{periodEnd ? ` – ${periodEnd}` : ''}</p>}
                  {insight.generatedAt && <p className="mt-1 text-xs text-muted-foreground">{new Date(insight.generatedAt).toLocaleString()}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
