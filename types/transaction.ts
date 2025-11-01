export interface Transaction {
  id: number
  title: string
  amount: number
  paidBy: string
  date: Date
  splitType: string
  currency?: string
  lateFee?: number
  lateFeeDays?: number
  categoryId?: string // Added category support
}
