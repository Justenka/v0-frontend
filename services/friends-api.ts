// services/friends-api.ts (arba dalis iš services/api-client.ts)
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

// Kaip backend atsiunčia user'į draugystėms
interface BackendFriend {
  id_vartotojas: number
  vardas: string
  pavarde: string
  el_pastas: string
  avatar_url?: string | null
}

// Helper: iš backend → FriendDTO
function mapBackendFriend(row: BackendFriend): FriendDTO {
  return {
    id: row.id_vartotojas.toString(),
    name: `${row.vardas} ${row.pavarde}`,
    email: row.el_pastas,
    avatar: row.avatar_url ? `${API_BASE}${row.avatar_url}` : undefined,
  }
}

export const friendsApi = {
  async getFriends(userId: number): Promise<FriendDTO[]> {
    const res = await fetch(`${API_BASE}/api/friends?userId=${userId}`)
    if (!res.ok) {
      throw new Error("Nepavyko gauti draugų sąrašo")
    }

    const data = await res.json() as { friends: BackendFriend[] }
    return data.friends.map(mapBackendFriend)
  },

  async getFriendRequests(userId: number): Promise<FriendRequestsResponse> {
    const res = await fetch(`${API_BASE}/api/friend-requests?userId=${userId}`)
    if (!res.ok) {
      throw new Error("Nepavyko gauti draugų kvietimų")
    }

    const raw = await res.json() as {
      incoming: { requestId: number; createdAt: string; user: BackendFriend }[]
      outgoing: { requestId: number; createdAt: string; user: BackendFriend }[]
    }

    return {
      incoming: raw.incoming.map((r) => ({
        requestId: r.requestId,
        createdAt: r.createdAt,
        user: mapBackendFriend(r.user),
      })),
      outgoing: raw.outgoing.map((r) => ({
        requestId: r.requestId,
        createdAt: r.createdAt,
        user: mapBackendFriend(r.user),
      })),
    }
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
    const res = await fetch(
      `${API_BASE}/api/friend-requests/${requestId}/accept`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      },
    )
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || "Nepavyko patvirtinti kvietimo")
    }
  },

  async rejectRequest(requestId: number, userId: number): Promise<void> {
    const res = await fetch(
      `${API_BASE}/api/friend-requests/${requestId}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      },
    )
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
