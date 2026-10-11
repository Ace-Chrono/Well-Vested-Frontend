const TABS = ['Dashboard', 'Investments', 'Chat']

type NavBarProps = {
  active: string
  onChange: (tab: string) => void
}

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-10 flex w-full items-center gap-6 border-b bg-background/80 px-6 py-4 backdrop-blur">
            <button onClick={() => onChange('Dashboard')} aria-label="Well Vested home">
        <picture>
          <source srcSet="/logo-dark.png" media="(prefers-color-scheme: dark)" />
          <img src="/logo.png" alt="Well Vested" className="h-9 w-auto" />
        </picture>
      </button>
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-1 text-sm font-medium transition-colors ${
            active === tab
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}