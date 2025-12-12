"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function JoinGroupPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(true)

  const groupId = Number(params.id)
  const token = searchParams.get("token") || ""

  useEffect(() => {
    const run = async () => {
      try {
        setWorking(true)
        setError(null)

        if (!token) {
          setError("Trūksta kvietimo tokeno.")
          return
        }

        if (!user?.id) {
          setError("Prisijunkite, kad galėtumėte prisijungti prie grupės.")
          return
        }

        await groupApi.acceptInvite(groupId, token, Number(user.id))
        router.replace(`/groups/${groupId}`)
      } catch (e: any) {
        setError(e?.message || "Nepavyko prisijungti prie grupės")
      } finally {
        setWorking(false)
      }
    }

    run()
  }, [groupId, token, user?.id, router])

  return (
    <div className="mx-auto max-w-xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Prisijungimas prie grupės</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {working && <p>Jungiama...</p>}
          {!working && !error && <p>Sėkmingai prisijungta. Nukreipiama...</p>}
          {error && (
            <>
              <p className="text-red-600">{error}</p>
              <Button onClick={() => router.replace(`/groups/${groupId}`)}>
                Grįžti į grupę
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
