// services/messages-api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export interface MessageDTO {
  id: number
  senderId: string
  recipientId: string
  content: string
  timestamp: Date
  read: boolean
}

interface MessagesResponse {
  messages: {
    id: number
    senderId: string
    recipientId: string
    content: string
    timestamp: string
    read: boolean
  }[]
}

export const messagesApi = {
  async getConversation(userId: number, friendId: number): Promise<MessageDTO[]> {
    const res = await fetch(
      `${API_BASE}/api/messages?userId=${userId}&friendId=${friendId}`,
      { cache: "no-store" },
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko gauti pokalbio")
    }

    const data = (await res.json()) as MessagesResponse

    return data.messages
      .map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp), // iš 'YYYY-MM-DD' į Date
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  },

  async sendMessage(userId: number, friendId: number, text: string): Promise<MessageDTO> {
    const res = await fetch(`${API_BASE}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: userId, toUserId: friendId, text }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko išsiųsti žinutės")
    }

    const data = (await res.json()) as {
      message: {
        id: number
        senderId: string
        recipientId: string
        content: string
        timestamp: string
        read: boolean
      }
    }

    return {
      ...data.message,
      timestamp: new Date(data.message.timestamp),
    }
  },
}
