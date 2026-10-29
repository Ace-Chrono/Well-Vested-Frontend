import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { InsightsPanel } from '@/components/InsightsPanel'
import { usePlaidConnection } from '@/hooks/plaidConnectionContext'
import { usePlaidTransactions } from '@/hooks/usePlaidTransactions'
import { getCategoryLabel, isExpense, isSpending } from '@/lib/transactions'
import { SpendingChart } from '@/pages/Dashboard/SpendingChart'
import { TransactionFilters, type Direction } from '@/pages/Dashboard/TransactionFilters'

const NET_WORTH = {
  cash: 12480,
  liabilities: -3168,
}

type InvestmentHolding = {
  shares: number
  price: number
}

function formatInvestmentValue(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

export function DashboardPage() {
  const [pageView, setPageView] = useState<'overview' | 'insights'>('overview')
  const { status: connectionStatus } = usePlaidConnection()
  const isBankConnected = connectionStatus === 'connected'
  const [investmentValue, setInvestmentValue] = useState<number | null>(null)
  const [investmentValueError, setInvestmentValueError] = useState<string | null>(null)
  const [isLoadingInvestmentValue, setIsLoadingInvestmentValue] = useState(true)
  const {
    transactions,
    isLoading,
    loadError,
    syncStatus,
    syncFailure,
    syncTransactions,
  } = usePlaidTransactions()

  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [direction, setDirection] = useState<Direction>('all')

  useEffect(() => {
    if (!isBankConnected) return
    let cancelled = false
    async function loadInvestmentValue() {
      try {
        const response = await fetch('/api/investments')
        if (!response.ok) throw new Error(`Could not load investments (${response.status}).`)
        const holdings: InvestmentHolding[] = await response.json()
        const total = holdings.reduce(
          (sum, holding) => sum + Number(holding.shares) * Number(holding.price),
          0
        )
        if (!cancelled) {
          setInvestmentValue(total)
          setInvestmentValueError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setInvestmentValueError(error instanceof Error ? error.message : 'Could not load investments.')
        }
      } finally {
        if (!cancelled) setIsLoadingInvestmentValue(false)
      }
    }
    void loadInvestmentValue()
    return () => { cancelled = true }
  }, [isBankConnected])

  const categories = useMemo(
    () => [...new Set(transactions.map((transaction) => getCategoryLabel(transaction)))].sort(),
    [transactions]
  )

  const filteredTransactions = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return transactions.filter((transaction) => {
      const category = getCategoryLabel(transaction)
      const matchesSearch =
        query === '' ||
        transaction.name.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory
      const matchesDirection =
        direction === 'all' ||
        (direction === 'out' && isExpense(transaction)) ||
        (direction === 'in' && !isExpense(transaction))
      return matchesSearch && matchesCategory && matchesDirection
    })
  }, [transactions, searchText, selectedCategory, direction])

  const spendingByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const transaction of filteredTransactions) {
      if (!isSpending(transaction)) continue
      const category = getCategoryLabel(transaction)
      totals.set(category, (totals.get(category) ?? 0) + Math.abs(transaction.amount))
    }
    return [...totals.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((first, second) => second.total - first.total)
  }, [filteredTransactions])

  const hasActiveFilters = searchText !== '' || selectedCategory !== 'all' || direction !== 'all'
  const netWorth = investmentValue === null
    ? null
    : NET_WORTH.cash + investmentValue + NET_WORTH.liabilities

  function clearFilters() {
    setSearchText('')
    setSelectedCategory('all')
    setDirection('all')
  }

  return (
    <div className="w-full p-4 flex flex-col gap-6">
      <div role="tablist" aria-label="Dashboard sections" className="flex gap-5 border-b">
        <button type="button" role="tab" aria-selected={pageView === 'overview'} onClick={() => setPageView('overview')} className={`pb-2 text-sm font-medium ${pageView === 'overview' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Overview
        </button>
        <button type="button" role="tab" aria-selected={pageView === 'insights'} onClick={() => setPageView('insights')} className={`pb-2 text-sm font-medium ${pageView === 'insights' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Insights
        </button>
      </div>
      {pageView === 'insights' ? (
        isBankConnected
          ? <InsightsPanel kind="spending" />
          : <p className="text-sm text-muted-foreground">Connect a bank account to view spending insights.</p>
      ) : (
      <>
      {/* Net worth box */}
      <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Net worth</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
              {!isBankConnected ? '—' : isLoadingInvestmentValue ? 'Loading…' : netWorth === null ? '—' : formatInvestmentValue(netWorth)}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-xl font-semibold tabular-nums">
              {isBankConnected ? `$${NET_WORTH.cash.toLocaleString()}` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Investments</p>
            <p className="text-xl font-semibold tabular-nums">
              {!isBankConnected
                ? '—'
                : isLoadingInvestmentValue
                ? 'Loading…'
                : investmentValue === null
                  ? '—'
                  : formatInvestmentValue(investmentValue)}
            </p>
            {isBankConnected && investmentValueError && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{investmentValueError}</p>}
          </div>
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Liabilities</p>
            <p className="text-xl font-semibold tabular-nums text-loss">
              {isBankConnected ? `−$${Math.abs(NET_WORTH.liabilities).toLocaleString()}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Insights use persisted transactions; syncing remains an explicit action. */}
      <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-semibold">Transactions</h2>
          <button
            type="button"
            onClick={() => void syncTransactions()}
            disabled={syncStatus === 'loading'}
            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw className={`size-4 ${syncStatus === 'loading' ? 'animate-spin' : ''}`} />
            {syncStatus === 'loading' ? 'Syncing transactions…' : 'Sync transactions'}
          </button>
        </div>
        {syncStatus === 'success' && <p role="status" className="text-sm text-green-700 dark:text-green-400">Transactions synced.</p>}
        {syncFailure && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{syncFailure.message}</p>}
        {loadError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>}
        {!isBankConnected && <p className="text-sm text-muted-foreground">Connect a bank account to view Dashboard values. You can still try syncing an existing connection.</p>}
        {isBankConnected && <>
        <TransactionFilters
          searchText={searchText}
          onSearchTextChange={setSearchText}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          direction={direction}
          onDirectionChange={setDirection}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        />
        {isLoading && <p className="text-sm text-muted-foreground">Loading transactions…</p>}
        {!isLoading && transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">No persisted transactions yet. Connect a bank, then sync transactions.</p>
        )}
        </>}
      </div>

      {isBankConnected && transactions.length > 0 ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          {/* Transactions table box */}
          <div className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2">
            {filteredTransactions.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No transactions match your filters.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => {
                    const expense = isExpense(transaction)
                    return (
                      <tr key={index} className="border-t">
                        <td className="py-3 text-muted-foreground tabular-nums">
                          {transaction.date}
                        </td>
                        <td className="py-3">
                          <span className="font-medium">{transaction.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {getCategoryLabel(transaction)}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right font-medium tabular-nums ${
                            expense ? 'text-loss' : 'text-gain'
                          }`}
                        >
                          {expense ? '−' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <SpendingChart spending={spendingByCategory} />
        </div>
      ) : null}
      </>
      )}
    </div>
  )
}