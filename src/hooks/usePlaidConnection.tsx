import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { PlaidConnectionContext, type ConnectionOperation, type ConnectionStatus } from '@/hooks/plaidConnectionContext'

async function getError(response: Response) {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null) {
      for (const key of ['message', 'detail', 'error']) {
        const value = body[key as keyof typeof body]
        if (typeof value === 'string' && value !== 'Internal Server Error') return value
      }
    }
  } catch {
    // Fall back to the HTTP status for an empty or non-JSON response.
  }
  return `Request failed (${response.status}).`
}

export function PlaidConnectionProvider({ children }: { children: ReactNode }) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [linkTokenError, setLinkTokenError] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('unknown')
  const [operation, setOperation] = useState<ConnectionOperation>('idle')
  const [error, setError] = useState<string | null>(null)

  const loadLinkToken = useCallback(async () => {
    setLinkTokenError(null)
    try {
      const response = await fetch('/api/plaid/link-token', { method: 'POST' })
      if (!response.ok) throw new Error(await getError(response))
      const result: { linkToken: string } = await response.json()
      setLinkToken(result.linkToken)
    } catch (loadError) {
      setLinkTokenError(loadError instanceof Error ? loadError.message : 'Could not prepare Plaid Link.')
    }
  }, [])

  useEffect(() => {
    // Fetching a Link token prepares the explicit button action; it does not open Link.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLinkToken()
  }, [loadLinkToken])

  const handleSuccess = useCallback(async (publicToken: string | null) => {
    if (!publicToken) {
      setOperation('error')
      setError('Plaid did not return a public token.')
      return
    }
    setOperation('loading')
    setError(null)
    try {
      const response = await fetch(
        `/api/plaid/exchange?publicToken=${encodeURIComponent(publicToken)}`,
        { method: 'POST' }
      )
      if (!response.ok) throw new Error(await getError(response))
      setStatus('connected')
      setOperation('success')
      void loadLinkToken()
    } catch (exchangeError) {
      setOperation('error')
      setError(exchangeError instanceof Error ? exchangeError.message : 'Could not connect this bank.')
      void loadLinkToken()
    }
  }, [loadLinkToken])

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess: handleSuccess })

  const connectBank = useCallback(() => {
    setError(null)
    if (ready) {
      setOperation('idle')
      open()
    } else if (linkTokenError) {
      setOperation('loading')
      void loadLinkToken().finally(() => setOperation('idle'))
    }
  }, [linkTokenError, loadLinkToken, open, ready])

  return (
    <PlaidConnectionContext.Provider
      value={{
        status,
        operation,
        error,
        linkTokenError,
        isLinkReady: ready,
        connectBank,
      }}
    >
      {children}
    </PlaidConnectionContext.Provider>
  )
}