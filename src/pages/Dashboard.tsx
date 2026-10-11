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
    <div className="w-full p-4 flex flex-col gap-6">
      {/* Net worth box */}
      <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Net worth</p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl font-semibold tracking-tight tabular-nums">
              ${NET_WORTH.total.toLocaleString()}
            </h1>
            <span className="rounded-full bg-gain/10 px-2.5 py-0.5 text-sm font-medium text-gain">
              +${NET_WORTH.delta.toLocaleString()} this month
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Cash</p>
            <p className="text-xl font-semibold tabular-nums">
              ${NET_WORTH.cash.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Investments</p>
            <p className="text-xl font-semibold tabular-nums">
              ${NET_WORTH.investments.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4 flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Liabilities</p>
            <p className="text-xl font-semibold tabular-nums text-loss">
              −${Math.abs(NET_WORTH.liabilities).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions header box */}
      <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between">
        <h2 className="font-semibold">Transactions</h2>
        {!isConnected && (
          <Button size="sm" onClick={() => connect()} disabled={!canConnect}>
            Connect your bank
          </Button>
        )}
      </div>

      {/* Transactions table box */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        {isConnected ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={index} className="border-t">
                  <td className="py-3 text-muted-foreground tabular-nums">{transaction.date}</td>
                  <td className="py-3">
                    <span className="font-medium">{transaction.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {transaction.category}
                    </span>
                  </td>
                  <td
                    className={`py-3 text-right font-medium tabular-nums ${
                      transaction.amount > 0 ? 'text-gain' : 'text-loss'
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