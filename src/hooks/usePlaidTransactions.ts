import { useCallback, useEffect, useState } from 'react'
import { readSyncFailure, type SyncFailure } from '@/lib/syncErrors'

export type Transaction = {
  date: string
  name: string
  category?: string
  detailedCategory?: string
  amount: number
}

type TransactionResponse = {
  date: string
  name: string
  merchantName?: string
  amount: number
  personalFinanceCategory?: { primary?: string; primaryCategory?: string; detailed?: string }
}

type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

export function usePlaidTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncFailure, setSyncFailure] = useState<SyncFailure | null>(null)

  const loadTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error(`Failed to load transactions: ${response.status}`)
      const transactionResponses: TransactionResponse[] = await response.json()

      const normalizedTransactions: Transaction[] = transactionResponses.map((transaction) => ({
        date: transaction.date,
        name: transaction.merchantName || transaction.name,
        category:
          transaction.personalFinanceCategory?.primary ??
          transaction.personalFinanceCategory?.primaryCategory,
        detailedCategory: transaction.personalFinanceCategory?.detailed,
        amount: transaction.amount,
      }))

      setTransactions(normalizedTransactions)
      setLoadError(null)
    } catch (thrown) {
      setLoadError(thrown instanceof Error ? thrown.message : 'Could not load transactions.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Load persisted transactions without treating them as connection status.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTransactions()
  }, [loadTransactions])

  const syncTransactions = useCallback(async () => {
    setSyncStatus('loading')
    setSyncFailure(null)
    try {
      const response = await fetch('/api/transactions/sync', { method: 'POST' })
      if (!response.ok) {
        const failure = await readSyncFailure(response)
        setSyncFailure(failure)
        setSyncStatus('error')
        return
      }
      setSyncStatus('success')
      await loadTransactions()
    } catch (thrown) {
      setSyncFailure({
        kind: 'error',
        message: thrown instanceof Error ? `Transaction sync failed: ${thrown.message}` : 'Transaction sync failed.',
      })
      setSyncStatus('error')
    }
  }, [loadTransactions])

  return {
    transactions,
    isLoading,
    loadError,
    syncStatus,
    syncFailure,
    syncTransactions,
    reloadTransactions: loadTransactions,
  }
}