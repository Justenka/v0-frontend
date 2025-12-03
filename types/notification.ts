export type NotificationType =
  | "group_invite"
  | "friend_request"
  | "payment_received"
  | "payment_reminder"
  | "new_expense"
  | "group_message"
  | "personal_message"
  | "system"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  timestamp: Date
  actionUrl?: string
  metadata?: Record<string, any>
}

