// services/auth-api.ts
import type { BackendUser } from "@/types/backend"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export const authApi = {
  async login(email: string, password: string): Promise<{ user: BackendUser }> {
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
  },

  async register(name: string, email: string, password: string): Promise<{ user: BackendUser }> {
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
  },

  async loginWithGoogle(idToken: string): Promise<{ user: BackendUser; token?: string; avatarUrl?: string }> {
  const res = await fetch(`${API_BASE}/api/login/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.message || "Prisijungimas per Google nepavyko");
  }

  return res.json();
  }


}