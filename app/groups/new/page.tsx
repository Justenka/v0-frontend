"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeftCircle } from "lucide-react"
import { groupApi } from "@/services/api-client"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function NewGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (!user) {
      toast.error("Please login before creating a group")
      router.push("/login")
      return
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Creating group:", title)
      const newGroup = await groupApi.createGroup(title, user.id)
      console.log("[v0] Group created successfully:", newGroup)
      toast.success("Group created successfully!")
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to create group:", error)
      toast.error("Failed to create group. Please try again.")
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
            Sukurkite grupę, kad galėtumėte pradėti stebėti išlaidas su draugais, kambariokais ar kolegomis.
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
            <Button variant="outline" type="button" onClick={() => router.push("/")} disabled={isSubmitting}>
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
