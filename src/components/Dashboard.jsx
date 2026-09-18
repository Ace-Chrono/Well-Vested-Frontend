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
    <div className="w-full max-w-5xl p-4 pt-2 flex flex-col gap-4">
      {/* Net worth box */}
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Net worth</p>
        <div className="flex items-baseline gap-3">
          <h1 className="text-4xl font-semibold">${NET_WORTH.total.toLocaleString()}</h1>
          <span className="text-sm text-green-600">
            +${NET_WORTH.delta.toLocaleString()} this month
          </span>
        </div>

        <div className="mt-3 flex gap-8 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Cash</p>
            <p className="text-sm">${NET_WORTH.cash.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Investments</p>
            <p className="text-sm">${NET_WORTH.investments.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Liabilities</p>
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

      {/* Big transactions table box */}
      <div className="rounded-lg border p-4 min-h-[400px]">
        {isConnected ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Description</th>
                <th className="pb-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{tx.date}</td>
                  <td className="py-2">
                    {tx.name}
                    <span className="block text-xs text-muted-foreground">{tx.category}</span>
                  </td>
                  <td
                    className={`py-2 text-right ${
                      tx.amount > 0 ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : '−'}${Math.abs(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect a bank account to see your recent transactions.
          </p>
        )}
      </div>
    </div>
  )
}