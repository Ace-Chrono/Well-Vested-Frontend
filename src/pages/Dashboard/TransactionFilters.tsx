import { Button } from '@/components/ui/button'

export type Direction = 'all' | 'in' | 'out'

type TransactionFiltersProps = {
  searchText: string
  onSearchTextChange: (value: string) => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  direction: Direction
  onDirectionChange: (value: Direction) => void
  hasActiveFilters: boolean
  onClear: () => void
}

export function TransactionFilters({
  searchText,
  onSearchTextChange,
  categories,
  selectedCategory,
  onCategoryChange,
  direction,
  onDirectionChange,
  hasActiveFilters,
  onClear,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={searchText}
        onChange={(event) => onSearchTextChange(event.target.value)}
        placeholder="Search transactions"
        className="h-9 w-64 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <select
        value={selectedCategory}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        value={direction}
        onChange={(event) => onDirectionChange(event.target.value as Direction)}
        className="h-9 rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="all">Money in and out</option>
        <option value="in">Money in</option>
        <option value="out">Money out</option>
      </select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  )
}