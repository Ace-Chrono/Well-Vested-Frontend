import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'

const API_BASE = ''

export type Transaction = {
  date: string
  name: string
  category?: string
  amount: number
}

type TransactionResponse = {
  date: string
  name: string
  merchantName?: string
  amount: number
  personalFinanceCategory?: { primary?: string }
}

function toError(thrown: unknown): Error {
  return thrown instanceof Error ? thrown : new Error(String(thrown))
}

export function usePlaidTransactions() {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const loadTransactions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/transactions/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error(`Failed to load transactions: ${response.status}`)
      const transactionResponses: TransactionResponse[] = await response.json()

      const normalizedTransactions: Transaction[] = transactionResponses.map((transaction) => ({
        date: transaction.date,
        name: transaction.merchantName || transaction.name,
        category: transaction.personalFinanceCategory?.primary,
        amount: transaction.amount,
      }))

      setTransactions(normalizedTransactions)
      setIsConnected(normalizedTransactions.length > 0)
    } catch (thrown) {
      setError(toError(thrown))
    }
  }, [])

  useEffect(() => {
    async function createLinkToken() {
      try {
        const response = await fetch(`${API_BASE}/api/plaid/link-token`, { method: 'POST' })
        if (!response.ok) throw new Error(`Failed to create link token: ${response.status}`)
        const data: { linkToken: string } = await response.json()
        setLinkToken(data.linkToken)
      } catch (thrown) {
        setError(toError(thrown))
      }
    }
    createLinkToken()
    loadTransactions()
  }, [loadTransactions])

    const onSuccess = useCallback(
    async (publicToken: string | null) => {
      if (!publicToken) return
      try {
        // The exchange endpoint takes publicToken as a query param, not a JSON body.
        const exchangeResponse = await fetch(
          `${API_BASE}/api/plaid/exchange?publicToken=${encodeURIComponent(publicToken)}`,
          { method: 'POST' }
        )
        if (!exchangeResponse.ok) {
          throw new Error(`Failed to exchange token: ${exchangeResponse.status}`)
        }

        const syncResponse = await fetch(`${API_BASE}/api/transactions/sync`, { method: 'POST' })
        if (!syncResponse.ok) throw new Error(`Failed to sync transactions: ${syncResponse.status}`)

        await loadTransactions()
        setIsConnected(true)
      } catch (thrown) {
        setError(toError(thrown))
      }
    },
    [loadTransactions]
  )

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  })

  return {
    connect: open,
    canConnect: ready,
    isConnected,
    transactions,
    error,
  }
}