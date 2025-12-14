import type { UserRole } from "./user"

export interface Member {
  id: number
  name: string
  balance: number
  email: string
  role: UserRole
  avatar_url?: string | null
}
