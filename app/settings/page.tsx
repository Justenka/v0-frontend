"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [groupInvites, setGroupInvites] = useState(true)
  const [newExpenses, setNewExpenses] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(true)
  const [messages, setMessages] = useState(true)

  if (!user) {
    router.push("/login")
    return null
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name, email })
      toast.success("Profilis atnaujintas")
    } catch (error) {
      toast.error("Nepavyko atnaujinti profilio")
    }
  }

  const handleSaveNotifications = () => {
    // Mock: Save notification settings
    toast.success("Pranešimų nustatymai išsaugoti")

    // Real implementation:
    /*
    await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        notify_group_invites: groupInvites,
        notify_new_expenses: newExpenses,
        notify_payment_reminders: paymentReminders,
        notify_messages: messages
      })
    */
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Nustatymai</h1>

      <div className="space-y-6">
        {/* Notification Settings */}
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

            <Button onClick={handleSaveNotifications}>Išsaugoti nustatymus</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}