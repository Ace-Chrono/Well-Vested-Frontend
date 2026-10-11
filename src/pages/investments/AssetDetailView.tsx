import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Asset, HeldAsset } from '@/types/investments'

type AssetDetailViewProps = {
  asset: Asset | HeldAsset
  unitLabel?: string
  onBack: () => void
}

function isHeld(asset: Asset | HeldAsset): asset is HeldAsset {
  return 'shares' in asset
}

export function AssetDetailView({ asset, unitLabel = 'shares', onBack }: AssetDetailViewProps) {
  const isUp = asset.dayChange >= 0

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-4">
      <button
        onClick={onBack}
        className="self-start text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to portfolio
      </button>

      <div className="flex flex-col gap-1">
        <p className="text-xl font-semibold">
          {asset.symbol} <span className="font-normal text-muted-foreground">{asset.name}</span>
        </p>
        <div className="flex items-baseline gap-3">
          <p className="text-3xl font-semibold">${asset.price.toFixed(2)}</p>
          <span className={isUp ? 'text-green-600' : 'text-red-500'}>
            {isUp ? '+' : ''}
            {asset.dayChange.toFixed(2)}% today
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {isHeld(asset)
            ? `You own ${asset.shares} ${unitLabel} ($${(asset.shares * asset.price).toLocaleString()})`
            : 'On your watchlist — not currently owned'}
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={asset.priceHistory}>
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={isUp ? '#16a34a' : '#ef4444'}
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}