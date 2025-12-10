"use client"

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bell,
  MessageSquare,
  Users,
  LogOut,
  Settings,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface NotificationSettings {
  el_pastas_aktyvus: number | boolean
  push_pranesimai: number | boolean
  draugu_kvietimai: number | boolean
  grupes_kvietimai: number | boolean
  naujos_islaidos: number | boolean
  mokejimo_priminimai: number | boolean
  zinutes: number | boolean
}

export function NavigationHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)

  // Nerodom header login/register puslapiuose
  if (pathname === "/login" || pathname === "/register") {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  // Pollinam ŽINUČIŲ burbuliuką (atsižvelgiant į nustatymus)
  useEffect(() => {
    if (!user) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const fetchMessagesBadge = async () => {
      try {
        // 1) Pasiimam vartotojo pranešimų nustatymus
        const settingsRes = await fetch(
          `${API_BASE}/api/pranesimu-nustatymai/${user.id}`,
        )

        if (!settingsRes.ok) return
        const settings: NotificationSettings = await settingsRes.json()

        // normalizuojam į boolean
        const messagesOn =
          settings.zinutes === true ||
          settings.zinutes === 1

        // jei useris yra išjungęs žinučių pranešimus –
        // burbuliuko visai nerodome ir neskaičiuojam unread
        if (!messagesOn) {
          if (!cancelled) setHasNewMessages(false)
          return
        }

        // 2) tik tada, kai įjungta, traukiam kiek neperskaitytų asmeninių žinučių
        const msgCountRes = await fetch(
          `${API_BASE}/api/notifications/messages-unread-count?userId=${user.id}`,
        )
        if (!msgCountRes.ok) return

        const { unreadCount } = await msgCountRes.json()

        if (!cancelled) {
          setHasNewMessages(unreadCount > 0)
        }
      } catch (err) {
        if (!cancelled)
          console.error("Messages badge fetch error:", err)
      }
    }

    void fetchMessagesBadge()
    intervalId = setInterval(fetchMessagesBadge, 1000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [user])

  // Pollinam ŽINUČIŲ burbuliuką (priklauso nuo nustatymų)
  useEffect(() => {
    if (!user) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const fetchMessagesBadge = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/notifications/messages-unread-count?userId=${user.id}`,
        )
        if (!res.ok) return

        const { unreadCount } = await res.json()
        if (cancelled) return

        setHasNewMessages(unreadCount > 0)
      } catch (err) {
        if (!cancelled)
          console.error("Messages badge fetch error:", err)
      }
    }

    void fetchMessagesBadge()
    intervalId = setInterval(fetchMessagesBadge, 5000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [user])

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Kairė pusė – logotipas + nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900"
            >
              Skolų Departamentas
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/">
                  <Button
                    variant={
                      pathname === "/" ? "default" : "ghost"
                    }
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Grupės
                  </Button>
                </Link>

                {/* Žinutės su burbuliuku */}
                <div className="relative">
                  <Link href="/messages">
                    <Button
                      variant={pathname === "/messages" ? "default" : "ghost"}
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Žinutės
                    </Button>
                  </Link>
                  {hasNewMessages && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </div>

                <Link href="/friends">
                  <Button
                    variant={
                      pathname === "/friends"
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Draugai
                  </Button>
                </Link>
              </nav>
            )}
          </div>

          {/* Dešinė pusė – varpelis + user menu arba login/register */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications varpelis */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={
                            user.avatar || "/placeholder.svg"
                          }
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56"
                  >
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profilis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Nustatymai
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Atsijungti
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost">Prisijungti</Button>
                </Link>
                <Link href="/register">
                  <Button>Registruotis</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
