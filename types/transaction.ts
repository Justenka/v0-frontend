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
  categoryId?: string
  categoryName?: string
}

export interface TransactionWithSplits extends Transaction {
  paidById?: number // Added - the user ID who paid
  paidByUserId?: number // Backend returns this field
  paidByName?: string // Backend also returns the payer's name
  description?: string // Backend returns this too
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