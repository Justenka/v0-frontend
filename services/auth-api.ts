// services/auth-api.ts
import type { BackendUser } from "@/types/backend"

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

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

// --- REQUEST PASSWORD RESET ---
async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Nepavyko išsiųsti atkūrimo nuorodos")
  }
}

// --- PASSWORD RESET ---
async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Nepavyko atkurti slaptažodžio")
  }
}

async function uploadAvatar(
  file: File,
  userId: number | string,
): Promise<{ user: BackendUser }> {
  const formData = new FormData()
  formData.append("avatar", file)

  const res = await fetch(`${API_BASE}/api/profile/avatar`, {
    method: "POST",
    headers: {
      "x-user-id": String(userId),
      // !!! NEdedam Content-Type čia – browseris pats uždės multipart boundary
    },
    body: formData,
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.message || "Nepavyko įkelti avataro")
  }

  return res.json()
}

export const authApi = {
  login,
  register,
  loginWithGoogle,
  updateProfile,
  changePassword,
  uploadAvatar,
  requestPasswordReset,
  resetPassword,
}
