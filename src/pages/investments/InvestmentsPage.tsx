import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, RefreshCw, Search, Trash2, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { readSyncFailure, type SyncFailure } from '@/lib/syncErrors'
import { InsightsPanel } from '@/components/InsightsPanel'

const ASSET_TYPES = ['STOCK', 'CRYPTO', 'ETF', 'MUTUAL_FUND', 'BOND', 'CASH', 'OPTION', 'OTHER'] as const
type AssetType = (typeof ASSET_TYPES)[number]
type AssetTypeFilter = AssetType | 'ALL'

type Investment = {
  investmentId: string
  symbol: string
  name: string
  assetType: AssetType
  shares: number
  price: number
  dayChange: number | null
  accountId?: string | null
  securityId?: string | null
  isoCurrencyCode?: string | null
}

type InvestmentForm = {
  symbol: string
  name: string
  assetType: AssetType
  shares: string
  price: string
  dayChange: string
}

const EMPTY_FORM: InvestmentForm = {
  symbol: '',
  name: '',
  assetType: 'STOCK',
  shares: '',
  price: '',
  dayChange: '0',
}

function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

async function responseMessage(response: Response) {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string') {
      return body.message
    }
    if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
      return body.error
    }
  } catch {
    // Use the status when the server does not return JSON.
  }
  return `Request failed (${response.status}).`
}

export function InvestmentsPage() {
  const [pageView, setPageView] = useState<'overview' | 'insights'>('overview')
  const [investments, setInvestments] = useState<Investment[]>([])
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>('ALL')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncSucceeded, setSyncSucceeded] = useState(false)
  const [syncFailure, setSyncFailure] = useState<SyncFailure | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<InvestmentForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const loadInvestments = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = assetTypeFilter === 'ALL'
        ? await fetch('/api/investments')
        : await fetch('/api/investments/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetType: assetTypeFilter }),
          })
      if (!response.ok) throw new Error(await responseMessage(response))
      const result: unknown = await response.json()
      if (!Array.isArray(result)) throw new Error('The investments response was not a list.')
      setInvestments(result as Investment[])
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load investments.')
    } finally {
      setIsLoading(false)
    }
  }, [assetTypeFilter])

  useEffect(() => {
    // The request updates state after its response settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInvestments()
  }, [loadInvestments])

  const filteredInvestments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return investments
    return investments.filter((investment) =>
      `${investment.symbol} ${investment.name} ${investment.assetType}`.toLowerCase().includes(normalizedQuery)
    )
  }, [investments, query])

  const totalValue = investments.reduce(
    (total, investment) => total + investment.shares * investment.price,
    0
  )
  const dailyChange = investments.reduce((total, investment) => {
    if (investment.dayChange === null) return total
    return total + investment.shares * investment.price * investment.dayChange / 100
  }, 0)
  const dailyChangePercent = totalValue ? dailyChange / totalValue * 100 : 0

  function startCreate() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormMode('create')
    setError(null)
  }

  async function startEdit(investment: Investment) {
    setError(null)
    try {
      const response = await fetch(`/api/investments/${encodeURIComponent(investment.investmentId)}`)
      if (!response.ok) throw new Error(await responseMessage(response))
      const detail: Investment = await response.json()
      setSelectedInvestment(detail)
      setEditingId(detail.investmentId)
      setForm({
        symbol: detail.symbol,
        name: detail.name,
        assetType: detail.assetType,
        shares: String(detail.shares),
        price: String(detail.price),
        dayChange: String(detail.dayChange ?? 0),
      })
      setFormMode('edit')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load investment details.')
    }
  }

  async function handleSelect(investment: Investment) {
    setSelectedInvestment(investment)
    setError(null)
    try {
      const response = await fetch(`/api/investments/${encodeURIComponent(investment.investmentId)}`)
      if (!response.ok) throw new Error(await responseMessage(response))
      setSelectedInvestment(await response.json())
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Could not load investment details.')
    }
  }

  async function handleSync() {
    setIsSyncing(true)
    setSyncSucceeded(false)
    setSyncFailure(null)
    try {
      const response = await fetch('/api/investments/sync', { method: 'POST' })
      if (!response.ok) {
        setSyncFailure(await readSyncFailure(response))
        return
      }
      setSyncSucceeded(true)
      await loadInvestments()
    } catch (syncError) {
      setSyncFailure({
        kind: 'error',
        message: syncError instanceof Error ? `Investment sync failed: ${syncError.message}` : 'Investment sync failed.',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  async function handleDelete(investment: Investment) {
    if (!window.confirm(`Delete ${investment.name}?`)) return
    setDeletingId(investment.investmentId)
    setError(null)
    try {
      const response = await fetch(`/api/investments/${encodeURIComponent(investment.investmentId)}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error(await responseMessage(response))
      if (selectedInvestment?.investmentId === investment.investmentId) setSelectedInvestment(null)
      await loadInvestments()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete investment.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    const payload = {
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      assetType: form.assetType,
      shares: Number(form.shares),
      price: Number(form.price),
      dayChange: Number(form.dayChange),
    }

    try {
      const response = formMode === 'edit' && editingId
        ? await fetch(`/api/investments/${encodeURIComponent(editingId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/investments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      if (!response.ok) throw new Error(await responseMessage(response))
      const saved: Investment = await response.json()
      setFormMode(null)
      setEditingId(null)
      setSelectedInvestment(saved)
      await loadInvestments()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save investment.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Portfolio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Investments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage holdings and keep values in sync.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSync} disabled={isSyncing || isLoading} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60">
            <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing investments…' : 'Sync investments'}
          </button>
          <button type="button" onClick={startCreate} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="size-4" /> Add investment
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Investment sections" className="flex gap-5 border-b">
        <button type="button" role="tab" aria-selected={pageView === 'overview'} onClick={() => setPageView('overview')} className={`pb-2 text-sm font-medium ${pageView === 'overview' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Overview
        </button>
        <button type="button" role="tab" aria-selected={pageView === 'insights'} onClick={() => setPageView('insights')} className={`pb-2 text-sm font-medium ${pageView === 'insights' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Insights
        </button>
      </div>

      {pageView === 'insights' ? <InsightsPanel kind="investments" /> : (
      <>
      {error && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => void loadInvestments()} className="shrink-0 font-medium underline underline-offset-2">Retry</button>
        </div>
      )}
      {syncSucceeded && <p role="status" className="text-sm text-green-700 dark:text-green-400">Investments synced.</p>}
      {syncFailure && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{syncFailure.message}</p>}

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-md border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="size-4" /> Portfolio value</div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{formatCurrency(totalValue)}</p>
        </article>
        <article className="rounded-md border bg-card p-4">
          <p className="text-sm text-muted-foreground">Positions</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{investments.length}</p>
        </article>
        <article className="rounded-md border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {dailyChange >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />} Daily change
          </div>
          <p className={`mt-3 text-2xl font-semibold tabular-nums ${dailyChange >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {dailyChange >= 0 ? '+' : ''}{formatCurrency(dailyChange)}
          </p>
          <p className="text-xs text-muted-foreground">{dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent.toFixed(2)}%</p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 rounded-md border bg-card">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Your holdings</h2>
              <p className="mt-1 text-sm text-muted-foreground">{filteredInvestments.length} shown</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 items-center gap-2 rounded-md border px-3 sm:w-56">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or symbol" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </label>
              <select value={assetTypeFilter} onChange={(event) => setAssetTypeFilter(event.target.value as AssetTypeFilter)} aria-label="Filter by asset type" className="h-9 rounded-md border bg-background px-3 text-sm">
                <option value="ALL">All types</option>
                {ASSET_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Investment</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Market value</th>
                  <th className="px-4 py-3 text-right">Day change</th>
                  <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Loading investments...</td></tr>
                ) : filteredInvestments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <p className="font-medium">{query ? 'No matching investments' : 'No investments yet'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{query ? 'Try another name or symbol.' : 'Sync your connected accounts or add an investment.'}</p>
                  </td></tr>
                ) : filteredInvestments.map((investment) => (
                  <tr key={investment.investmentId} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => void handleSelect(investment)} className="text-left">
                        <span className="block font-medium hover:text-primary">{investment.name}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{investment.symbol}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{investment.assetType.replaceAll('_', ' ')}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{investment.shares.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(investment.price, investment.isoCurrencyCode || 'USD')}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(investment.shares * investment.price, investment.isoCurrencyCode || 'USD')}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${investment.dayChange === null ? 'text-muted-foreground' : investment.dayChange >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {investment.dayChange === null ? '—' : `${investment.dayChange >= 0 ? '+' : ''}${investment.dayChange.toFixed(2)}%`}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => void startEdit(investment)} aria-label={`Edit ${investment.name}`} title="Edit" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-4" /></button>
                        <button type="button" onClick={() => void handleDelete(investment)} disabled={deletingId === investment.investmentId} aria-label={`Delete ${investment.name}`} title="Delete" className="rounded p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-950"><Trash2 className="size-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="rounded-md border bg-card p-4">
          <h2 className="font-semibold">Position details</h2>
          {selectedInvestment ? (
            <div className="mt-4 flex flex-col gap-4">
              <div className="border-b pb-4">
                <p className="text-xl font-semibold">{selectedInvestment.name}</p>
                <p className="text-sm text-muted-foreground">{selectedInvestment.symbol} · {selectedInvestment.assetType.replaceAll('_', ' ')}</p>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Market value</dt><dd className="font-medium tabular-nums">{formatCurrency(selectedInvestment.shares * selectedInvestment.price, selectedInvestment.isoCurrencyCode || 'USD')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Shares</dt><dd className="font-medium tabular-nums">{selectedInvestment.shares.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Price</dt><dd className="font-medium tabular-nums">{formatCurrency(selectedInvestment.price, selectedInvestment.isoCurrencyCode || 'USD')}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Day change</dt><dd className="font-medium tabular-nums">{selectedInvestment.dayChange === null ? '—' : `${selectedInvestment.dayChange.toFixed(2)}%`}</dd></div>
              </dl>
              <button type="button" onClick={() => void startEdit(selectedInvestment)} className="self-start text-sm font-medium text-primary hover:underline">Edit investment</button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Select a holding to view its details.</p>
          )}
        </aside>
      </div>

      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormMode(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="investment-form-title" className="w-full max-w-lg rounded-md border bg-background p-5 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="investment-form-title" className="text-lg font-semibold">{formMode === 'create' ? 'Add investment' : 'Edit investment'}</h2>
                <p className="mt-1 text-sm text-muted-foreground">Enter the investment details below.</p>
              </div>
              <button type="button" onClick={() => setFormMode(null)} aria-label="Close form" className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
            </div>
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">Symbol
                <input required maxLength={20} pattern="[A-Za-z0-9][A-Za-z0-9.\-]{0,19}" value={form.symbol} onChange={(event) => setForm({ ...form, symbol: event.target.value })} className="h-9 rounded-md border bg-background px-3" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">Name
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-9 rounded-md border bg-background px-3" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">Asset type
                <select value={form.assetType} onChange={(event) => setForm({ ...form, assetType: event.target.value as AssetType })} className="h-9 rounded-md border bg-background px-3">
                  {ASSET_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">Shares
                <input required type="number" min="0" step="any" value={form.shares} onChange={(event) => setForm({ ...form, shares: event.target.value })} className="h-9 rounded-md border bg-background px-3" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">Price
                <input required type="number" min="0" step="any" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-9 rounded-md border bg-background px-3" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">Day change (%)
                <input required type="number" step="any" value={form.dayChange} onChange={(event) => setForm({ ...form, dayChange: event.target.value })} className="h-9 rounded-md border bg-background px-3" />
              </label>
              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <button type="button" onClick={() => setFormMode(null)} className="h-9 rounded-md border px-3 text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isSaving} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{isSaving ? 'Saving...' : formMode === 'create' ? 'Add investment' : 'Save changes'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
      </>
      )}
    </section>
  )
}