import { useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { Dashboard } from '@/pages/Dashboard'
import { Investments } from '@/components/Investments'

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  return (
    <div className="flex min-h-svh flex-col">
      <NavBar active={activeTab} onChange={setActiveTab} />

      <main className="flex-1 p-4">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Investments' && <Investments />}
        {activeTab === 'Chat' && <h1 className="text-2xl font-semibold">Chat (placeholder)</h1>}
      </main>
    </div>
  )
}

export default App