"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

import { useEffect, useMemo, useState } from "react"
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
  type LucideIcon,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"
import { groupApi } from "@/services/group-api"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

const notificationIcons: Record<NotificationType, LucideIcon> = {
  group_invite: Users,
  friend_request: UserPlus,
  payment_received: DollarSign,
  payment_reminder: AlertCircle,
  new_expense: DollarSign,
  group_message: MessageSquare,
  personal_message: MessageSquare,
  system: Bell,
}

// ✅ svarbiausia: normalizuojam key į lower_snake_case
const normalizeKey = (v: any) =>
  String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")

const normalizeType = (type: any): NotificationType => {
  const key = normalizeKey(type)
  return key in notificationIcons ? (key as NotificationType) : "system"
}

const getNotificationIcon = (type: any): LucideIcon => {
  const key = normalizeKey(type)
  return (notificationIcons as any)[key] ?? Bell
}

const parseMetadata = (m: any): Record<string, any> | undefined => {
  if (!m) return undefined
  if (typeof m === "object") return m
  if (typeof m === "string") {
    try {
      const parsed = JSON.parse(m)
      return parsed && typeof parsed === "object" ? parsed : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

// ✅ invite atpažinimas net jeigu type blogas
const isGroupInviteNotification = (n: Notification) => {
  const key = normalizeKey(n.type)
  const inviteId =
    Number(n.metadata?.inviteId) ||
    Number(n.metadata?.invite_id) ||
    Number(n.metadata?.groupInviteId) ||
    Number(n.metadata?.group_invite_id)

  return key === "group_invite" || !!inviteId
}

type PendingInviteAction = "accept" | "decline"

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])

  // ✅ confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingInviteAction | null>(null)
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null)
  const [pendingInviteId, setPendingInviteId] = useState<number | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const pendingNotification = useMemo(() => {
    if (!pendingNotificationId) return null
    return notifications.find((n) => n.id === pendingNotificationId) ?? null
  }, [pendingNotificationId, notifications])

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
          type: normalizeType(n.type),
          title: n.title,
          message: n.message,
          read: !!n.read,
          timestamp: new Date(n.timestamp),
          actionUrl: n.actionUrl ?? undefined,
          metadata: parseMetadata(n.metadata),
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
    } catch (err) {
      console.error("Mark as read error:", err)
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

  // ✅ server-side delete (kad po refresh nebegrįžtų)
  const deleteNotificationServer = async (id: string) => {
    if (!user) return
    await fetch(`${API_BASE}/api/notifications/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
  }

  const deleteNotification = async (id: string) => {
    if (!user) return
    setNotifications((prev) => prev.filter((n) => n.id !== id))

    try {
      await deleteNotificationServer(id)
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

  // ✅ svarbiausia: invite notifas niekur nenaviguoja
  const handleNotificationClick = (notification: Notification) => {
    void markAsRead(notification.id)

    if (isGroupInviteNotification(notification)) {
      return
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  // ✅ open confirm dialog
  const openInviteConfirm = (action: PendingInviteAction, notification: Notification) => {
    const inviteId =
      Number(notification.metadata?.inviteId) ||
      Number(notification.metadata?.invite_id) ||
      Number(notification.metadata?.groupInviteId) ||
      Number(notification.metadata?.group_invite_id)

    if (!inviteId) {
      console.log("[Invite] Missing inviteId in metadata:", notification.metadata, notification)
      return
    }

    setPendingAction(action)
    setPendingNotificationId(notification.id)
    setPendingInviteId(inviteId)
    setConfirmOpen(true)
  }

  const closeInviteConfirm = () => {
    setConfirmOpen(false)
    setPendingAction(null)
    setPendingNotificationId(null)
    setPendingInviteId(null)
    setIsConfirming(false)
  }

  const confirmInviteAction = async () => {
    if (!user) return
    if (!pendingAction || !pendingNotificationId || !pendingInviteId) return

    setIsConfirming(true)

    try {
      if (pendingAction === "accept") {
        await groupApi.acceptGroupInvite(pendingInviteId, Number(user.id))
      } else {
        await groupApi.declineGroupInvite(pendingInviteId, Number(user.id))
      }

      // ✅ kad refresh negrąžintų – TRINAM pranešimą iš DB
      try {
        await deleteNotificationServer(pendingNotificationId)
      } catch (e) {
        // jei delete nepavyksta, bent jau pažymim kaip perskaitytą
        console.error("[Invite] Notification delete failed, fallback to read:", e)
        await markAsRead(pendingNotificationId)
      }

      // ✅ UI
      setNotifications((prev) => prev.filter((n) => n.id !== pendingNotificationId))
      closeInviteConfirm()
    } catch (e) {
      console.error("[Invite] Action failed:", e)
      setIsConfirming(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const confirmTitle = pendingAction === "accept" ? "Patvirtinti kvietimo priėmimą?" : "Patvirtinti kvietimo atmetimą?"
  const confirmDesc = pendingAction === "accept" ? "Ar tikrai norite priimti kvietimą?" : "Ar tikrai norite atmesti kvietimą?"
  const actionLabel = pendingAction === "accept" ? "Taip, priimti" : "Taip, atmesti"

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={(o) => (o ? setConfirmOpen(true) : closeInviteConfirm())}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDesc}
              {pendingNotification?.title ? (
                <span className="mt-2 block text-sm text-gray-600">
                  Pranešimas: <span className="font-medium">{pendingNotification.title}</span>
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction onClick={confirmInviteAction} disabled={isConfirming}>
              {isConfirming ? "Vykdoma..." : actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container max-w-4xl py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Pranešimai</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} neperskaityti pranešimai` : "Visi pranešimai perskaityti"}
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={deleteAllNotifications} className="bg-transparent">
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
              const Icon = getNotificationIcon(notification.type)
              const isInvite = isGroupInviteNotification(notification)

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

                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <Badge variant="default" className="shrink-0 select-none">
                                Naujas
                              </Badge>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                void deleteNotification(notification.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>

                        {/* ✅ rekomenduoju rodyti tik jei notifas dar neperskaitytas */}
                        {isInvite && !notification.read && (
                          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" onClick={() => openInviteConfirm("accept", notification)}>
                              Priimti
                            </Button>

                            <Button size="sm" variant="outline" onClick={() => openInviteConfirm("decline", notification)}>
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
    </>
  )
}
