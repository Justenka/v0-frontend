"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeftCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { groupApi } from "@/services/api-client"
import { useAuth } from "@/contexts/auth-context"

export default function NewGroupPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (!user) {
      toast.error("Pirmiausia prisijunkite, kad galėtumėte kurti grupes")
      router.push("/login")
      return
    }

    const ownerId = Number(user.id)
    if (Number.isNaN(ownerId)) {
      console.error("[v0] Owner ID is not a valid number:", user.id)
      toast.error("Įvyko klaida nustatant vartotojo ID")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Creating group:", { title, ownerId })

      // jei neturi aprašo lauko – nesiunčiam jo visai (undefined)
      const newGroup = await groupApi.createGroupBackend(title, ownerId)

      console.log("[v0] Group created successfully:", newGroup)
      toast.success("Grupė sėkmingai sukurta!")

      // Pas tave "/" atrodo yra grupių sąrašas (sprendžiant iš teksto),
      // jei norėsi – gali pakeisti į "/groups"
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to create group:", error)
      toast.error("Nepavyko sukurti grupės. Bandykite dar kartą.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-md py-10 mx-auto px-4">
      <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-6">
        <ArrowLeftCircle className="mr-2 h-4 w-4" />
        Atgal į grupes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Sukurkite naują grupę</CardTitle>
          <CardDescription>
            Sukurkite grupę, kad galėtumėte pradėti sekti išlaidas su draugais, kambariokais ar kolegomis.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="title">Grupės pavadinimas</Label>
                <Input
                  id="title"
                  placeholder="pvz., Kambariokai, Kelionė į Paryžių, Pietūs biure"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/")}
              disabled={isSubmitting}
            >
              Atšaukti
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !user}>
              {isSubmitting ? "Kuriama..." : "Sukurti grupę"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
