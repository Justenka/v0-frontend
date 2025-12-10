"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { Bell, MessageSquare, Users, LogOut, Settings, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export function NavigationHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // POLLING kas 0.5s
  useEffect(() => {
    if (!user) return

    let cancelled = false

    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/notifications/unread-count?userId=${user.id}`,
        )
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setUnreadNotifications(data.unreadCount ?? 0)
        }
      } catch (err) {
        console.error("Failed to fetch unread notifications:", err)
      }
    }

    // pirmas užkrovimas
    void fetchUnread()
    // kas 5 sekundes
    const intervalId = setInterval(fetchUnread, 500)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [user])

  // login/register puslapiuose nerodom header
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
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  const hasUnread = unreadNotifications > 0

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Skolų Departamentas
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/">
                  <Button
                    variant={pathname === "/" ? "default" : "ghost"}
                    size="sm"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Grupės
                  </Button>
                </Link>
                <Link href="/messages">
                  <Button
                    variant={pathname === "/messages" ? "default" : "ghost"}
                    size="sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Žinutės
                  </Button>
                </Link>
                <Link href="/friends">
                  <Button
                    variant={pathname === "/friends" ? "default" : "ghost"}
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Draugai
                  </Button>
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* 🔔 Notifications su indikatoriumi */}
                <Link href="/notifications">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`relative ${
                      hasUnread ? "text-blue-600" : ""
                    }`}
                  >
                    <Bell
                      className={`h-5 w-5 ${
                        hasUnread ? "animate-bounce" : ""
                      }`}
                    />
                    {hasUnread && (
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
                          src={user.avatar || "/placeholder.svg"}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profilis
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/settings")}>
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
