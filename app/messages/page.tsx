"use client"

import type React from "react"

import { useState } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send } from "lucide-react"
import { mockPersonalMessages, mockUsers } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import { lt } from "date-fns/locale"

export default function MessagesPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")

  useEffect(() => {
  // Wait until loading finishes before deciding
  if (!isLoading && !user) {
    router.push("/login")
  }
}, [isLoading, user, router])

// Show a small loader or nothing while checking
if (isLoading) {
  return <div className="text-center py-20 text-gray-500">Kraunama...</div>
}

if (!user) {
  return null
}

  // Get user's friends
  const friends = mockUsers.filter((u) => user.friends.includes(u.id))

  // Get conversations (group messages by user)
  const conversations = friends.map((friend) => {
    const messages = mockPersonalMessages
      .filter(
        (m) =>
          (m.senderId === user.id && m.recipientId === friend.id) ||
          (m.senderId === friend.id && m.recipientId === user.id),
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    const unreadCount = messages.filter((m) => m.recipientId === user.id && !m.read).length

    return {
      user: friend,
      lastMessage: messages[0],
      unreadCount,
      messages: messages.reverse(),
    }
  })

  // Filter conversations
  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get selected conversation
  const selectedConversation = conversations.find((c) => c.user.id === selectedUserId)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUserId) return

    // Mock: Add message
    console.log(`Send message to ${selectedUserId}: ${newMessage}`)
    setNewMessage("")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

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
                      selectedUserId === conv.user.id ? "bg-blue-50 border border-blue-200" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={conv.user.avatar || "/placeholder.svg"} alt={conv.user.name} />
                        <AvatarFallback>{getInitials(conv.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">{conv.user.name}</p>
                          {conv.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <>
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage.senderId === user.id ? "Jūs: " : ""}
                              {conv.lastMessage.content.length > 30
                                ? conv.lastMessage.content.slice(0, 30) + "..."
                                : conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(conv.lastMessage.timestamp, { addSuffix: true, locale: lt })}
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
                  <AvatarFallback>{getInitials(selectedConversation.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.user.name}</p>
                  <p className="text-sm text-gray-600">{selectedConversation.user.email}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => {
                    const isOwnMessage = message.senderId === user.id
                    return (
                      <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          <span className={`text-xs mt-1 block ${isOwnMessage ? "text-blue-100" : "text-gray-500"}`}>
                            {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: lt })}
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
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
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
