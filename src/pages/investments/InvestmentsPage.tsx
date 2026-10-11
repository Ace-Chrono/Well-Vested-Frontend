import { useState, type FormEvent } from 'react'
import { HOLDINGS, CRYPTO_HOLDINGS, generateMockAsset } from '@/data/mockInvestments'
import type { Asset } from '@/types/investments'
import { AssetList } from '@/pages/investments/AssetList'
import { AssetDetailView } from '@/pages/investments/AssetDetailView'
import { PortfolioView } from '@/pages/investments/PortfolioView'

export function InvestmentsPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<Asset[]>([])
  const [newSymbol, setNewSymbol] = useState('')

  const selectedStock = HOLDINGS.find((holding) => holding.symbol === selectedSymbol)
  const selectedCrypto = CRYPTO_HOLDINGS.find((holding) => holding.symbol === selectedSymbol)
  const selectedWatchedAsset = watchlist.find((asset) => asset.symbol === selectedSymbol)

  const clearSelection = () => setSelectedSymbol(null)

  function handleAddToWatchlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const symbol = newSymbol.trim().toUpperCase()
    if (!symbol) return

    const isAlreadyTracked = [...HOLDINGS, ...CRYPTO_HOLDINGS, ...watchlist].some(
      (asset) => asset.symbol === symbol
    )
    if (!isAlreadyTracked) {
      setWatchlist((currentWatchlist) => [...currentWatchlist, generateMockAsset(symbol)])
    }
    setNewSymbol('')
  }

  function handleRemoveFromWatchlist(symbol: string) {
    setWatchlist((currentWatchlist) =>
      currentWatchlist.filter((asset) => asset.symbol !== symbol)
    )
    if (selectedSymbol === symbol) clearSelection()
  }

  let mainView = <PortfolioView />
  if (selectedStock) {
    mainView = <AssetDetailView asset={selectedStock} unitLabel="shares" onBack={clearSelection} />
  } else if (selectedCrypto) {
    mainView = <AssetDetailView asset={selectedCrypto} unitLabel="coins" onBack={clearSelection} />
  } else if (selectedWatchedAsset) {
    mainView = <AssetDetailView asset={selectedWatchedAsset} onBack={clearSelection} />
  }

  return (
    <div className="w-full p-4 flex gap-4">
      <div className="flex-1">{mainView}</div>

      <div className="w-64 shrink-0 rounded-lg border p-4 flex flex-col gap-4">
        <button
          onClick={clearSelection}
          className={`text-left text-sm ${
            selectedSymbol === null
              ? 'font-semibold'
              : 'text-muted-foreground hover:text-foreground'
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

        <div className="flex flex-col gap-2">
          <p>Watchlist</p>
          <form onSubmit={handleAddToWatchlist} className="flex gap-1">
            <input
              value={newSymbol}
              onChange={(event) => setNewSymbol(event.target.value)}
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