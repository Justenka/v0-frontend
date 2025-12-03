export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  read: boolean
}

export interface GroupMessage extends Message {
  groupId: string
}

export interface PersonalMessage extends Message {
  recipientId: string
}

