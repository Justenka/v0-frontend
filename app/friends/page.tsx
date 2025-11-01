"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { mockUsers } from "@/lib/mock-data"
import { useAuth } from "@/contexts/auth-context"
import { UserPlus, MessageSquare, UserMinus, Search } from "lucide-react"
import { toast } from "sonner"

export default function FriendsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  if (!user) {
    router.push("/login")
    return null
  }

  const friends = mockUsers.filter((u) => user.friends.includes(u.id))
  const filteredFriends = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSendInvite = () => {
    // Mock: Send friend request
    toast.success(`Kvietimas išsiųstas ${inviteEmail}`)
    setInviteEmail("")
    setIsInviteDialogOpen(false)

    // Real implementation:
    /*
    await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    
    // Create notification for the recipient
    await supabase.from('notifications').insert({
      user_id: friendId,
      type: 'friend_request',
      title: 'Friend Request',
      message: `${user.name} sent you a friend request`
    })
    */
  }

  const handleRemoveFriend = (friendId: string) => {
    // Mock: Remove friend
    toast.success("Draugas pašalintas")

    // Real implementation:
    /*
    await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    */
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

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
              <DialogDescription>Įveskite el. paštą arba vartotojo vardą</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">El. paštas arba vartotojo vardas</Label>
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

      <div className="grid gap-4">
        {filteredFriends.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">{searchQuery ? "Draugų nerasta" : "Dar neturite draugų"}</p>
              {!searchQuery && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setIsInviteDialogOpen(true)}>
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
                    <Button variant="outline" size="sm" onClick={() => router.push(`/messages/${friend.id}`)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Žinutė
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFriend(friend.id)}>
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
