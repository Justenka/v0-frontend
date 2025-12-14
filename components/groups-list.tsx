"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context"
import type { BackendGroupForUser } from "@/types/backend"

// Prasiplečiam backend grupės tipą su optional members,
// kad sena balansų logika galėtų likti.
type GroupWithMembers = BackendGroupForUser & {
  members?: { name: string; balance: number }[]
}

export default function GroupsList() {
  const { user, isLoading: authLoading } = useAuth()
  const [groups, setGroups] = useState<GroupWithMembers[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (!user) {
          setGroups([])
          return
        }

        const userId = Number(user.id)
        const data = await groupApi.getUserGroupsBackend(userId)

        // kol kas backend nesiunčia members/balanso,
        // bet tipas leidžia juos turėti ateityje
        setGroups(data as GroupWithMembers[])
      } catch (err) {
        console.error("Failed to load groups:", err)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (user) {
        fetchGroups()
      } else {
        setLoading(false)
      }
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">Kraunama...</CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">
          Norėdami matyti savo grupes, prisijunkite.
        </p>
        <Link href="/login">
          <Button>Prisijungti</Button>
        </Link>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground mb-4">
          Šiuo metu neturite jokių grupių.
        </p>
        <Link href="/groups/new">
          <Button>Sukurti pirmą grupę</Button>
        </Link>
      </div>
    )
  }

  const yourName = user.name // čia vietoj seno yourName iš dialogo

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const yourMember = group.members?.find((m) => m.name === yourName)
        const yourBalance = yourMember?.balance ?? 0

        return (
          <Link href={`/groups/${group.id_grupe}`} key={group.id_grupe}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4 flex justify-between items-center">
                <h3 className="font-medium">{group.pavadinimas}</h3>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}
