"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { authApi } from "@/services/auth-api"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const router = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error("Trūksta atkūrimo tokeno")
      return
    }
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Slaptažodžiai nesutampa")
      return
    }

    try {
      setIsSubmitting(true)
      await authApi.resetPassword(token, newPassword)
      toast.success("Slaptažodis sėkmingai pakeistas")
      router.push("/login")
      } catch (err: any) {
        console.error(err)
        const msg = err.message || "Nepavyko atkurti slaptažodžio"
        toast.error(msg)

        // jei tokenas pasenęs – siunčiam vartotoją susigeneruoti naują
        if (msg.includes("Tokeno galiojimo laikas pasibaigė")) {
          router.replace("/forgot-password")
        }
      } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-4">
          <h1 className="text-2xl font-bold text-center">Nustatyti naują slaptažodį</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Naujas slaptažodis</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Pakartokite slaptažodį</Label>
              <Input
                id="password2"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? "Saugoma..." : "Išsaugoti naują slaptažodį"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
