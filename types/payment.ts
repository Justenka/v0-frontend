export interface Payment {
  id: string
  transactionId: number
  groupId: number
  fromMemberId: number
  fromMemberName: string
  toMemberId: number
  toMemberName: string
  amount: number
  currency: string
  date: Date
  note?: string
}
