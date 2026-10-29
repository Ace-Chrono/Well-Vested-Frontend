import { createContext, useContext } from 'react'

export type ConnectionStatus = 'unknown' | 'connected'
export type ConnectionOperation = 'idle' | 'loading' | 'success' | 'error'

export type PlaidConnectionValue = {
  status: ConnectionStatus
  operation: ConnectionOperation
  error: string | null
  linkTokenError: string | null
  isLinkReady: boolean
  connectBank: () => void
}

export const PlaidConnectionContext = createContext<PlaidConnectionValue | null>(null)

export function usePlaidConnection() {
  const context = useContext(PlaidConnectionContext)
  if (!context) throw new Error('usePlaidConnection must be used within PlaidConnectionProvider.')
  return context
}