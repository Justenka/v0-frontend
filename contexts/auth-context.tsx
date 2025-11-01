"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser, User } from "@/types/user"
import { mockUsers } from "@/lib/mock-data"

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
    // Mock: Check for stored user session
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)

    // Real implementation with Supabase:
    /*
    import { createBrowserClient } from '@supabase/ssr'
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile from database
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            setUser({
              ...data,
              isAuthenticated: true
            })
          })
      }
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          // Update user state
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
    */
  }, [])

  const login = async (email: string, password: string) => {
    // Find user by email or default to Alex (user id "1")
    const foundUser = mockUsers.find((u) => u.email === email) || mockUsers[0]
    const mockUser: AuthUser = {
      ...foundUser,
      isAuthenticated: true,
    }
    setUser(mockUser)
    localStorage.setItem("auth_user", JSON.stringify(mockUser))

    // Real implementation with Supabase:
    /*
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    setUser({ ...profile, isAuthenticated: true })
    */
  }

  const loginWithGoogle = async () => {
    const mockUser: AuthUser = {
      ...mockUsers[0], // Alex
      isAuthenticated: true,
    }
    setUser(mockUser)
    localStorage.setItem("auth_user", JSON.stringify(mockUser))

    // Real implementation with Supabase:
    /*
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) throw error
    */
  }

  const register = async (name: string, email: string, password: string) => {
    const mockUser: AuthUser = {
      ...mockUsers[0], // Alex
      name, // Use provided name
      email, // Use provided email
      isAuthenticated: true,
    }
    setUser(mockUser)
    localStorage.setItem("auth_user", JSON.stringify(mockUser))

    // Real implementation with Supabase:
    /*
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    
    if (error) throw error
    
    // Create user profile
    await supabase.from('users').insert({
      id: data.user!.id,
      email,
      name
    })
    */
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_user")

    // Real implementation:
    /*
    await supabase.auth.signOut()
    */
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem("auth_user", JSON.stringify(updatedUser))

    // Real implementation:
    /*
    await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
    */
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
