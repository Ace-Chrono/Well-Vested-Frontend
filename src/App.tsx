import { useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { InvestmentsPage } from '@/pages/investments/InvestmentsPage'
import { PlaidConnectionProvider } from '@/hooks/usePlaidConnection'
import { ChatPage } from '@/pages/ChatPage'

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')

  return (
    <PlaidConnectionProvider>
      <div className="flex min-h-svh flex-col">
        <NavBar active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 p-4">
          {activeTab === 'Dashboard' && <DashboardPage />}
          {activeTab === 'Investments' && <InvestmentsPage />}
          {activeTab === 'Chat' && <ChatPage />}
        </main>
      </div>
    </PlaidConnectionProvider>
  )
}

export default App