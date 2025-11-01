"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "lt"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    groups: "Groups",
    friends: "Friends",
    messages: "Messages",
    notifications: "Notifications",
    history: "History",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",

    // Groups
    createGroup: "Create Group",
    groupName: "Group Name",
    newGroup: "New Group",
    myGroups: "My Groups",
    groupSettings: "Group Settings",

    // Members
    members: "Members",
    addMember: "Add Member",
    removeMember: "Remove Member",
    inviteMember: "Invite Member",

    // Transactions
    transactions: "Transactions",
    addTransaction: "Add Transaction",
    newExpense: "New Expense",
    amount: "Amount",
    paidBy: "Paid By",
    splitType: "Split Type",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search",
    filter: "Filter",
    loading: "Loading...",

    // Roles
    admin: "Admin",
    member: "Member",
    guest: "Guest",
  },
  lt: {
    // Navigation
    groups: "Grupės",
    friends: "Draugai",
    messages: "Žinutės",
    notifications: "Pranešimai",
    history: "Istorija",
    settings: "Nustatymai",
    profile: "Profilis",
    logout: "Atsijungti",

    // Groups
    createGroup: "Sukurti grupę",
    groupName: "Grupės pavadinimas",
    newGroup: "Nauja grupė",
    myGroups: "Mano grupės",
    groupSettings: "Grupės nustatymai",

    // Members
    members: "Nariai",
    addMember: "Pridėti narį",
    removeMember: "Pašalinti narį",
    inviteMember: "Pakviesti narį",

    // Transactions
    transactions: "Transakcijos",
    addTransaction: "Pridėti transakciją",
    newExpense: "Nauja išlaida",
    amount: "Suma",
    paidBy: "Sumokėjo",
    splitType: "Padalijimo tipas",

    // Common
    save: "Išsaugoti",
    cancel: "Atšaukti",
    delete: "Ištrinti",
    edit: "Redaguoti",
    search: "Ieškoti",
    filter: "Filtruoti",
    loading: "Kraunama...",

    // Roles
    admin: "Administratorius",
    member: "Narys",
    guest: "Svečias",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    // Load language from localStorage
    const saved = localStorage.getItem("language") as Language
    if (saved && (saved === "en" || saved === "lt")) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
