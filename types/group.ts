import type { Member } from "./member"
import type { Transaction } from "./transaction"

export interface Group {
  id: number
  title: string
  balance: number
  members: Member[]
  transactions?: Transaction[]
}
