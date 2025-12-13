"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import {
  Bell,
  MessageSquare,
  Users,
  DollarSign,
  AlertCircle,
  UserPlus,
  CheckCheck,
  Trash2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"
import { groupApi } from "@/services/group-api"

export type NotificationType =
  | "group_invite"
  | "friend_request"
  | "payment_received"
  | "payment_reminder"
  | "new_expense"
  | "group_message"
  | "personal_message"
  | "system"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  timestamp: Date
  actionUrl?: string
  metadata?: Record<string, any>
}

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
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Load notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return
      try {
        const res = await fetch(`${API_BASE}/api/notifications?userId=${user.id}`)
        if (!res.ok) {
          console.error("Nepavyko gauti pranešimų")
          return
        }
        const data = await res.json()

        const mapped: Notification[] = (data.notifications || []).map((n: any) => ({
          id: String(n.id),
          userId: String(n.userId),
          type: n.type,
          title: n.title,
          message: n.message,
          read: !!n.read,
          timestamp: new Date(n.timestamp),
          actionUrl: n.actionUrl ?? undefined,
          metadata: n.metadata ?? undefined,
        }))

        setNotifications(mapped)
      } catch (err) {
        console.error("Fetch notifications error:", err)
      }
    }

    if (!isLoading && user) {
      void fetchNotifications()
    }
  }, [isLoading, user])

  if (isLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  if (!user) {
    return null
  }

  const markAsRead = async (id: string) => {
    if (!user) return

    // optimistinis atnaujinimas
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )

    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch (err) {
      console.error("Mark as read error:", err)
      // jei nori – čia gali grąžinti state atgal
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch (err) {
      console.error("Mark all read error:", err)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!user) return

    setNotifications((prev) => prev.filter((n) => n.id !== id))

    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch (err) {
      console.error("Delete notification error:", err)
    }
  }

  const deleteAllNotifications = async () => {
    if (!user) return

    const prev = notifications
    setNotifications([])

    try {
      await fetch(`${API_BASE}/api/notifications/clear-all`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch (err) {
      console.error("Delete all notifications error:", err)
      setNotifications(prev)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    void markAsRead(notification.id)
    if (notification.type === "group_invite") return
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
            {unreadCount > 0
              ? `${unreadCount} neperskaityti pranešimai`
              : "Visi pranešimai perskaityti"}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={deleteAllNotifications}
              className="bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ištrinti viską
            </Button>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-2" />
                Pažymėti viską kaip perskaityta
              </Button>
            )}
          </div>
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
                    <div
                      className={`p-2 rounded-full ${
                        !notification.read ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          !notification.read ? "text-blue-600" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              !notification.read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Badge
                              variant="default"
                              className="shrink-0 select-none"
                            >
                              Naujas
                            </Badge>
                          )}
                          {/* 🗑 Vieno pranešimo trynimas */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation() // kad neaktivuotų kortelės click
                              void deleteNotification(notification.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>

                              {notification.type === "group_invite" && (
    <div
      className="flex gap-2 mt-3"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        size="sm"
        onClick={async () => {
          if (!user) return
          const inviteId = Number(notification.metadata?.inviteId)
          if (!inviteId) return

          await groupApi.acceptGroupInvite(inviteId, Number(user.id))
          await markAsRead(notification.id)

          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id)
          )
        }}
      >
        Priimti
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          if (!user) return
          const inviteId = Number(notification.metadata?.inviteId)
          if (!inviteId) return

          await groupApi.declineGroupInvite(inviteId, Number(user.id))
          await markAsRead(notification.id)

          setNotifications((prev) =>
            prev.filter((n) => n.id !== notification.id)
          )
        }}
      >
        Atmesti
      </Button>
    </div>
  )}
                      
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
