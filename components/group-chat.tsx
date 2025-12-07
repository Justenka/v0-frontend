// src/components/group-chat.tsx
"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"

import type { GroupMessage } from "@/types/message"
import { useAuth } from "@/contexts/auth-context"
import {
  getGroupMessages,
  sendGroupMessage,
} from "@/services/groupMessages-api"

interface GroupChatProps {
  groupId: string
}

export function GroupChat({ groupId }: GroupChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  // 🔁 Periodiškai traukiam naujas žinutes
  useEffect(() => {
    if (!groupId) return

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const loadMessages = async (initial = false) => {
      try {
        if (initial) setLoading(true)
        setError(null)

        const data = await getGroupMessages(groupId)

        setMessages(prev => {
          if (prev.length === 0 || initial) {
            return data
          }

          const maxId = prev[prev.length - 1]?.id ?? 0
          const newOnes = data.filter(m => m.id > maxId)

          if (newOnes.length === 0) return prev
          return [...prev, ...newOnes]
        })
      } catch (err: any) {
        console.error(err)
        if (!cancelled) {
          setError(err.message || "Nepavyko užkrauti žinučių")
        }
      } finally {
        if (!cancelled && initial) setLoading(false)
      }
    }

    // Pirmas užkrovimas
    loadMessages(true)

    // Kas 1 sekundes tikrinam naujas
    intervalId = setInterval(() => {
      loadMessages(false)
    }, 1000)

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  }, [groupId])

  // Scroll į apačią kai keičiasi žinutės
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim()) return

    const userIdNum = Number(user.id)
    if (Number.isNaN(userIdNum)) {
      console.error("user.id ne skaičius", user.id)
      return
    }

    try {
      setSending(true)
      setError(null)

      const saved = await sendGroupMessage(
        groupId,
        userIdNum,
        newMessage.trim(),
      )

      // Optimistinis append'as – iškart matysi savo žinutę
      setMessages(prev => [...prev, saved])
      setNewMessage("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Nepavyko išsiųsti žinutės")
    } finally {
      setSending(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {loading && messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Kraunamos žinutės...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Žinučių dar nėra</p>
              <p className="text-sm mt-1">Būkite pirmas, kuris parašys!</p>
            </div>
          ) : (
            messages.map((message) => {
              const userIdNum = user ? Number(user.id) : NaN
              const isOwnMessage =
                user && !Number.isNaN(userIdNum)
                  ? message.senderId === userIdNum
                  : false

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={user?.avatar || "/placeholder.svg"}
                      alt={message.senderName}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(message.senderName)}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`flex flex-col ${
                      isOwnMessage ? "items-end" : "items-start"
                    } max-w-[70%]`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {isOwnMessage ? "Jūs" : message.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(message.timestamp, {
                          addSuffix: true,
                          locale: lt,
                        })}
                      </span>
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {error && (
            <div className="text-center text-xs text-red-500 mt-2">
              {error}
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder={
              user ? "Rašykite žinutę..." : "Prisijunkite, kad galėtumėte rašyti"
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={!user || sending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!user || !newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
