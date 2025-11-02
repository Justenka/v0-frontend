"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockNotifications } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { Bell, MessageSquare, Users, DollarSign, AlertCircle, UserPlus, CheckCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"

const notificationIcons = {
  group_invite: Users,
  friend_request: UserPlus,
  payment_received: DollarSign,
  payment_reminder: AlertCircle,
  new_expense: DollarSign,
  group_message: MessageSquare,
  personal_message: MessageSquare,
  system: Bell,
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [notifications, setNotifications] = useState<typeof mockNotifications>([])

    // 🔹 1. Redirect after auth check
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // 🔹 2. Load user notifications
  useEffect(() => {
    if (user) {
      const userNotifications = mockNotifications.filter((n) => n.userId === user.id)
      setNotifications(userNotifications)
    }
  }, [user])

  // 🧠 All hooks above — now we can safely conditionally render below
  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  if (!user) {
    return null
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleNotificationClick = (notification: (typeof notifications)[0]) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pranešimai</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} neperskaityti pranešimai` : "Visi pranešimai perskaityti"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Pažymėti viską kaip perskaityta
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Pranešimų nėra</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const Icon = notificationIcons[notification.type]
            return (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  !notification.read ? "border-blue-200 bg-blue-50/50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${!notification.read ? "bg-blue-100" : "bg-gray-100"}`}>
                      <Icon className={`h-5 w-5 ${!notification.read ? "text-blue-600" : "text-gray-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="shrink-0">
                            Naujas
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: lt,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
