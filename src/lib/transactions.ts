import type { Transaction } from '@/hooks/usePlaidTransactions'

// Plaid's primary categories -> the labels shown in the app.
const PRIMARY_CATEGORY_LABELS: Record<string, string> = {
  INCOME: 'Income',
  TRANSFER_IN: 'Transfers',
  TRANSFER_OUT: 'Transfers',
  LOAN_PAYMENTS: 'Loan payments',
  BANK_FEES: 'Bank fees',
  ENTERTAINMENT: 'Entertainment',
  FOOD_AND_DRINK: 'Food & drink',
  GENERAL_MERCHANDISE: 'Shopping',
  HOME_IMPROVEMENT: 'Home',
  MEDICAL: 'Health',
  PERSONAL_CARE: 'Personal care',
  GENERAL_SERVICES: 'Services',
  GOVERNMENT_AND_NON_PROFIT: 'Government & giving',
  TRANSPORTATION: 'Transportation',
  TRAVEL: 'Travel',
  RENT_AND_UTILITIES: 'Rent & utilities',
}

// More specific Plaid categories that get their own label.
const DETAILED_CATEGORY_LABELS: Record<string, string> = {
  GENERAL_MERCHANDISE_ONLINE_MARKETPLACES: 'Online shopping',
  FOOD_AND_DRINK_GROCERIES: 'Groceries',
}

// TEMPORARY: the backend currently sends personalFinanceCategory: null, so guess
// from the merchant name. Delete this once real categories come through.
const NAME_KEYWORD_LABELS: Array<[string, string]> = [
  ['uber', 'Transportation'],
  ['lyft', 'Transportation'],
  ['united airlines', 'Travel'],
  ['mcdonald', 'Food & drink'],
  ['starbucks', 'Food & drink'],
  ['kfc', 'Food & drink'],
  ['touchstone', 'Personal care'],
  ['bicycle', 'Shopping'],
  ['gusto pay', 'Income'],
  ['intrst pymnt', 'Income'],
  ['credit card', 'Loan payments'],
  ['automatic payment', 'Loan payments'],
  ['cd deposit', 'Transfers'],
]

function guessCategoryFromName(name: string): string | undefined {
  const lowerName = name.toLowerCase()
  return NAME_KEYWORD_LABELS.find(([keyword]) => lowerName.includes(keyword))?.[1]
}

function titleCase(raw: string): string {
  const spaced = raw.replace(/_/g, ' ').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function getCategoryLabel(transaction: Transaction): string {
  const detailedLabel = transaction.detailedCategory
    ? DETAILED_CATEGORY_LABELS[transaction.detailedCategory]
    : undefined
  if (detailedLabel) return detailedLabel
  if (!transaction.category) return guessCategoryFromName(transaction.name) ?? 'Other'
  return PRIMARY_CATEGORY_LABELS[transaction.category] ?? titleCase(transaction.category)
}

// Plaid's convention: a positive amount is money out, negative is money in.
// Income is always treated as money in, whatever the sign says.
export function isExpense(transaction: Transaction): boolean {
  if (getCategoryLabel(transaction) === 'Income') return false
  return transaction.amount > 0
}

// Money out that counts as spending. Transfers, loan payments and income
// aren't spending, so the chart skips them.
const NON_SPENDING_LABELS = new Set(['Income', 'Transfers', 'Loan payments'])

export function isSpending(transaction: Transaction): boolean {
  return isExpense(transaction) && !NON_SPENDING_LABELS.has(getCategoryLabel(transaction))
}