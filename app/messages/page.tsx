"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"
import { toast } from "sonner"

import { friendsApi, type FriendDTO } from "@/services/friends-api"
import { messagesApi, type MessageDTO } from "@/services/messages-api"

type Friend = FriendDTO

interface Conversation {
  user: Friend
  messages: MessageDTO[]
}

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  const [hasInitialSelected, setHasInitialSelected] = useState(false)
  const initialFriendId = searchParams.get("friendId")

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Užkraunam draugus ir sukuriam tuščius pokalbius
  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return
      try {
        setIsDataLoading(true)
        const userId = Number(user.id)
        const friends = await friendsApi.getFriends(userId)

        setConversations(
          friends.map((f) => ({
            user: f,
            messages: [],
          })),
        )

        // pirmą kartą – parenkam iš karto pokalbį:
        // 1) jei yra ?friendId URL'e – jį
        // 2) jei nėra – pirmą draugą sąraše
        if (!hasInitialSelected) {
          const defaultId = initialFriendId ?? (friends[0]?.id ?? null)
          if (defaultId) {
            setSelectedUserId(defaultId)
            setHasInitialSelected(true)
          }
        }
      } catch (err: any) {
        console.error("Failed to load friends:", err)
        toast.error(err.message || "Nepavyko užkrauti draugų sąrašo")
      } finally {
        setIsDataLoading(false)
      }
    }

    if (!isLoading && user) {
      void loadFriends()
    }
  }, [isLoading, user, hasInitialSelected, initialFriendId])

  // Kai pasirenkam vartotoją – užkraunam jo pokalbį, jei dar neįkrautas
  useEffect(() => {
    const loadConversation = async () => {
      if (!user || !selectedUserId) return

      const conv = conversations.find((c) => c.user.id === selectedUserId)
      if (!conv) return

      if (conv.messages.length > 0) return // jau įkrautas

      try {
        const msgs = await messagesApi.getConversation(
          Number(user.id),
          Number(selectedUserId),
        )

        setConversations((prev) =>
          prev.map((c) =>
            c.user.id === selectedUserId ? { ...c, messages: msgs } : c,
          ),
        )
      } catch (err: any) {
        console.error("Failed to load conversation:", err)
        toast.error(err.message || "Nepavyko užkrauti pokalbio")
      }
    }

    void loadConversation()
  }, [selectedUserId, user, conversations])

  if (isLoading || isDataLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  if (!user) return null

  // praturtinam pokalbius lastMessage + unread
  const conversationsWithMeta = conversations.map((conv) => {
    const msgs = conv.messages
    const lastMessage = msgs.length > 0 ? msgs[msgs.length - 1] : undefined
    const unreadCount = msgs.filter(
      (m) => m.recipientId === user.id && !m.read,
    ).length

    return { ...conv, lastMessage, unreadCount }
  })

  const filteredConversations = conversationsWithMeta.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const selectedConversation = conversationsWithMeta.find(
    (c) => c.user.id === selectedUserId,
  )

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId || !user) return
    if (isSending) return // apsauga nuo greito dvigubo paspaudimo

    setIsSending(true)
    try {
      const msg = await messagesApi.sendMessage(
        Number(user.id),
        Number(selectedUserId),
        newMessage.trim(),
      )

      setConversations((prev) =>
        prev.map((c) => {
          if (c.user.id !== selectedUserId) return c

          const alreadyExists = c.messages.some((m) => m.id === msg.id)
          if (alreadyExists) return c

          return { ...c, messages: [...c.messages, msg] }
        }),
      )
      setNewMessage("")
    } catch (err: any) {
      console.error("Failed to send message:", err)
      toast.error(err.message || "Nepavyko išsiųsti žinutės")
    } finally {
      setIsSending(false)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  return (
    <div className="container max-w-6xl py-10">
      <h1 className="text-3xl font-bold mb-8">Žinutės</h1>

      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ieškoti pokalbių..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Pokalbių nerasta</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.user.id}
                    onClick={() => setSelectedUserId(conv.user.id)}
                    className={`w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left ${
                      selectedUserId === conv.user.id
                        ? "bg-blue-50 border border-blue-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage
                          src={conv.user.avatar || "/placeholder.svg"}
                          alt={conv.user.name}
                        />
                        <AvatarFallback>
                          {getInitials(conv.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {conv.user.name}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <>
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage.senderId === user.id
                                ? "Jūs: "
                                : ""}
                              {conv.lastMessage.content.length > 30
                                ? conv.lastMessage.content.slice(0, 30) + "..."
                                : conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(
                                conv.lastMessage.timestamp,
                                { addSuffix: true, locale: lt },
                              )}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={selectedConversation.user.avatar || "/placeholder.svg"}
                    alt={selectedConversation.user.name}
                  />
                  <AvatarFallback>
                    {getInitials(selectedConversation.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedConversation.user.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.user.email}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <span
                            className={`text-xs mt-1 block ${
                              isOwnMessage
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatDistanceToNow(message.timestamp, {
                              addSuffix: true,
                              locale: lt,
                            })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rašykite žinutę..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-lg font-medium">Pasirinkite pokalbį</p>
                <p className="text-sm mt-1">Pradėkite pokalbį su draugu</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
