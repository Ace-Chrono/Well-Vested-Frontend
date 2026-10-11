import type { Asset } from '@/types/investments'

type AssetListProps = {
  title?: string
  assets: Asset[]
  selectedSymbol: string | null
  onSelect: (symbol: string) => void
  onRemove?: (symbol: string) => void
}

export function AssetList({ title, assets, selectedSymbol, onSelect, onRemove }: AssetListProps) {
  return (
    <div className="flex flex-col gap-2">
      {title && <p>{title}</p>}
      {assets.map((asset) => (
        <div key={asset.symbol} className="flex items-center gap-2 text-sm">
          <button
            onClick={() => onSelect(asset.symbol)}
            className={`flex-1 text-left ${
              selectedSymbol === asset.symbol
                ? 'font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {asset.symbol}
          </button>
          <span className={asset.dayChange >= 0 ? 'text-green-600' : 'text-red-500'}>
            {asset.dayChange >= 0 ? '+' : ''}
            {asset.dayChange.toFixed(1)}%
          </span>
          {onRemove && (
            <button
              onClick={() => onRemove(asset.symbol)}
              className="text-muted-foreground hover:text-red-500"
              aria-label={`Remove ${asset.symbol} from watchlist`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}