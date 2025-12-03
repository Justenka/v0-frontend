// services/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export interface FriendDTO {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface FriendRequestDTO {
  requestId: number
  createdAt: string
  user: FriendDTO
}

export interface FriendRequestsResponse {
  incoming: FriendRequestDTO[]
  outgoing: FriendRequestDTO[]
}

export const friendsApi = {
  async getFriends(userId: number): Promise<FriendDTO[]> {
    const res = await fetch(`${API_BASE}/api/friends?userId=${userId}`)
    if (!res.ok) {
      throw new Error("Nepavyko gauti draugų sąrašo")
    }
    const data = await res.json()
    return data.friends as FriendDTO[]
  },

  async getFriendRequests(userId: number): Promise<FriendRequestsResponse> {
    const res = await fetch(`${API_BASE}/api/friend-requests?userId=${userId}`)
    if (!res.ok) {
      throw new Error("Nepavyko gauti draugų kvietimų")
    }
    return (await res.json()) as FriendRequestsResponse
  },

  async sendRequest(userId: number, email: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/friend-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: userId, email }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko išsiųsti kvietimo")
    }
  },

  async acceptRequest(requestId: number, userId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/friend-requests/${requestId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko patvirtinti kvietimo")
    }
  },

  async rejectRequest(requestId: number, userId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/friend-requests/${requestId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko atmesti kvietimo")
    }
  },

  async removeFriend(userId: number, friendId: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/friends/${friendId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko pašalinti draugo")
    }
  },
}
