// types/message.ts
export interface Message {
  id: number
  senderId: number
  senderName: string
  senderAvatar?: string | null
  content: string
  timestamp: Date
  read: number
}

export interface GroupMessage extends Message {
  groupId: number
}

export interface PersonalMessage extends Message {
  recipientId: number
}