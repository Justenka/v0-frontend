"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { authApi } from "@/services/auth-api"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    try {
      setIsSending(true)
      await authApi.requestPasswordReset(email)
      toast.success("Jei toks el. paštas yra sistemoje, laiškas išsiųstas")
      router.push("/login")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Įvyko klaida siunčiant laišką")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4">
          <h1 className="text-2xl font-bold text-center">Slaptažodžio atkūrimas</h1>
          <p className="text-sm text-gray-600 text-center">
            Įveskite savo el. paštą ir jums bus išsiųsta slaptažodžio atkūrimo nuoroda.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">El. paštas</Label>
              <Input
                id="email"
                type="email"
                placeholder="jusu@pastas.lt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!email || isSending}>
              {isSending ? "Siunčiama..." : "Siųsti atkūrimo nuorodą"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
