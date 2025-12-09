"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser, User } from "@/types/user"
import { mockUsers } from "@/lib/mock-data"
import { authApi} from "@/services/auth-api"
import type { BackendUser } from "@/types/backend"

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
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

  const loginWithGoogle = async (idToken: string) => {
    try {
      const { user: backendUser } = await authApi.loginWithGoogle(idToken)

      const authUser = mapBackendUserToAuthUser(backendUser)
      setUser(authUser)
      localStorage.setItem("auth_user", JSON.stringify(authUser))
    } catch (err) {
      console.error("Google login failed:", err)
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user")
      }
      throw err
    }
  }


  const register = async (name: string, email: string, password: string) => {
    try {
      const { user: backendUser } = await authApi.register(name, email, password)

      const authUser = mapBackendUserToAuthUser(backendUser)
      setUser(authUser)
      localStorage.setItem("auth_user", JSON.stringify(authUser))
    } catch (err) {
      console.error("Register failed:", err)
      // jei nepavyko – išvalom userį, kad nebūtų half-state
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_user")
      }
      throw err
    }
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
