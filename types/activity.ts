export type ActivityType =
  | "group_created"
  | "member_added"
  | "member_removed"
  | "member_left"
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "payment_registered"
  | "settlement"
  | "permission_changed"

export interface Activity {
  id: number
  groupId: number
  userId: number | null
  userName: string
  userAvatar?: string | null
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: any
}