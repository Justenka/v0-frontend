// lib/api-clients.ts (ar kur jis pas tave yra)
import {
  mockUserName,
  setMockUserName,
  mockGroups,
  getGroupById,
  addMockGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  addTransaction,
  settleUp,
  deleteMockGroup,
} from "@/lib/mock-data"

// ---- NEW: backend API URL + tipai ----
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export interface BackendUser {
  id_vartotojas: number
  vardas: string
  pavarde: string
  el_pastas: string
  valiutos_kodas: number
  sukurimo_data: Date
  paskutinis_prisijungimas: string
}

export interface LoginResponse {
  user: BackendUser
}

// Simulate network delay for more realistic behavior (tik mockams)
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ---- EXISTING MOCK user API (paliekam, jei kur nors naudoji) ----
export const userApi = {
  // Get the current user's name
  getUserName: async (): Promise<string> => {
    await delay()
    return mockUserName
  },

  // Save the current user's name
  saveUserName: async (name: string): Promise<void> => {
    await delay()
    setMockUserName(name)
  },
}

// ---- NEW: realus backend auth API ----
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      // backend grąžina { message: "..." } – perimam
      const message = data?.message || "Prisijungti nepavyko"
      throw new Error(message)
    }

    return data as LoginResponse
  },

  // čia ateity galėsim dėti register, logout ir pan., jei darysi ant backend
}

// ---- EXISTING MOCK group API (kol kas neliestam) ----
// Ateityje galėsim pridėti realius endpointus (pvz. getGroupsFromBackend)
export const groupApi = {
  // Get all groups (šiuo metu – tik iš mockų)
  getAllGroups: async () => {
    await delay()
    return mockGroups
  },

  // Get a specific group by ID
  getGroup: async (id: number) => {
    await delay()
    return getGroupById(id)
  },

  // Create a new group
  createGroup: async (title: string, userId: string) => {
    await delay()
    return addMockGroup(title, userId)
  },

  // Add a member to a group
  addMember: async (groupId: number, name: string) => {
    await delay()
    const success = addMemberToGroup(groupId, name)
    if (!success) throw new Error("Failed to add member")
    return getGroupById(groupId)
  },

  // Remove a member from a group
  removeMember: async (groupId: number, memberId: number) => {
    await delay()
    const success = removeMemberFromGroup(groupId, memberId)
    if (!success) throw new Error("Failed to remove member")
    return getGroupById(groupId)
  },

  // Add a transaction
  addTransaction: async (
    groupId: number,
    title: string,
    amount: number,
    paidBy: string,
    splitType: string,
    categoryId: string,
  ) => {
    await delay()
    const success = addTransaction(groupId, title, amount, paidBy, splitType, categoryId)
    if (!success) throw new Error("Failed to add transaction")
    return getGroupById(groupId)
  },

  // Settle up a member's balance
  settleUp: async (groupId: number, memberId: number) => {
    await delay()
    const success = settleUp(groupId, memberId)
    if (!success) throw new Error("Failed to settle up")
    return getGroupById(groupId)
  },

  // Delete a group
  deleteGroup: async (groupId: number) => {
    await delay()
    const success = deleteMockGroup(groupId)
    if (!success) throw new Error("Failed to delete group")
    return true
  },
}
