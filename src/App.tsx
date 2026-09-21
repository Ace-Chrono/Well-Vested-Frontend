import { useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { Dashboard } from '@/components/Dashboard'

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  return (
    <div className="flex min-h-svh flex-col">
      <NavBar active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 p-4">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Investments' && (
          <h1 className="text-2xl font-semibold">Investments (placeholder)</h1>
        )}
        {activeTab === 'Chat' && <h1 className="text-2xl font-semibold">Chat (placeholder)</h1>}
      </main>
    </div>
  )
}

export default App