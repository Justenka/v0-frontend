// services/group-api.ts
import type { BackendGroupForUser } from "@/types/backend"
import type { Group } from "@/types/group"
import type { Category } from "@/types/category";
import {
  getGroupById,
  addMemberToGroup,
  removeMemberFromGroup,
  addTransaction,
  settleUp,
  deleteMockGroup,
} from "@/lib/mock-data"
import { UserRole } from "@/types/user";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export const groupApi = {
    // Get a specific group by ID – tikras backend'as
    getGroup: async (groupId: number) => {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}`)

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
        const res = await fetch(`${API_BASE}/api/groups`, {
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
        const res = await fetch(`${API_BASE}/api/groups-by-user/${userId}`)

        const data = await res.json().catch(() => null)

        if (!res.ok) {
        const message = data?.message || "Nepavyko gauti grupių sąrašo"
        throw new Error(message)
        }

        return data as BackendGroupForUser[]
    },

    // Add a member to a group
    addMember: async (groupId: number, name: string) => {
        const success = addMemberToGroup(groupId, name)
        if (!success) throw new Error("Failed to add member")
        return getGroupById(groupId)
    },

    // Remove a member from a group
    removeMember: async (groupId: number, memberId: number) => {
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
        const success = addTransaction(groupId, title, amount, paidBy, splitType, categoryId)
        if (!success) throw new Error("Failed to add transaction")
        return getGroupById(groupId)
    },

    // Settle up a member's balance
    settleUp: async (groupId: number, memberId: number) => {
        const success = settleUp(groupId, memberId)
        if (!success) throw new Error("Failed to settle up")
        return getGroupById(groupId)
    },

    // Delete a group
    deleteGroup: async (groupId: number) => {
        const success = deleteMockGroup(groupId)
        if (!success) throw new Error("Failed to delete group")
        return true
    },

    // Gauti kategorijas (globalias, nes nėra per grupę)
    async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/api/categories`);
    if (!response.ok) {
      throw new Error('Nepavyko gauti kategorijų');
    }
    const data = await response.json();

    // Normalizuojame – visada grąžiname { id: string, name: string }
    return data.map((cat: any) => ({
      id: String(cat.id_kategorija ?? cat.id ?? ""), // saugumas
      name: cat.name ?? cat.pavadinimas ?? "Be pavadinimo",
    }));
  },

  // Jei dar naudojate getCategoriesByGroup – nukreipkite į tą patį
  async getCategoriesByGroup(_groupId: number): Promise<Category[]> {
    return this.getCategories(); // globalios kategorijos
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
        const response = await fetch(`${API_BASE}/api/debts`, {
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
    
    // Gauti visas grupės skolas
    async getDebtsByGroup(groupId: number) {
        const res = await fetch(`${API_BASE}/api/debts-by-group/${groupId}`)
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || "Nepavyko gauti skolų")
        }
        return res.json()
    },

    // Ištrinti skolą (išlaidą)
    async deleteDebt(debtId: number, userId: number): Promise<void> {
        const res = await fetch(`${API_BASE}/api/debts/${debtId}?userId=${userId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-id': String(userId) 
            },
        })

        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || "Nepavyko ištrinti išlaidos")
        }

        return res.json()
    },

    async getUserRoleInGroup(groupId: number, userId: number): Promise<UserRole> {
    const res = await fetch(`${API_BASE}/api/grupes/${groupId}/nariai/${userId}/role`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
   
    if (!res.ok) {
      throw new Error("Nepavyko gauti vartotojo rolės")
    }
     
    const data = await res.json()
    console.log(data.roleText);
    return data.roleText as UserRole
  },



}