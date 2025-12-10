import type { GroupMessage } from "@/types/message"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

interface ApiGroupMessage {
  id: number
  groupId: number
  groupMemberId: number
  senderId: number
  senderName: string
  senderAvatar: string | null
  content: string
  sentAt: string
  edited: number
  editedAt: string | null
  deleted: number
}

export async function getGroupMessages(groupId: string): Promise<GroupMessage[]> {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`, {
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || "Nepavyko gauti žinučių")
  }

  const data = await res.json()
  const arr: ApiGroupMessage[] = Array.isArray(data) ? data : (data.messages ?? [])

  return arr.map((m) => ({
    id: m.id,
    groupId: m.groupId,
    senderId: m.senderId,
    senderName: m.senderName,
    senderAvatar: m.senderAvatar ? `${API_BASE}${m.senderAvatar}` : null,
    content: m.content,
    timestamp: new Date(m.sentAt),
    read: 0,
  }))
}

export async function sendGroupMessage(
  groupId: string,
  senderId: number,
  content: string,
): Promise<GroupMessage> {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, content }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || "Nepavyko išsiųsti žinutės")
  }

  const m: ApiGroupMessage = await res.json()

  return {
    id: m.id,
    groupId: m.groupId,
    senderId: m.senderId,
    senderName: m.senderName,
    senderAvatar: m.senderAvatar ? `${API_BASE}${m.senderAvatar}` : null,
    content: m.content,
    timestamp: new Date(m.sentAt),
    read: 0,
  }
}
