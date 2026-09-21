import { useCallback, useState } from 'react'

type Transaction = {
  date: string
  name: string
  category: string
  amount: number
}

// Sample data so the UI has something real to render against.
const MOCK_TRANSACTIONS = [
  { date: '2026-09-16', name: 'Paycheck', category: 'Income', amount: 2140.0 },
  { date: '2026-09-15', name: "Trader Joe's", category: 'Groceries', amount: -64.32 },
  { date: '2026-09-14', name: 'Vanguard transfer', category: 'Investing', amount: -500.0 },
  { date: '2026-09-12', name: 'Refund — textbook', category: 'Other', amount: 38.5 },
]

/**
 * Mocked stand-in for the real Plaid hook, same shape/interface so
 * Dashboard.jsx doesn't need to change when the backend is ready:
 *
 *   connect()       -> pretend to open Plaid Link, then "connect"
 *   canConnect       -> always true (no link_token to wait on)
 *   isConnected      -> becomes true after connect() resolves
 *   transactions     -> mock data once connected
 *   error            -> always null here
 *
 * Swap this file's contents for the real fetch/usePlaidLink version once
 * the backend routes exist — nothing else in the app needs to change.
 */
export function usePlaidTransactions() {
  const [isConnected, setIsConnected] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const connect = useCallback(() => {
    // Simulate the delay of the real Link flow + token exchange.
    setTimeout(() => {
      setTransactions(MOCK_TRANSACTIONS)
      setIsConnected(true)
    }, 600)
  }, [])

  return {
    connect,
    canConnect: true,
    isConnected,
    transactions,
    error: null,
  }
}