import { usePlaidConnection } from '@/hooks/plaidConnectionContext'

const TABS = ['Dashboard', 'Investments', 'Chat']

type NavBarProps = {
  active: string
  onChange: (tab: string) => void
}

export function NavBar({ active, onChange }: NavBarProps) {
  const { status, operation, error, linkTokenError, isLinkReady, connectBank } = usePlaidConnection()

  return (
    <div className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <button onClick={() => onChange('Dashboard')} aria-label="Well Vested home" className="shrink-0">
        <picture>
          <source srcSet="/logo-dark.png" media="(prefers-color-scheme: dark)" />
          <img src="/logo.png" alt="Well Vested" className="h-9 w-auto" />
        </picture>
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`whitespace-nowrap pb-1 text-sm font-medium transition-colors ${
                active === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline" role="status" aria-live="polite">
            {status === 'connected' ? 'Bank connected' : 'Connection unknown'}
          </span>
          <button
            type="button"
            onClick={connectBank}
            disabled={!isLinkReady && !linkTokenError || operation === 'loading'}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {operation === 'loading' ? 'Connecting…' : 'Connect bank'}
          </button>
        </div>
      </nav>
      {(error || linkTokenError) && (
        <p role="alert" className="mx-auto max-w-7xl px-4 pb-3 text-sm text-red-700 sm:px-6 dark:text-red-300">
          {error || `Plaid Link is unavailable: ${linkTokenError}`}
        </p>
      )}
    </div>
  )
}