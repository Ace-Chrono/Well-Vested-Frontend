const TABS = ['Dashboard', 'Investments', 'Chat']

type NavBarProps = {
  active: string
  onChange: (tab: string) => void
}

export function NavBar({ active, onChange }: NavBarProps) {
  return (
    <nav className="flex w-full items-center gap-6 border-b px-6 py-4">
      <button onClick={() => onChange('Dashboard')} className="font-semibold">
        Well Vested
      </button>
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-1 text-sm transition-colors ${active === tab
              ? 'border-b-2 border-foreground'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}