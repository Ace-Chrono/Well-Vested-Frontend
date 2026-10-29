import type { Asset, HeldAsset, PricePoint } from '@/types/investments'

// Stand-in data until the investments backend exists.

function generateSeries(days: number, start: number, volatility: number): PricePoint[] {
  const series: PricePoint[] = []
  let value = start
  const today = new Date()
  for (let daysAgo = days; daysAgo >= 0; daysAgo--) {
    value += (Math.random() - 0.48) * volatility
    const date = new Date(today)
    date.setDate(date.getDate() - daysAgo)
    series.push({
      date: date.toISOString().slice(0, 10),
      value: Math.round(value * 100) / 100,
    })
  }
  return series
}

export const PORTFOLIO_HISTORY: PricePoint[] = generateSeries(90, 60000, 400)

export const HOLDINGS: HeldAsset[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    shares: 12,
    price: 227.5,
    dayChange: 1.8,
    priceHistory: generateSeries(90, 210, 3),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    shares: 6,
    price: 418.2,
    dayChange: -0.6,
    priceHistory: generateSeries(90, 400, 5),
  },
  {
    symbol: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    shares: 20,
    price: 512.9,
    dayChange: 0.4,
    priceHistory: generateSeries(90, 490, 4),
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    shares: 4,
    price: 138.4,
    dayChange: 3.2,
    priceHistory: generateSeries(90, 120, 4),
  },
]

// Same shape as HOLDINGS; "shares" here just means "units held".
export const CRYPTO_HOLDINGS: HeldAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    shares: 0.42,
    price: 91250,
    dayChange: 2.1,
    priceHistory: generateSeries(90, 85000, 1500),
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    shares: 3.1,
    price: 4210,
    dayChange: -1.4,
    priceHistory: generateSeries(90, 3900, 80),
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    shares: 25,
    price: 178,
    dayChange: 4.6,
    priceHistory: generateSeries(90, 150, 6),
  },
]

// Mock data for a symbol added to the watchlist. Replace with a real quote lookup later.
export function generateMockAsset(symbol: string): Asset {
  const startPrice = 50 + Math.random() * 300
  const dayChange = (Math.random() - 0.5) * 6
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: Math.round(startPrice * 100) / 100,
    dayChange: Math.round(dayChange * 100) / 100,
    priceHistory: generateSeries(90, startPrice, startPrice * 0.03),
  }
}