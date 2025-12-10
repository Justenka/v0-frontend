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
  categoryName?: string;
}

export interface TransactionWithSplits extends Transaction {
  splits: {
    id: number
    userId: number
    userName: string
    amount: number
    percentage: number
    role: number
    paid: boolean
  }[]
}
