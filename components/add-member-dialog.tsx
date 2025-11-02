"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, UserPlus } from "lucide-react"
import type { Member } from "@/types/member"
import { useAuth } from "@/contexts/auth-context"
import { mockUsers } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMember: (name: string) => Promise<boolean>
  existingMembers: Member[]
}

export default function AddMemberDialog({ open, onOpenChange, onAddMember, existingMembers }: AddMemberDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)

  const currentUser = mockUsers.find((u) => u.id === user?.id)
  const friends = mockUsers.filter((u) => currentUser?.friends.includes(u.id))

  useEffect(() => {
    if (open) {
      setName("")
      setEmail("")
      setError(null)
      setSelectedFriend(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let memberName = name.trim()

    if (selectedFriend) {
      const friend = friends.find((f) => f.id === selectedFriend)
      if (friend) {
        memberName = friend.name
      }
    }

    if (!memberName) return

    const normalizedName = memberName.toLowerCase()
    const isDuplicate = existingMembers.some((member) => member.name.toLowerCase() === normalizedName)

    if (isDuplicate) {
      setError(`A member with the name "${memberName}" already exists in this group.`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const success = await onAddMember(memberName)
      if (success) {
        setName("")
        setEmail("")
        setSelectedFriend(null)
        onOpenChange(false)
      } else {
        setError("Failed to add member. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error("Error adding member:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>Add a new member to this group from your friends or by username/email.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="friends" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">From Friends</TabsTrigger>
            <TabsTrigger value="manual">By Username/Email</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 flex-1 overflow-y-auto">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You don't have any friends yet. Add friends to invite them to groups!
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => setSelectedFriend(friend.id === selectedFriend ? null : friend.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedFriend === friend.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-sm text-muted-foreground">{friend.email}</p>
                    </div>
                    {selectedFriend === friend.id && <UserPlus className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
            )}

            {selectedFriend && (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Selected Friend"}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="manual" className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Username</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
