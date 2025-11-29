export type UserRole = "admin" | "member" | "guest"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  lastLoginAt: Date     
  friends: string[]
}

export interface AuthUser extends User {
  isAuthenticated: boolean
}

export interface GroupPermission {
  groupId: string
  userId: string
  role: UserRole
}
