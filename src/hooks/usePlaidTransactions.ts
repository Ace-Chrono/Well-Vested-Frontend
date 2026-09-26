import { useCallback, useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'

const API_BASE = '' // adjust if your backend runs elsewhere

export function usePlaidTransactions() {
  const [linkToken, setLinkToken] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  const loadTransactions = useCallback(async () => {
    try {
      // POST /filter with an empty body — confirm this returns "all
      // transactions" for your TransactionFilterRequestDTO. If it requires
      // specific fields (e.g. a date range), fill those in here instead of {}.
      const res = await fetch(`${API_BASE}/api/transactions/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error(`Failed to load transactions: ${res.status}`)
      const data = await res.json()

      // ADJUST THESE FIELD NAMES to match your actual TransactionResponseDTO.
      const normalized = data.map((tx) => ({
        date: tx.date,
        name: tx.merchantName || tx.name,
        category: tx.personalFinanceCategory?.primary,
        amount: tx.amount,
      }))

      setTransactions(normalized)
      setIsConnected(normalized.length > 0)
    } catch (err) {
      setError(err)
    }
  }, [])

  useEffect(() => {
    async function createLinkToken() {
      try {
        const res = await fetch(`${API_BASE}/api/plaid/link-token`, { method: 'POST' })
        if (!res.ok) throw new Error(`Failed to create link token: ${res.status}`)
        const data = await res.json()
        setLinkToken(data.linkToken)
      } catch (err) {
        setError(err)
      }
    }
    createLinkToken()
    loadTransactions()
  }, [loadTransactions])

  const onSuccess = useCallback(
    async (publicToken) => {
      try {
        // Note: exchange takes publicToken as a query param, not a JSON body.
        const exchangeRes = await fetch(
          `${API_BASE}/api/plaid/exchange?publicToken=${encodeURIComponent(publicToken)}`,
          { method: 'POST' }
        )
        if (!exchangeRes.ok) throw new Error(`Failed to exchange token: ${exchangeRes.status}`)

        // Pull fresh transactions from Plaid into the backend's database.
        const syncRes = await fetch(`${API_BASE}/api/transactions/sync`, { method: 'POST' })
        if (!syncRes.ok) throw new Error(`Failed to sync transactions: ${syncRes.status}`)

        await loadTransactions()
        setIsConnected(true)
      } catch (err) {
        setError(err)
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