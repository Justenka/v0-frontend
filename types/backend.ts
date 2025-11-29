// types/backend.ts

// Kaip useris atrodo BŪTENT iš backend /api/login atsakymo
export interface BackendUser {
  id_vartotojas: number
  vardas: string
  pavarde: string
  el_pastas: string
  valiutos_kodas: number
  sukurimo_data: string              // ateina kaip string iš JSON
  paskutinis_prisijungimas: string
}

export interface BackendGroupForUser {
  id_grupe: number
  pavadinimas: string
  aprasas: string | null
  sukurimo_data: string
  role?: number
  nario_busena?: number
  owner_vardas: string
  owner_pavarde: string
}

export interface LoginResponse {
  user: BackendUser
}