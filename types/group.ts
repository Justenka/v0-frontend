// types/group.ts
import type { Member } from "./member"
import type { Transaction } from "./transaction"

/**
 * Grupės modelis fronte – suderintas su DB schema.
 *
 * DB laukų atitikmenys:
 *  - id            ← Grupes.id_grupe
 *  - title         ← Grupes.pavadinimas
 *  - description   ← Grupes.aprasas
 *  - createdAt     ← Grupes.sukurimo_data
 *  - ownerId       ← Grupes.fk_id_vartotojas
 *  - ownerFirstName/ownerLastName ← JOIN iš Vartotojai (owner_vardas, owner_pavarde)
 *  - role          ← Grupes_nariai.role
 *  - memberStatus  ← Grupes_nariai.nario_busena
 *
 * Frontend logika:
 *  - members       – nariai (pvz. iš Grupes_nariai + Vartotojai)
 *  - transactions  – skolos / išlaidos (pvz. iš Skolos)
 *  - balance       – bendras grupės balansas (jei skaičiuosi iš skolų)
 */
export interface Group {
  // Pagrindinė info iš DB
  id: number
  title: string
  description?: string | null
  createdAt?: string | Date
  pavadinimas?: string | null
  // Owner informacija
  ownerId?: number
  ownerFirstName?: string
  ownerLastName?: string

  // Naudotojo (šio prisijungusio) vaidmuo grupėje
  role?: number         // 1 = admin, 0 = member, ir pan. pagal tavo schemą
  memberStatus?: number // 1 = aktyvus, 0 = laukia patvirtinimo, ir t.t.

  // Frontend logika
  members: Member[]
  transactions?: Transaction[]

  // Agreguotas balansas visai grupei (nebūtinas, bet paliekam)
  balance: number
}