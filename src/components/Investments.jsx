import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { PORTFOLIO_HISTORY, HOLDINGS, CRYPTO_HOLDINGS, generateMockAsset } from '@/data/mockInvestments'

const BOX = 'rounded-lg border p-4'
const ALL_ASSETS = [...HOLDINGS, ...CRYPTO_HOLDINGS]

function totalInvested() {
  return ALL_ASSETS.reduce((sum, h) => sum + h.shares * h.price, 0)
}

function totalDayChange() {
  const total = totalInvested()
  const weighted = ALL_ASSETS.reduce(
    (sum, h) => sum + (h.shares * h.price * h.dayChange) / 100,
    0
  )
  return { dollars: weighted, percent: (weighted / total) * 100 }
}

function generateRecap() {
  // Stand-in for a real AI-generated summary — this just picks out the
  // biggest mover and phrases a sentence around it. Swap this function's
  // body for an API call once there's a real backend endpoint for it.
  const sorted = [...ALL_ASSETS].sort((a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange))
  const topMover = sorted[0]
  const gainers = ALL_ASSETS.filter((a) => a.dayChange > 0).length
  const losers = ALL_ASSETS.length - gainers
  const direction = topMover.dayChange >= 0 ? 'up' : 'down'

  return `${topMover.symbol} is the biggest mover today, ${direction} ${Math.abs(
    topMover.dayChange
  ).toFixed(1)}%. Overall, ${gainers} of your ${ALL_ASSETS.length} holdings are in the green and ${losers} are down for the day.`
}

function PortfolioView() {
  const invested = totalInvested()
  const dayChange = totalDayChange()
  const isUp = dayChange.dollars >= 0
  const recap = generateRecap()

  return (
    <div className="flex flex-col gap-4">
      <div className={BOX}>
        <p>Portfolio value</p>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={PORTFOLIO_HISTORY}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                labelFormatter={(label) => label}
              />
              <Line type="monotone" dataKey="value" stroke="#16a34a" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={`${BOX} flex gap-8`}>
        <div>
          <p>Total invested</p>
          <p className="text-2xl font-semibold">
            ${invested.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p>Today</p>
          <p className={`text-2xl font-semibold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
            {isUp ? '+' : ''}
            ${dayChange.dollars.toFixed(2)} ({dayChange.percent.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className={BOX}>
        <p className="mb-1">Market recap</p>
        <p className="text-sm text-muted-foreground">{recap}</p>
      </div>
    </div>
  )
}

function AssetDetailView({ asset, unitLabel, onBack }) {
  return (
    <div className={`${BOX} flex flex-col gap-4`}>
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground self-start"
      >
        ← Back to portfolio
      </button>

      <div>
        <p className="text-xl font-semibold">
          {asset.symbol} <span className="font-normal text-muted-foreground">{asset.name}</span>
        </p>
        <div className="flex items-baseline gap-3 mt-1">
          <p className="text-3xl font-semibold">${asset.price.toFixed(2)}</p>
          <span className={asset.dayChange >= 0 ? 'text-green-600' : 'text-red-500'}>
            {asset.dayChange >= 0 ? '+' : ''}
            {asset.dayChange.toFixed(2)}% today
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {asset.shares !== undefined
            ? `You own ${asset.shares} ${unitLabel} ($${(asset.shares * asset.price).toLocaleString()})`
            : 'On your watchlist — not currently owned'}
        </p>
      </div>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={asset.priceHistory}>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Price']} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={asset.dayChange >= 0 ? '#16a34a' : '#ef4444'}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AssetList({ title, assets, selectedSymbol, onSelect, onRemove }) {
  return (
    <div className={title ? 'mt-4' : ''}>
      {title && <p className="mb-2">{title}</p>}
      <div className="flex flex-col gap-1">
        {assets.map((a) => (
          <div key={a.symbol} className="flex items-center justify-between text-sm py-1">
            <button
              onClick={() => onSelect(a.symbol)}
              className={`flex-1 text-left ${
                selectedSymbol === a.symbol ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {a.symbol}
            </button>
            <span className={a.dayChange >= 0 ? 'text-green-600' : 'text-red-500'}>
              {a.dayChange >= 0 ? '+' : ''}
              {a.dayChange.toFixed(1)}%
            </span>
            {onRemove && (
              <button
                onClick={() => onRemove(a.symbol)}
                className="ml-2 text-muted-foreground hover:text-red-500"
                aria-label={`Remove ${a.symbol} from watchlist`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Investments() {
  const [selectedSymbol, setSelectedSymbol] = useState(null)
  const [watchlist, setWatchlist] = useState([])
  const [newSymbol, setNewSymbol] = useState('')

  const selectedStock = HOLDINGS.find((h) => h.symbol === selectedSymbol)
  const selectedCrypto = CRYPTO_HOLDINGS.find((h) => h.symbol === selectedSymbol)
  const selectedWatch = watchlist.find((w) => w.symbol === selectedSymbol)

  function handleAddToWatchlist(e) {
    e.preventDefault()
    const symbol = newSymbol.trim().toUpperCase()
    if (!symbol) return

    const alreadyExists =
      HOLDINGS.some((h) => h.symbol === symbol) ||
      CRYPTO_HOLDINGS.some((h) => h.symbol === symbol) ||
      watchlist.some((w) => w.symbol === symbol)

    if (!alreadyExists) {
      setWatchlist((prev) => [...prev, generateMockAsset(symbol)])
    }
    setNewSymbol('')
  }

  function handleRemoveFromWatchlist(symbol) {
    setWatchlist((prev) => prev.filter((w) => w.symbol !== symbol))
    if (selectedSymbol === symbol) setSelectedSymbol(null)
  }

  return (
    <div className="w-full p-4 flex gap-4">
      <div className="flex-1">
        {selectedStock ? (
          <AssetDetailView
            asset={selectedStock}
            unitLabel="shares"
            onBack={() => setSelectedSymbol(null)}
          />
        ) : selectedCrypto ? (
          <AssetDetailView
            asset={selectedCrypto}
            unitLabel="coins"
            onBack={() => setSelectedSymbol(null)}
          />
        ) : selectedWatch ? (
          <AssetDetailView asset={selectedWatch} onBack={() => setSelectedSymbol(null)} />
        ) : (
          <PortfolioView />
        )}
      </div>

      <div className={`${BOX} w-64 shrink-0`}>
        <button
          onClick={() => setSelectedSymbol(null)}
          className={`block w-full text-left text-sm py-1 ${
            !selectedSymbol ? 'font-semibold' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>

        <AssetList
          title="Your stocks"
          assets={HOLDINGS}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />

        <AssetList
          title="Your crypto"
          assets={CRYPTO_HOLDINGS}
          selectedSymbol={selectedSymbol}
          onSelect={setSelectedSymbol}
        />

        <div className="mt-4">
          <p className="mb-2">Watchlist</p>
          <form onSubmit={handleAddToWatchlist} className="flex gap-1 mb-2">
            <input
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              placeholder="Symbol"
              className="w-full text-sm border rounded px-2 py-1"
            />
            <button type="submit" className="text-sm px-2 border rounded hover:bg-muted">
              +
            </button>
          </form>
          {watchlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing added yet</p>
          ) : (
            <AssetList
              assets={watchlist}
              selectedSymbol={selectedSymbol}
              onSelect={setSelectedSymbol}
              onRemove={handleRemoveFromWatchlist}
            />
          )}
        </div>
      </div>
    </div>
  )
}
