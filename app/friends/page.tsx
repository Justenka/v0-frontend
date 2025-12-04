"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { UserPlus, MessageSquare, UserMinus, Search, Check, X } from "lucide-react"
import { toast } from "sonner"
import { friendsApi, type FriendDTO, type FriendRequestDTO } from "@/services/friends-api"

type Friend = FriendDTO
type FriendRequestItem = FriendRequestDTO

export default function FriendsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()

  const initialFriendId = searchParams.get("friendId")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialFriendId)

  const [searchQuery, setSearchQuery] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const [friends, setFriends] = useState<Friend[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestItem[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestItem[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Kraunam draugus + kvietimus
  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      try {
        setIsDataLoading(true)
        const userId = Number(user.id)

        const [friendsData, requestsData] = await Promise.all([
          friendsApi.getFriends(userId),
          friendsApi.getFriendRequests(userId),
        ])

        setFriends(friendsData)
        setIncomingRequests(requestsData.incoming)
        setOutgoingRequests(requestsData.outgoing)
      } catch (err: any) {
        console.error("Failed to load friends data:", err)
        toast.error(err.message || "Nepavyko užkrauti draugų duomenų")
      } finally {
        setIsDataLoading(false)
      }
    }

    if (!isLoading && user) {
      loadData()
    }
  }, [isLoading, user])

  if (isLoading || isDataLoading) {
    return <div className="text-center py-20 text-gray-500">Kraunama...</div>
  }

  if (!user) {
    return null
  }

  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendInvite = async () => {
    if (!inviteEmail) return

    const email = inviteEmail.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Įveskite galiojantį el. pašto adresą")
      return
    }

    try {
      await friendsApi.sendRequest(Number(user.id), email)
      toast.success(`Kvietimas išsiųstas į ${email}`)
      setInviteEmail("")
      setIsInviteDialogOpen(false)

      const requests = await friendsApi.getFriendRequests(Number(user.id))
      setOutgoingRequests(requests.outgoing)
    } catch (err: any) {
      console.error("Failed to send invite:", err)
      toast.error(err.message || "Nepavyko išsiųsti kvietimo")
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendsApi.removeFriend(Number(user.id), Number(friendId))
      setFriends((prev) => prev.filter((f) => f.id !== friendId))
      toast.success("Draugas pašalintas")
    } catch (err: any) {
      console.error("Failed to remove friend:", err)
      toast.error(err.message || "Nepavyko pašalinti draugo")
    }
  }

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await friendsApi.acceptRequest(requestId, Number(user.id))
      toast.success("Kvietimas patvirtintas")

      // Perkraunam draugus ir kvietimus
      const userId = Number(user.id)
      const [friendsData, requestsData] = await Promise.all([
        friendsApi.getFriends(userId),
        friendsApi.getFriendRequests(userId),
      ])

      setFriends(friendsData)
      setIncomingRequests(requestsData.incoming)
      setOutgoingRequests(requestsData.outgoing)
    } catch (err: any) {
      console.error("Failed to accept request:", err)
      toast.error(err.message || "Nepavyko patvirtinti kvietimo")
    }
  }

  const handleRejectRequest = async (requestId: number) => {
    try {
      await friendsApi.rejectRequest(requestId, Number(user.id))
      toast.success("Kvietimas atmestas")
      setIncomingRequests((prev) => prev.filter((r) => r.requestId !== requestId))
    } catch (err: any) {
      console.error("Failed to reject request:", err)
      toast.error(err.message || "Nepavyko atmesti kvietimo")
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Draugai</h1>
          <p className="text-gray-600 mt-1">{friends.length} draugai</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Pakviesti draugą
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pakviesti draugą</DialogTitle>
              <DialogDescription>Įveskite draugo el. pašto adresą</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">El. paštas</Label>
                <Input
                  id="invite-email"
                  placeholder="vardas@pavyzdys.lt"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Atšaukti
              </Button>
              <Button onClick={handleSendInvite} disabled={!inviteEmail}>
                Siųsti kvietimą
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kvietimai */}
      {(incomingRequests.length > 0 || outgoingRequests.length > 0) && (
        <div className="grid gap-4 mb-6">
          {incomingRequests.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3">Gauti kvietimai</h2>
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req.requestId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={req.user.avatar || "/placeholder.svg"} alt={req.user.name} />
                          <AvatarFallback>{getInitials(req.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{req.user.name}</p>
                          <p className="text-sm text-gray-600">{req.user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcceptRequest(req.requestId)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Priimti
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectRequest(req.requestId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {outgoingRequests.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h2 className="font-semibold mb-3">Išsiųsti kvietimai</h2>
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div key={req.requestId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={req.user.avatar || "/placeholder.svg"} alt={req.user.name} />
                          <AvatarFallback>{getInitials(req.user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{req.user.name}</p>
                          <p className="text-sm text-gray-600">{req.user.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">Laukiama patvirtinimo...</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Paieška */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Ieškoti draugų..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Draugų sąrašas */}
      <div className="grid gap-4">
        {filteredFriends.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchQuery ? "Draugų nerasta" : "Dar neturite draugų"}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4 bg-transparent"
                  onClick={() => setIsInviteDialogOpen(true)}
                >
                  Pakviesti draugą
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredFriends.map((friend) => (
            <Card key={friend.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.avatar || "/placeholder.svg"} alt={friend.name} />
                      <AvatarFallback>{getInitials(friend.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-gray-600">{friend.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/messages?friendId=${friend.id}`)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Žinutė
                      </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
