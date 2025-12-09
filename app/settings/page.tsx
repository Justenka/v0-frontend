"use client"
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

// Tipai pagal tavo DB
type Valiuta = {
  id_valiuta: number
  name: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [groupInvites, setGroupInvites] = useState(true)
  const [newExpenses, setNewExpenses] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(true)
  const [messages, setMessages] = useState(true)

// Valiutų būsena
  const [valiutos, setValiutos] = useState<Valiuta[]>([])
  const [selectedValiuta, setSelectedValiuta] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

// Užkrauname valiutas ir vartotojo pasirinkimą
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // 1. Užkrauname visas valiutas
        const valResp = await fetch(`${API_BASE}/api/valiutos`)
        const valData = await valResp.json()
        setValiutos(valData)

        // 2. Užkrauname vartotojo dabartinę valiutą
        const userResp = await fetch(`${API_BASE}/api/vartotojai/${user.id}`)
        const userData = await userResp.json()

        // userData.valiutos_kodas yra id_valiuta (pvz. 1, 2, 3)
        setSelectedValiuta(String(userData.valiutos_kodas))
      } catch (err) {
        console.error(err)
        toast.error("Nepavyko užkrauti nustatymų")
      }
    }

    if (!isLoading && user) {
      void fetchData()
    }
  }, [isLoading, user])

  // Išsaugojimo funkcija – tik valiutai (kol kas)
  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/vartotojai/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valiutos_kodas: Number(selectedValiuta),
        }),
      })

      if (!res.ok) throw new Error("Nepavyko išsaugoti")

      toast.success("Nustatymai išsaugoti")
    } catch (err) {
      toast.error("Klaida saugant valiutą")
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading būsena – rodomas centruotas tekstas, kaip ir kitur
  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  // Jei vartotojas neautentifikuotas – grąžiname null (router jau nukreipė, bet saugumui)
  if (!user) {
    return null
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Nustatymai</h1>

      <div className="space-y-6">
        {/* Valiutos pasirinkimas */}
        <Card>
          <CardHeader>
            <CardTitle>Pagrindinė valiuta</CardTitle>
            <CardDescription>
              Pasirinkite, kokia valiuta bus naudojama visoje programoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-32">Valiuta</Label>
                <Select value={selectedValiuta} onValueChange={setSelectedValiuta}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Pasirinkite valiutą" />
                  </SelectTrigger>
                  <SelectContent>
                    {valiutos.map((v) => (
                      <SelectItem key={v.id_valiuta} value={String(v.id_valiuta)}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Pranešimų nustatymai (paliekame kaip dekoraciją kol kas) */}
        <Card>
          <CardHeader>
            <CardTitle>Pranešimų nustatymai</CardTitle>
            <CardDescription>Valdykite, kaip norite gauti pranešimus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>El. pašto pranešimai</Label>
                  <p className="text-sm text-gray-600">Gauti pranešimus el. paštu</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push pranešimai</Label>
                  <p className="text-sm text-gray-600">Gauti pranešimus naršyklėje</p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              <Separator />

              <div className="space-y-4">
                <Label className="text-base">Pranešimų tipai</Label>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Grupės kvietimai</Label>
                    <p className="text-sm text-gray-600">Kai esate pakviesti į grupę</p>
                  </div>
                  <Switch checked={groupInvites} onCheckedChange={setGroupInvites} />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Naujos išlaidos</Label>
                    <p className="text-sm text-gray-600">Kai pridedama nauja išlaida</p>
                  </div>
                  <Switch checked={newExpenses} onCheckedChange={setNewExpenses} />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Mokėjimo priminimai</Label>
                    <p className="text-sm text-gray-600">Priminimai apie nesumokėtas skolas</p>
                  </div>
                  <Switch checked={paymentReminders} onCheckedChange={setPaymentReminders} />
                </div>

                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label>Žinutės</Label>
                    <p className="text-sm text-gray-600">Naujos žinutės ir pokalbiai</p>
                  </div>
                  <Switch checked={messages} onCheckedChange={setMessages} />
                </div>
              </div>
            </div>

            <Button onClick={handleSave}>Išsaugoti nustatymus</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}