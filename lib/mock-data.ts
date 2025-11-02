import type { Group } from "@/types/group"
import type { Member } from "@/types/member"
import type { Transaction } from "@/types/transaction"
import type { User, GroupPermission } from "@/types/user"
import type { GroupMessage, PersonalMessage } from "@/types/message"
import type { Notification } from "@/types/notification"
import type { Activity } from "@/types/activity"
import type { Category } from "@/types/category"
import type { Payment } from "@/types/payment"

// Mock user name
export let mockUserName = "Alex"

export const setMockUserName = (name: string) => {
  mockUserName = name
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex",
    email: "alex@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-01-01"),
    friends: ["2", "3", "5", "6", "7"],
  },
  {
    id: "2",
    name: "Sarah",
    email: "sarah@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-01-15"),
    friends: ["1", "3", "4"],
  },
  {
    id: "3",
    name: "Mike",
    email: "mike@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-02-01"),
    friends: ["1", "2", "4", "5"],
  },
  {
    id: "4",
    name: "Jordan",
    email: "jordan@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-02-10"),
    friends: ["2", "3", "5", "6"],
  },
  {
    id: "5",
    name: "Emma",
    email: "emma@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-03-01"),
    friends: ["1", "3", "4", "7"],
  },
  {
    id: "6",
    name: "Taylor",
    email: "taylor@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-03-15"),
    friends: ["1", "4", "7"],
  },
  {
    id: "7",
    name: "Chris",
    email: "chris@example.com",
    avatar: "/placeholder-user.jpg",
    createdAt: new Date("2024-04-01"),
    friends: ["1", "5", "6"],
  },
]

export const mockGroupPermissions: GroupPermission[] = [
  // Weekend Trip to Barcelona
  { groupId: "1", userId: "1", role: "admin" },
  { groupId: "1", userId: "2", role: "member" },
  { groupId: "1", userId: "3", role: "member" },

  // Apartment Expenses
  { groupId: "2", userId: "1", role: "member" },
  { groupId: "2", userId: "4", role: "admin" },
  { groupId: "2", userId: "6", role: "member" },

  // Office Lunch Group
  { groupId: "3", userId: "1", role: "admin" },
  { groupId: "3", userId: "5", role: "member" },
  { groupId: "3", userId: "7", role: "member" },
]

export const mockCategories: Record<string, Category[]> = {
  "1": [
    { id: "c1", name: "Accommodation", groupId: "1", createdBy: "1", createdAt: new Date("2025-01-14") },
    { id: "c2", name: "Food & Dining", groupId: "1", createdBy: "1", createdAt: new Date("2025-01-14") },
    { id: "c3", name: "Transportation", groupId: "1", createdBy: "1", createdAt: new Date("2025-01-14") },
    { id: "c4", name: "Entertainment", groupId: "1", createdBy: "2", createdAt: new Date("2025-01-15") },
  ],
  "2": [
    { id: "c5", name: "Rent", groupId: "2", createdBy: "4", createdAt: new Date("2024-12-01") },
    { id: "c6", name: "Utilities", groupId: "2", createdBy: "4", createdAt: new Date("2024-12-01") },
    { id: "c7", name: "Groceries", groupId: "2", createdBy: "1", createdAt: new Date("2024-12-05") },
  ],
  "3": [
    { id: "c8", name: "Lunch", groupId: "3", createdBy: "1", createdAt: new Date("2025-01-20") },
    { id: "c9", name: "Coffee", groupId: "3", createdBy: "5", createdAt: new Date("2025-01-21") },
  ],
}

export const mockPayments: Record<number, Payment[]> = {
  1: [
    {
      id: "p1",
      transactionId: 1,
      groupId: 1,
      fromMemberId: 2,
      fromMemberName: "Sarah",
      toMemberId: 1,
      toMemberName: "Alex",
      amount: 80.0,
      currency: "EUR",
      date: new Date("2025-01-16T10:30:00"),
      note: "Hotel payment",
    },
    {
      id: "p2",
      transactionId: 2,
      groupId: 1,
      fromMemberId: 3,
      fromMemberName: "Mike",
      toMemberId: 2,
      toMemberName: "Sarah",
      amount: 29.17,
      currency: "EUR",
      date: new Date("2025-01-17T14:20:00"),
      note: "Dinner share",
    },
  ],
  2: [
    {
      id: "p3",
      transactionId: 5,
      groupId: 2,
      fromMemberId: 4,
      fromMemberName: "Alex",
      toMemberId: 5,
      toMemberName: "Jordan",
      amount: 500.0,
      currency: "EUR",
      date: new Date("2025-01-02T09:00:00"),
      note: "Rent payment",
    },
    {
      id: "p4",
      transactionId: 6,
      groupId: 2,
      fromMemberId: 4,
      fromMemberName: "Alex",
      toMemberId: 6,
      toMemberName: "Taylor",
      amount: 40.0,
      currency: "EUR",
      date: new Date("2025-01-06T15:30:00"),
      note: "Electricity bill share",
    },
  ],
  3: [],
}

export const mockGroupMessages: Record<string, GroupMessage[]> = {
  "1": [
    {
      id: "gm1",
      groupId: "1",
      senderId: "1",
      senderName: "Alex",
      content: "Hey everyone! Just booked the hotel for Barcelona!",
      timestamp: new Date("2025-01-14T10:30:00"),
      read: true,
    },
    {
      id: "gm2",
      groupId: "1",
      senderId: "2",
      senderName: "Sarah",
      content: "Awesome! Can't wait for the trip!",
      timestamp: new Date("2025-01-14T11:15:00"),
      read: true,
    },
    {
      id: "gm3",
      groupId: "1",
      senderId: "3",
      senderName: "Mike",
      content: "Should we book the museum tickets in advance?",
      timestamp: new Date("2025-01-14T14:20:00"),
      read: true,
    },
    {
      id: "gm4",
      groupId: "1",
      senderId: "1",
      senderName: "Alex",
      content: "Good idea! I'll check the prices online.",
      timestamp: new Date("2025-01-14T15:00:00"),
      read: true,
    },
  ],
  "2": [
    {
      id: "gm5",
      groupId: "2",
      senderId: "4",
      senderName: "Jordan",
      content: "Rent is due next week, just a reminder!",
      timestamp: new Date("2025-01-20T09:00:00"),
      read: true,
    },
    {
      id: "gm6",
      groupId: "2",
      senderId: "1",
      senderName: "Alex",
      content: "Thanks! I'll transfer it tomorrow.",
      timestamp: new Date("2025-01-20T10:15:00"),
      read: true,
    },
  ],
  "3": [
    {
      id: "gm7",
      groupId: "3",
      senderId: "5",
      senderName: "Emma",
      content: "Pizza for lunch today?",
      timestamp: new Date("2025-01-25T11:30:00"),
      read: false,
    },
    {
      id: "gm8",
      groupId: "3",
      senderId: "7",
      senderName: "Chris",
      content: "I'm in! What time?",
      timestamp: new Date("2025-01-25T11:35:00"),
      read: false,
    },
  ],
}

export const mockPersonalMessages: PersonalMessage[] = [
  {
    id: "pm1",
    senderId: "2",
    senderName: "Sarah",
    recipientId: "1",
    content: "Hey Alex! Thanks for organizing the Barcelona trip!",
    timestamp: new Date("2025-01-15T16:30:00"),
    read: true,
  },
  {
    id: "pm2",
    senderId: "1",
    senderName: "Alex",
    recipientId: "2",
    content: "No problem! It's going to be amazing!",
    timestamp: new Date("2025-01-15T17:00:00"),
    read: true,
  },
  {
    id: "pm3",
    senderId: "2",
    senderName: "Sarah",
    recipientId: "1",
    content: "Did you check the weather forecast?",
    timestamp: new Date("2025-01-16T09:00:00"),
    read: true,
  },
  {
    id: "pm4",
    senderId: "3",
    senderName: "Mike",
    recipientId: "1",
    content: "Can you send me the hotel details?",
    timestamp: new Date("2025-01-16T10:00:00"),
    read: false,
  },
  {
    id: "pm5",
    senderId: "5",
    senderName: "Emma",
    recipientId: "1",
    content: "Hey! Want to grab coffee this weekend?",
    timestamp: new Date("2025-01-22T14:30:00"),
    read: false,
  },
  {
    id: "pm6",
    senderId: "6",
    senderName: "Taylor",
    recipientId: "1",
    content: "Thanks for covering the groceries last week!",
    timestamp: new Date("2025-01-21T18:00:00"),
    read: true,
  },
  {
    id: "pm7",
    senderId: "1",
    senderName: "Alex",
    recipientId: "6",
    content: "No worries! You can get it next time 😊",
    timestamp: new Date("2025-01-21T18:15:00"),
    read: true,
  },
  {
    id: "pm8",
    senderId: "7",
    senderName: "Chris",
    recipientId: "1",
    content: "Are we still on for lunch tomorrow?",
    timestamp: new Date("2025-01-24T16:45:00"),
    read: true,
  },
  {
    id: "pm9",
    senderId: "1",
    senderName: "Alex",
    recipientId: "7",
    content: "Yes! See you at 12:30",
    timestamp: new Date("2025-01-24T17:00:00"),
    read: true,
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    userId: "1",
    type: "new_expense",
    title: "New Expense Added",
    message: 'Sarah added "Dinner at La Rambla" (€87.50)',
    read: false,
    timestamp: new Date("2025-01-16T20:30:00"),
    actionUrl: "/groups/1",
  },
  {
    id: "n2",
    userId: "1",
    type: "payment_reminder",
    title: "Payment Reminder",
    message: "You owe €125.00 in Apartment Expenses",
    read: false,
    timestamp: new Date("2025-01-20T09:00:00"),
    actionUrl: "/groups/2",
  },
  {
    id: "n3",
    userId: "1",
    type: "group_message",
    title: "New Group Message",
    message: "Emma sent a message in Office Lunch Group",
    read: false,
    timestamp: new Date("2025-01-25T11:30:00"),
    actionUrl: "/groups/3/chat",
  },
  {
    id: "n4",
    userId: "1",
    type: "personal_message",
    title: "New Message from Mike",
    message: "Can you send me the hotel details?",
    read: false,
    timestamp: new Date("2025-01-16T10:00:00"),
    actionUrl: "/messages/3",
  },
  {
    id: "n5",
    userId: "1",
    type: "friend_request",
    title: "Friend Request",
    message: "Jordan sent you a friend request",
    read: true,
    timestamp: new Date("2025-01-10T14:00:00"),
    actionUrl: "/friends",
  },
]

// Mock activity log
export const mockActivities: Activity[] = [
  {
    id: "a1",
    groupId: "1",
    userId: "1",
    userName: "Alex",
    type: "group_created",
    description: 'Sukūrė grupę "Weekend Trip to Barcelona"',
    timestamp: new Date("2025-01-14T09:00:00"),
  },
  {
    id: "a2",
    groupId: "1",
    userId: "1",
    userName: "Alex",
    type: "member_added",
    description: "Pridėjo Sarah į grupę",
    timestamp: new Date("2025-01-14T09:15:00"),
  },
  {
    id: "a3",
    groupId: "1",
    userId: "1",
    userName: "Alex",
    type: "member_added",
    description: "Pridėjo Mike į grupę",
    timestamp: new Date("2025-01-14T09:20:00"),
  },
  {
    id: "a4",
    groupId: "1",
    userId: "1",
    userName: "Alex",
    type: "expense_added",
    description: 'Pridėjo išlaidą "Hotel Booking" (€240.00)',
    timestamp: new Date("2025-01-15T10:30:00"),
    metadata: { amount: 240, currency: "EUR" },
  },
  {
    id: "a5",
    groupId: "1",
    userId: "2",
    userName: "Sarah",
    type: "expense_added",
    description: 'Pridėjo išlaidą "Dinner at La Rambla" (€87.50)',
    timestamp: new Date("2025-01-16T20:30:00"),
    metadata: { amount: 87.5, currency: "EUR" },
  },
  {
    id: "a6",
    groupId: "1",
    userId: "3",
    userName: "Mike",
    type: "expense_added",
    description: 'Pridėjo išlaidą "Museum Tickets" (€45.00)',
    timestamp: new Date("2025-01-17T14:00:00"),
    metadata: { amount: 45, currency: "EUR" },
  },
  {
    id: "a7",
    groupId: "2",
    userId: "4",
    userName: "Jordan",
    type: "group_created",
    description: 'Sukūrė grupę "Apartment Expenses"',
    timestamp: new Date("2024-12-01T10:00:00"),
  },
  {
    id: "a8",
    groupId: "2",
    userId: "4",
    userName: "Jordan",
    type: "expense_added",
    description: 'Pridėjo išlaidą "Monthly Rent" (€1,500.00)',
    timestamp: new Date("2025-01-01T09:00:00"),
    metadata: { amount: 1500, currency: "EUR" },
  },
  {
    id: "a9",
    groupId: "3",
    userId: "1",
    userName: "Alex",
    type: "group_created",
    description: 'Sukūrė grupę "Office Lunch Group"',
    timestamp: new Date("2025-01-20T11:00:00"),
  },
  {
    id: "a10",
    groupId: "3",
    userId: "5",
    userName: "Emma",
    type: "expense_added",
    description: 'Pridėjo išlaidą "Pizza Lunch" (€48.00)',
    timestamp: new Date("2025-01-22T12:30:00"),
    metadata: { amount: 48, currency: "EUR" },
  },
]

// Mock groups with members and transactions
export const mockGroups: Group[] = [
  {
    id: 1,
    title: "Weekend Trip to Barcelona",
    balance: 0,
    members: [
      { id: 1, name: "Alex", balance: 45.5 },
      { id: 2, name: "Sarah", balance: -12.3 },
      { id: 3, name: "Mike", balance: -33.2 },
    ],
  },
  {
    id: 2,
    title: "Apartment Expenses",
    balance: 0,
    members: [
      { id: 4, name: "Alex", balance: -125.0 },
      { id: 5, name: "Jordan", balance: 75.0 },
      { id: 6, name: "Taylor", balance: 50.0 },
    ],
  },
  {
    id: 3,
    title: "Office Lunch Group",
    balance: 0,
    members: [
      { id: 7, name: "Alex", balance: 0 },
      { id: 8, name: "Emma", balance: 0 },
      { id: 9, name: "Chris", balance: 0 },
    ],
  },
]

// Mock transactions for each group
export const mockTransactions: Record<number, Transaction[]> = {
  1: [
    {
      id: 1,
      title: "Hotel Booking",
      amount: 240.0,
      paidBy: "Alex",
      date: new Date("2025-01-15"),
      splitType: "Equally among 3 people",
      categoryId: "c1",
    },
    {
      id: 2,
      title: "Dinner at La Rambla",
      amount: 87.5,
      paidBy: "Sarah",
      date: new Date("2025-01-16"),
      splitType: "Equally among 3 people",
      categoryId: "c2",
    },
    {
      id: 3,
      title: "Museum Tickets",
      amount: 45.0,
      paidBy: "Mike",
      date: new Date("2025-01-17"),
      splitType: "Equally among 3 people",
      categoryId: "c4",
    },
    {
      id: 4,
      title: "Taxi to Airport",
      amount: 35.0,
      paidBy: "Alex",
      date: new Date("2025-01-18"),
      splitType: "Equally among 3 people",
      categoryId: "c3",
    },
  ],
  2: [
    {
      id: 5,
      title: "Monthly Rent",
      amount: 1500.0,
      paidBy: "Jordan",
      date: new Date("2025-01-01"),
      splitType: "Equally among 3 people",
      categoryId: "c5",
    },
    {
      id: 6,
      title: "Electricity Bill",
      amount: 120.0,
      paidBy: "Taylor",
      date: new Date("2025-01-05"),
      splitType: "Equally among 3 people",
      categoryId: "c6",
    },
    {
      id: 7,
      title: "Internet & Cable",
      amount: 80.0,
      paidBy: "Jordan",
      date: new Date("2025-01-10"),
      splitType: "Equally among 3 people",
      categoryId: "c6",
    },
    {
      id: 8,
      title: "Groceries",
      amount: 95.0,
      paidBy: "Alex",
      date: new Date("2025-01-20"),
      splitType: "Equally among 3 people",
      categoryId: "c7",
    },
  ],
  3: [
    {
      id: 9,
      title: "Pizza Lunch",
      amount: 48.0,
      paidBy: "Emma",
      date: new Date("2025-01-22"),
      splitType: "Equally among 3 people",
      categoryId: "c8",
    },
    {
      id: 10,
      title: "Coffee Run",
      amount: 16.0,
      paidBy: "Chris",
      date: new Date("2025-01-23"),
      splitType: "Equally among 3 people",
      categoryId: "c9",
    },
    {
      id: 11,
      title: "Sushi Takeout",
      amount: 64.0,
      paidBy: "Alex",
      date: new Date("2025-01-24"),
      splitType: "Equally among 3 people",
      categoryId: "c8",
    },
    {
      id: 12,
      title: "Sandwich Shop",
      amount: 32.0,
      paidBy: "Alex",
      date: new Date("2025-01-25"),
      splitType: "Equally among 3 people",
      categoryId: "c8",
    },
  ],
}

// Helper function to get a group by ID
export const getGroupById = (id: number): Group | undefined => {
  const group = mockGroups.find((g) => g.id === id)
  if (!group) return undefined

  return {
    ...group,
    transactions: mockTransactions[id] || [],
  } as Group & { transactions: Transaction[] }
}

// Helper function to add a new group
let nextGroupId = 4
export const addMockGroup = (title: string, creatorId = "1"): Group => {
  const creator = mockUsers.find((u) => u.id === creatorId)
  const creatorName = creator?.name || "Unknown"

  const newGroup: Group = {
    id: nextGroupId,
    title,
    balance: 0,
    members: [
      {
        id: nextMemberId++,
        name: creatorName,
        balance: 0,
      },
    ],
  }

  // Add group permission for creator as admin
  mockGroupPermissions.push({
    groupId: String(nextGroupId),
    userId: creatorId,
    role: "admin",
  })

  // Add activity log for group creation
  mockActivities.push({
    id: `a${mockActivities.length + 1}`,
    groupId: String(nextGroupId),
    userId: creatorId,
    userName: creatorName,
    type: "group_created",
    description: `Sukūrė grupę "${title}"`,
    timestamp: new Date(),
  })

  mockGroups.push(newGroup)
  mockTransactions[newGroup.id] = []
  mockCategories[String(newGroup.id)] = []
  mockGroupMessages[String(newGroup.id)] = []

  nextGroupId++
  return newGroup
}

// Helper function to add a member to a group
let nextMemberId = 11
export const addMemberToGroup = (groupId: number, name: string): boolean => {
  const group = mockGroups.find((g) => g.id === groupId)
  if (!group) return false

  const newMember: Member = {
    id: nextMemberId++,
    name,
    balance: 0,
  }
  group.members.push(newMember)
  return true
}

// Helper function to remove a member from a group
export const removeMemberFromGroup = (groupId: number, memberId: number): boolean => {
  const group = mockGroups.find((g) => g.id === groupId)
  if (!group) return false

  group.members = group.members.filter((m) => m.id !== memberId)
  return true
}

// Helper function to add a transaction
let nextTransactionId = 13
export const addTransaction = (
  groupId: number,
  title: string,
  amount: number,
  paidBy: string,
  splitType: string,
  categoryId: string,
): boolean => {
  if (!mockTransactions[groupId]) return false

  const newTransaction: Transaction = {
    id: nextTransactionId++,
    title,
    amount,
    paidBy,
    date: new Date(),
    splitType,
    categoryId,
  }

  mockTransactions[groupId].unshift(newTransaction)

  // Update member balances
  const group = mockGroups.find((g) => g.id === groupId)
  if (group) {
    const numMembers = group.members.length
    const amountPerPerson = amount / numMembers

    group.members.forEach((member) => {
      if (member.name === paidBy) {
        member.balance += amount - amountPerPerson
      } else {
        member.balance -= amountPerPerson
      }
    })
  }

  return true
}

// Helper function to settle up
export const settleUp = (groupId: number, memberId: number): boolean => {
  const group = mockGroups.find((g) => g.id === groupId)
  if (!group) return false

  const member = group.members.find((m) => m.id === memberId)
  if (!member) return false

  member.balance = 0
  return true
}
