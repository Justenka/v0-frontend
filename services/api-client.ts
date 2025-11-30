// lib/api-clients.ts (ar kur jis pas tave yra)
import {
  mockUserName,
  setMockUserName,
  mockGroups,
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
  addTransaction,
  settleUp,
  deleteMockGroup,
} from "@/lib/mock-data"

import type {
  BackendUser,
  BackendGroupForUser,
  LoginResponse,
} from "@/types/backend"

// ---- NEW: backend API URL + tipai ----
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

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
 // Get a specific group by ID – tikras backend'as
getGroup: async (groupId: number) => {
  const res = await fetch(`${API_URL}/api/groups/${groupId}`)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Nepavyko gauti grupės")
  }

  return res.json()
},

  // Create a new group
  createGroupBackend: async (
  title: string,
  ownerId: number,
  description?: string,
): Promise<BackendGroupForUser> => {
  const res = await fetch(`${API_URL}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      ownerId,
    }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.message || "Nepavyko sukurti grupės"
    throw new Error(message)
  }

  return data as BackendGroupForUser
},

// grupės, kuriose prisijungęs useris yra narys (iš DB)
  getUserGroupsBackend: async (
    userId: number,
  ): Promise<BackendGroupForUser[]> => {
    const res = await fetch(`${API_URL}/api/groups-by-user/${userId}`)

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const message = data?.message || "Nepavyko gauti grupių sąrašo"
      throw new Error(message)
    }

    return data as BackendGroupForUser[]
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
  // get categories from backend of debt categories
  async getCategories() {
    const response = await fetch(`${API_URL}/api/categories`);
    if (!response.ok) {
      throw new Error('Nepavyko gauti kategorijų');
    }
    return response.json();
  },

  //Create a new debt
  async createDebt(data: {
    groupId: number;
    title: string;
    description?: string;
    amount: number;
    currencyCode: string;
    paidByUserId: number;
    categoryId?: string;
    splitType: 'equal' | 'percentage' | 'dynamic';
    splits: { userId: number; amount?: number; percentage?: number }[];
    lateFeeAmount?: number;
    lateFeeAfterDays?: number;
  }) {
    const response = await fetch(`${API_URL}/api/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Serverio klaida' }));
      throw new Error(err.message || 'Nepavyko sukurti skolos');
    }

    return response.json();
  },
}
