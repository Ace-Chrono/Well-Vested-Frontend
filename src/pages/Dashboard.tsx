import { Button } from '@/components/ui/button'
import { usePlaidTransactions } from '@/hooks/usePlaidTransactions'

const NET_WORTH = {
  total: 84212,
  delta: 1340,
  cash: 12480,
  investments: 68900,
  liabilities: -3168,
}

export function Dashboard() {
  const { connect, canConnect, isConnected, transactions } = usePlaidTransactions()

  return (
    <div className="w-full p-4 flex flex-col gap-4">
      {/* Net worth box */}
      <div className="rounded-lg border p-4 flex flex-col gap-4">
        <div>
          <p>Net worth</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-semibold">${NET_WORTH.total.toLocaleString()}</h1>
            <span className="text-sm text-green-600">
              +${NET_WORTH.delta.toLocaleString()} this month
            </span>
          </div>
        </div>

        <div className="flex gap-8">
          <div>
            <p>Cash</p>
            <p className="text-sm">${NET_WORTH.cash.toLocaleString()}</p>
          </div>
          <div>
            <p>Investments</p>
            <p className="text-sm">${NET_WORTH.investments.toLocaleString()}</p>
          </div>
          <div>
            <p>Liabilities</p>
            <p className="text-sm">−${Math.abs(NET_WORTH.liabilities).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Transactions header box */}
      <div className="rounded-lg border p-4 flex items-center justify-between">
        <h2 className="font-semibold">Transactions</h2>
        {!isConnected && (
          <Button size="sm" onClick={() => connect()} disabled={!canConnect}>
            Connect your bank
          </Button>
        )}
      </div>

      {/* Transactions table box */}
      <div className="rounded-lg border p-4">
        {isConnected ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Description</th>
                <th className="pb-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2">{transaction.date}</td>
                  <td className="py-2">
                    {transaction.name}
                    <span className="block text-xs text-muted-foreground">
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`py-2 text-right ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : '−'}${Math.abs(transaction.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Connect a bank account to see your recent transactions.</p>
        )}
      </div>
    </div>
  )
}