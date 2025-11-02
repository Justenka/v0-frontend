"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Camera, Save, Lock } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth()
  const router = useRouter()

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // ✅ Populate fields when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
    }
  }, [user])

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  if (!user) {
    return null
  }

  // ✅ Save profile using AuthContext
  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name, email })
      toast.success("Profilis atnaujintas")
    } catch (error) {
      toast.error("Nepavyko atnaujinti profilio")
    }
  }

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Slaptažodžiai nesutampa")
      return
    }

    // Mock change
    toast.success("Slaptažodis pakeistas!")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Mano profilis</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profilio informacija</TabsTrigger>
          <TabsTrigger value="security">Saugumas</TabsTrigger>
        </TabsList>

        {/* ---- Profile Tab ---- */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profilio informacija</CardTitle>
              <CardDescription>Atnaujinkite savo profilio duomenis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <Button variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Keisti nuotrauką
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vardas</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jūsų vardas" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">El. paštas</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jusu@pastas.lt"
                  />
                </div>

                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Išsaugoti pakeitimus
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- Security Tab ---- */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Keisti slaptažodį</CardTitle>
              <CardDescription>Atnaujinkite savo slaptažodį</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Dabartinis slaptažodis</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">Naujas slaptažodis</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Patvirtinti naują slaptažodį</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button onClick={handleChangePassword}>
                <Lock className="h-4 w-4 mr-2" />
                Keisti slaptažodį
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
