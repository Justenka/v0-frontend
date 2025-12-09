// services/auth-api.ts
import type { BackendUser } from "@/types/backend"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

// --- LOGIN ---
async function login(email: string, password: string): Promise<{ user: BackendUser }> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || "Prisijungimas nepavyko")
  }

  return res.json()
}

// --- REGISTER ---
async function register(name: string, email: string, password: string): Promise<{ user: BackendUser }> {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || "Registracija nepavyko")
  }

  return res.json()
}

// --- LOGIN WITH GOOGLE ---
async function loginWithGoogle(
  idToken: string,
): Promise<{ user: BackendUser; token?: string; avatarUrl?: string }> {
  const res = await fetch(`${API_BASE}/api/login/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || "Prisijungimas per Google nepavyko")
  }

  return res.json()
}

// --- UPDATE PROFILE ---
async function updateProfile(
  data: { name: string; email: string },
  userId: number | string,
): Promise<{ user: BackendUser }> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(userId),
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || "Profilio atnaujinimo klaida")
  }

  return res.json()
}

// --- CHANGE PASSWORD ---
async function changePassword(
  currentPassword: string,
  newPassword: string,
  userId: number | string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/profile/password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": String(userId),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || "Slaptažodžio keitimo klaida")
  }

  return res.json()
}

export const authApi = {
  login,
  register,
  loginWithGoogle,
  updateProfile,
  changePassword,
}
