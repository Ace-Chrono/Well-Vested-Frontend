import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

export type CategorySpending = {
  category: string
  total: number
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & drink': '#d97757',
  Groceries: '#c9a227',
  'Online shopping': '#9b7bb8',
  Shopping: '#c46b8a',
  Entertainment: '#6b8fa8',
  Transportation: '#2f6f4e',
  Travel: '#4f6d8f',
  'Rent & utilities': '#7a8f3c',
  Health: '#5f9e6e',
  'Personal care': '#9cc79c',
  Home: '#a07856',
  Services: '#8a8f98',
  'Loan payments': '#b5524a',
  'Bank fees': '#6e6e6e',
  'Government & giving': '#3f8f8f',
}
const FALLBACK_COLOR = '#9aa5a0'

function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR
}

type SpendingChartProps = {
  spending: CategorySpending[]
}

export function SpendingChart({ spending }: SpendingChartProps) {
  const totalSpent = spending.reduce((runningTotal, entry) => runningTotal + entry.total, 0)

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold">Spending by type</h2>
        <p className="text-sm text-muted-foreground">${totalSpent.toFixed(2)} spent</p>
      </div>

      {spending.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No spending to show.</p>
      ) : (
        <>
          <div className="h-48 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={spending}
                  dataKey="total"
                  nameKey="category"
                  innerRadius="60%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {spending.map((entry) => (
                    <Cell key={entry.category} fill={colorFor(entry.category)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-col gap-2 text-sm">
            {spending.map((entry) => (
              <li key={entry.category} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: colorFor(entry.category) }}
                />
                <span className="flex-1">{entry.category}</span>
                <span className="tabular-nums text-muted-foreground">
                  ${entry.total.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}