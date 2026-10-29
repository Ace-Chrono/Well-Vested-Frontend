import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PORTFOLIO_HISTORY, HOLDINGS, CRYPTO_HOLDINGS } from '@/data/mockInvestments'

const ALL_HOLDINGS = [...HOLDINGS, ...CRYPTO_HOLDINGS]

function totalInvested(): number { // This code will be changed when the API is implemented.
  return ALL_HOLDINGS.reduce(
    (runningTotal, holding) => runningTotal + holding.shares * holding.price,
    0
  )
}

function totalDayChange(): { dollars: number; percent: number } { // This code will be changed when the API is implemented.
  const total = totalInvested()
  const dollars = ALL_HOLDINGS.reduce(
    (runningTotal, holding) =>
      runningTotal + (holding.shares * holding.price * holding.dayChange) / 100,
    0
  )
  return { dollars, percent: (dollars / total) * 100 }
}

// Stand-in for a real AI-generated summary. Replace the body with an API call later.
function generateRecap(): string {
  const sortedByMove = [...ALL_HOLDINGS].sort(
    (first, second) => Math.abs(second.dayChange) - Math.abs(first.dayChange)
  )
  const topMover = sortedByMove[0]
  const gainerCount = ALL_HOLDINGS.filter((holding) => holding.dayChange > 0).length
  const loserCount = ALL_HOLDINGS.length - gainerCount
  const direction = topMover.dayChange >= 0 ? 'up' : 'down'

  return `${topMover.symbol} is the biggest mover today, ${direction} ${Math.abs(
    topMover.dayChange
  ).toFixed(1)}%. Overall, ${gainerCount} of your ${
    ALL_HOLDINGS.length
  } holdings are in the green and ${loserCount} are down for the day.`
}

export function PortfolioView() {
  const invested = totalInvested()
  const dayChange = totalDayChange()
  const isUp = dayChange.dollars >= 0

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4 flex flex-col gap-2">
        <p>Portfolio value</p>
        <div className="h-56 w-full">
          <ResponsiveContainer>
            <LineChart data={PORTFOLIO_HISTORY}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Value']} />
              <Line type="monotone" dataKey="value" stroke="#16a34a" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4 flex gap-8">
        <div>
          <p>Total invested</p>
          <p className="text-2xl font-semibold">
            ${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p>Today</p>
          <p className={`text-2xl font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? '+' : ''}${dayChange.dollars.toFixed(2)} ({dayChange.percent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4 flex flex-col gap-1">
        <p>Market recap</p>
        <p className="text-sm text-muted-foreground">{generateRecap()}</p>
      </div>
    </div>
  )
}