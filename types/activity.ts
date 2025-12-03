export type ActivityType =
  | "group_created"
  | "member_added"
  | "member_removed"
  | "expense_added"
  | "expense_edited"
  | "expense_deleted"
  | "payment_registered"
  | "settlement"
  | "permission_changed"

export interface Activity {
  id: string
  groupId?: string
  userId: string
  userName: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

