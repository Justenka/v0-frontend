"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser, User } from "@/types/user"
import { mockUsers } from "@/lib/mock-data"
import { authApi} from "@/services/api-client"
import type { BackendUser } from "@/types/backend"

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updates: Partial<User>) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
  const storedUser =
    typeof window !== "undefined" ? localStorage.getItem("auth_user") : null

  if (storedUser) {
    const parsed = JSON.parse(storedUser) as AuthUser

    if (parsed.createdAt) {
      parsed.createdAt = new Date(parsed.createdAt)
    }
    if (parsed.lastLoginAt) {
      parsed.lastLoginAt = new Date(parsed.lastLoginAt)
    }

    setUser(parsed)
  }
  setIsLoading(false)
}, [])

  // Helper: map backend user -> AuthUser shape
  function mapBackendUserToAuthUser(backendUser: BackendUser): AuthUser {
    return {
      id: backendUser.id_vartotojas.toString(),
      name: `${backendUser.vardas} ${backendUser.pavarde}`,
      email: backendUser.el_pastas,
      avatar: undefined, // kol kas neturim
      createdAt: new Date(backendUser.sukurimo_data), // iš DATE/string → Date
      lastLoginAt: new Date(backendUser.paskutinis_prisijungimas),
      friends: [], // backend kol kas neteikia
      isAuthenticated: true,
    }
  }

  const login = async (email: string, password: string) => {
  try {
    const { user: backendUser } = await authApi.login(email, password)

    const authUser = mapBackendUserToAuthUser(backendUser)
    setUser(authUser)
    localStorage.setItem("auth_user", JSON.stringify(authUser))
  } catch (err) {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
    }
    console.error("Login failed:", err)
    throw err
  }
}

  const loginWithGoogle = async () => {
    // kol kas vis dar mock
    const mockUser: AuthUser = {
      ...mockUsers[0], // Alex
      isAuthenticated: true,
    }
    setUser(mockUser)
    localStorage.setItem("auth_user", JSON.stringify(mockUser))
  }

  const register = async (name: string, email: string, password: string) => {
    // kol kas – tik mock
    const mockUser: AuthUser = {
      ...mockUsers[0],
      name,
      email,
      isAuthenticated: true,
    }
    setUser(mockUser)
    localStorage.setItem("auth_user", JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user")
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem("auth_user", JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
