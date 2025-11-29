"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Chrome } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
    await login(email, password)   // jei blogi duomenys -> throw Error
    router.push("/")         // VYKDOM TIK jei login pavyko
  } catch (err: any) {
    setError(err.message || "Prisijungti nepavyko")
  } finally {
    setIsLoading(false)
  }
}

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await loginWithGoogle()
      router.push("/")
    } catch (err) {
      setError("Failed to login with Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Prisijungti</CardTitle>
          <CardDescription>Įveskite savo el. paštą ir slaptažodį</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">El. paštas</Label>
              <Input
                id="email"
                type="email"
                placeholder="vardas@pavyzdys.lt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Slaptažodis</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Jungiamasi..." : "Prisijungti"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Arba</span>
            </div>
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin} disabled={isLoading}>
            <Chrome className="mr-2 h-4 w-4" />
            Prisijungti su Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-600">
            Neturite paskyros?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Registruotis
            </Link>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            Tęsti kaip svečias
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
