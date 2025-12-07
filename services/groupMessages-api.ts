// src/services/groupMessagesApi.ts
import type { GroupMessage } from "@/types/message"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// Kaip žinutė grįžta iš backend'o
interface ApiGroupMessage {
  id: number
  groupId: number
  groupMemberId: number
  senderId: number
  senderName: string
  content: string
  sentAt: string
  edited: number
  editedAt: string | null
  deleted: number
}

function mapApiToGroupMessage(m: ApiGroupMessage): GroupMessage {
  return {
    id: m.id,
    groupId: m.groupId,
    senderId: m.senderId,
    senderName: m.senderName,
    content: m.content,
    timestamp: new Date(m.sentAt),
    read: 0,
  }
}

export async function getGroupMessages(
  groupId: string | number,
): Promise<GroupMessage[]> {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`, {
    credentials: "include",
  })

  if (!res.ok) {
    throw new Error("Nepavyko užkrauti grupės žinučių")
  }

  const data = (await res.json()) as ApiGroupMessage[]
  return data.map(mapApiToGroupMessage)
}

export async function sendGroupMessage(
  groupId: string | number,
  senderId: number,
  content: string,
): Promise<GroupMessage> {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ senderId, content }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "Nepavyko išsiųsti žinutės")
  }

  const data = (await res.json()) as ApiGroupMessage
  return mapApiToGroupMessage(data)
}