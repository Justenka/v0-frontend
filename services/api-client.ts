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
} from "@/lib/mock-data"

// Simulate network delay for more realistic behavior
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

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

export const groupApi = {
  // Get all groups
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
}
