// services/group-api.ts
import type { BackendGroupForUser } from "@/types/backend"
import type { Group } from "@/types/group"
import type { Category } from "@/types/category";
import type { Transaction, TransactionWithSplits } from "@/types/transaction";
import type { Payment } from "@/types/payment";
import type { Activity } from "@/types/activity"
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

      async convertCurrency(
    amount: number, 
    fromCurrencyId: number, 
    toCurrencyId: number
  ): Promise<number> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    
    const res = await fetch(
      `${API_BASE}/api/valiutos/convert?amount=${amount}&fromCurrency=${fromCurrencyId}&toCurrency=${toCurrencyId}`
    )
    
    if (!res.ok) {
      throw new Error("Nepavyko konvertuoti valiutos")
    }
    
    const data = await res.json()
    console.log("getUserRoleInGroup response:", data)
    return data.amount
  },

  async getAllCurrencies(): Promise<Array<{ id_valiuta: number; name: string; santykis: number }>> {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
    
    const res = await fetch(`${API_BASE}/api/valiutos`)
    
    if (!res.ok) {
      throw new Error("Nepavyko gauti valiutų")
    }
    
    return res.json()
  },

  
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
    /*addMember: async (groupId: number, name: string) => {
        const success = addMemberToGroup(groupId, name)
        if (!success) throw new Error("Failed to add member")
        return getGroupById(groupId)
    },*/

        // Add a member to a group
    addMember: async (groupId: number, nameOrEmail: string, actorId: number) => {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}/members`, {
    method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": String(actorId) },
        body: JSON.stringify({
        email: nameOrEmail.includes("@") ? nameOrEmail : undefined,
        name: !nameOrEmail.includes("@") ? nameOrEmail : undefined,
    }),
})

    const data = await res.json().catch(() => null)

    if (!res.ok) {
        const message = data?.message || "Nepavyko pridėti nario"
        throw new Error(message)
    }

  return data.id_grupe ? data : await groupApi.getGroup(groupId)
},

leaveGroup: async (groupId: number, actorId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/leave`, {
    method: "POST",
    headers: { "x-user-id": String(actorId) },
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.message || "Nepavyko palikti grupės")
  return data as { ok: boolean }
},

createInvite: async (groupId: number, actorId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(actorId),
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.message || "Nepavyko sukurti kvietimo")
  }

  return data as { token: string; expiresAt: string }
},

acceptInvite: async (groupId: number, token: string, actorId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(actorId),
    },
    body: JSON.stringify({ token }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.message || "Nepavyko prisijungti prie grupės")
  }

  return data as { ok: boolean; alreadyMember?: boolean }
},

inviteFriendToGroup: async (groupId: number, toUserId: number, actorId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/invite-friend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(actorId),
    },
    body: JSON.stringify({ toUserId }),
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.message || "Nepavyko išsiųsti kvietimo į grupę")
  }

  return data
},

acceptGroupInvite: async (inviteId: number, userId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/invites/${inviteId}/accept`, {
    method: "POST",
    headers: { "x-user-id": String(userId) },
  })
  if (!res.ok) throw new Error("Nepavyko priimti kvietimo")
},

declineGroupInvite: async (inviteId: number, userId: number) => {
  const res = await fetch(`${API_BASE}/api/groups/invites/${inviteId}/decline`, {
    method: "POST",
    headers: { "x-user-id": String(userId) },
  })
  if (!res.ok) throw new Error("Nepavyko atmesti kvietimo")
},



    // Remove a member from a group
    /*removeMember: async (groupId: number, memberId: number) => {
        const success = removeMemberFromGroup(groupId, memberId)
        if (!success) throw new Error("Failed to remove member")
        return getGroupById(groupId)
    },*/

    // Remove a member from a group
    removeMember: async (groupId: number, memberId: number, actorId: number) => {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}/members/${memberId}`, {
            method: "DELETE",
            headers: { "x-user-id": String(actorId) },
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
            const message = data?.message || "Nepavyko pašalinti nario"
            throw new Error(message)
        }

        // Grąžinam atnaujintą grupę
        return await groupApi.getGroup(groupId)
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
    /*eleteGroup: async (groupId: number) => {
        const success = deleteMockGroup(groupId)
        if (!success) throw new Error("Failed to delete group")
        return true
    },*/

    // Delete a group
    deleteGroup: async (groupId: number) => {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}`, {
            method: "DELETE",
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
            const message = data?.message || "Nepavyko ištrinti grupės"
            throw new Error(message)
        }

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
    }, actorId: number,) {
        const response = await fetch(`${API_BASE}/api/debts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': String(actorId),},
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Serverio klaida' }));
            return Promise.reject(new Error(err.message || 'Nepavyko sukurti skolos'));
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
    cache: "no-store",
  })

  if (!res.ok) throw new Error("Nepavyko gauti rolės")

  const data = await res.json()

  switch (Number(data.role)) {
    case 3:
      return "admin"
    case 2:
      return "member"
    case 1:
      return "guest"
    default:
      return "member"
  }
},


    updateMemberRole: async (
        groupId: number,
        memberUserId: number,
        newRole: "admin" | "member" | "guest",
        actorId: number
        ) => {
        const roleMap = { guest: 1, member: 2, admin: 3 } as const

        const res = await fetch(`${API_BASE}/api/groups/${groupId}/members/${memberUserId}/role`, {
            method: "PUT",
            headers: {
            "Content-Type": "application/json",
            "x-user-id": String(actorId),
            },
            body: JSON.stringify({ role: roleMap[newRole] }),
        })

        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.message || "Nepavyko pakeisti rolės")
        return data as { ok: boolean; transferred?: boolean }
        },


    //------------------------------------------------------------------------------------------------------------------------

    // Get specific debt with splits
    async getDebt(debtId: number): Promise<TransactionWithSplits> {
        const res = await fetch(`${API_BASE}/api/debts/${debtId}`)
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || "Nepavyko gauti skolos")
        }
        
        return res.json()
    },

    // Update debt (edit transaction)
async updateDebt(
    debtId: number,
    data: {
        title: string;
        categoryId?: string;
        userId: number;
    }
) {
    const res = await fetch(`${API_BASE}/api/debts/${debtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Nepavyko atnaujinti skolos")
    }

    return res.json()
},

    // Get balances for a user in a group
    async getUserBalances(groupId: number, userId: number): Promise<{
        userId: number;
        userName: string;
        amount: number;
        amountEUR: number;
        currency: string;
        kursasEurui: number;
        type: 'owes_me' | 'i_owe';
    }[]> {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}/balances/${userId}`)
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || "Nepavyko gauti balansų")
        }
        
        return res.json()
    },

    // Make a partial payment
    async makePayment(data: {
    groupId: number;
    fromUserId: number;
    toUserId: number;
    amount: number;
    currencyCode?: string;
    note?: string;
    }): Promise<{ message: string; amountPaid: number }> {
    const res = await fetch(`${API_BASE}/api/payments`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        "x-user-id": String(data.fromUserId),
        },
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Nepavyko įrašyti mokėjimo")
    }

    return res.json()
    },

    // Get payment history
    async getPaymentHistory(groupId: number): Promise<Payment[]> {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}/payments`)
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.message || "Nepavyko gauti mokėjimų istorijos")
        }
        
        return res.json()
    },

    async getGroupHistory(groupId: number): Promise<Activity[]> {
        const res = await fetch(`${API_BASE}/api/groups/${groupId}/history`, {
            cache: "no-store",
        })

        if (!res.ok) {
            throw new Error("Nepavyko gauti grupės istorijos")
        }

        const data = await res.json()

        return (data.activities || []).map((a: any) => {
            // normalizuojam avatar kelią taip pat kaip ir kitur
            let avatar: string | null = a.userAvatar ?? null

            if (avatar) {
            // jeigu DB saugo tik failo pavadinimą
            if (!avatar.startsWith("/")) {
                avatar = `/uploads/avatars/${avatar}`
            }
            // jeigu dar nėra pilno hosto
            if (!avatar.startsWith("http://") && !avatar.startsWith("https://")) {
                avatar = `${API_BASE}${avatar}`
            }
            }

            return {
            id: a.id,
            groupId: a.groupId,
            userId: a.userId ?? null,
            userName: a.userName,
            userAvatar: avatar,
            type: a.type,
            description: a.description,
            timestamp: new Date(a.timestamp),
            metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
            } as Activity
        })
    },

    async checkDuplicateDebtName(
    groupId: number, 
    title: string, 
    excludeDebtId?: number
  ): Promise<{ exists: boolean; debtId?: number }> {
    const params = new URLSearchParams({
      groupId: String(groupId),
      title: title.trim(),
    });
    
    if (excludeDebtId) {
      params.append('excludeDebtId', String(excludeDebtId));
    }

    const res = await fetch(`${API_BASE}/api/debts/check-duplicate?${params}`);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Nepavyko patikrinti dublikatų");
    }
    
    return res.json();
  },

}