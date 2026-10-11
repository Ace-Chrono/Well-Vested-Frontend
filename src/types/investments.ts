export type PricePoint = {
  date: string
  value: number
}

export type Asset = {
  symbol: string
  name: string
  price: number
  dayChange: number
  priceHistory: PricePoint[]
}

export type HeldAsset = Asset & {
  shares: number
}