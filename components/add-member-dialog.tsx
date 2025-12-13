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
import { AlertCircle, UserPlus, Link2, Copy, Check, Eye } from "lucide-react"
import type { Member } from "@/types/member"
import { useAuth } from "@/contexts/auth-context"
import { mockUsers } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { groupApi } from "@/services/group-api"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMember: (name: string) => Promise<boolean>
  existingMembers: Member[]
  groupId?: string
}

type Friend = {
  id_vartotojas: number
  vardas: string
  pavarde?: string | null
  el_pastas: string
  avatar_url?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""


export default function AddMemberDialog({
  open,
  onOpenChange,
  onAddMember,
  existingMembers,
  groupId,
}: AddMemberDialogProps) {
  const { user } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [publicLinkCopied, setPublicLinkCopied] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [friendsError, setFriendsError] = useState<string | null>(null)

  const currentUser = mockUsers.find((u) => u.id === user?.id)
  //const friends = mockUsers.filter((u) => currentUser?.friends.includes(u.id))

  // Viešas peržiūros linkas
  const publicViewLink = groupId 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/groups/${groupId}`
    : ""

  useEffect(() => {
    if (open) {
      setName("")
      setEmail("")
      setError(null)
      setInviteLink("")
      setSelectedFriend(null)
      setLinkCopied(false)
      setPublicLinkCopied(false)
    }
  }, [open])

  useEffect(() => {
  const loadFriends = async () => {
    if (!open) return
    if (!user?.id) return

    setIsLoadingFriends(true)
    setFriendsError(null)

    try {
      const res = await fetch(`${API_BASE}/api/friends?userId=${user.id}`)
      const data = await res.json().catch(() => null)

      if (!res.ok) throw new Error(data?.message || "Nepavyko gauti draugų")
      setFriends(data?.friends ?? [])
    } catch (e: any) {
      setFriends([])
      setFriendsError(e?.message || "Nepavyko gauti draugų")
    } finally {
      setIsLoadingFriends(false)
    }
  }

  loadFriends()
}, [open, user?.id])


  /*const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault()

  const memberName = name.trim()
  if (!memberName) return

  const normalizedName = memberName.toLowerCase()
  const isDuplicate = existingMembers.some((m) => m.name.toLowerCase() === normalizedName)

  if (isDuplicate) {
    setError(`Narys "${memberName}" jau yra šioje grupėje.`)
    return
  }

  setIsSubmitting(true)
  setError(null)
  try {
    const success = await onAddMember(memberName)
    if (success) {
      toast.success(`Narys „${memberName}“ pridėtas`)
      setName("")
      setEmail("")
      onOpenChange(false)
    } else {
      setError("Nepavyko pridėti nario. Bandykite dar kartą.")
    }
  } catch (err) {
    console.error("Error adding member:", err)
    setError("Įvyko klaida. Bandykite dar kartą.")
  } finally {
    setIsSubmitting(false)
  }
}*/

const handleSubmit = async (e?: React.FormEvent) => {
  if (e) e.preventDefault()

  const memberEmail = email.trim()
  const memberName = name.trim()
  if (!memberEmail) return

  const normalizedName = memberEmail.toLowerCase()
  const isDuplicate = existingMembers.some((m) => m.email.toLowerCase() === normalizedName)

  if (isDuplicate) {
    setError(`Narys "${memberName}" jau yra šioje grupėje.`)
    return
  }

  setIsSubmitting(true)
  setError(null)
  try {
    const success = await onAddMember(memberEmail)
    if (success) {
      toast.success(`Narys „${memberName}“ pridėtas`)
      setName("")
      setEmail("")
      onOpenChange(false)
    } else {
      setError("Nepavyko pridėti nario. Bandykite dar kartą.")
    }
  } catch (err) {
    console.error("Error adding member:", err)
    setError("Įvyko klaida. Bandykite dar kartą.")
  } finally {
    setIsSubmitting(false)
  }
}

    const handleSubmitFriend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

      // FRIEND TAB: invite only (do NOT add immediately)
  if (selectedFriend) {
    if (!user?.id) {
      setError("Turite būti prisijungęs")
      return
    }
    if (!groupId) {
      setError("Nerastas grupės ID")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await groupApi.inviteFriendToGroup(
        Number(groupId),
        Number(selectedFriend),
        Number(user.id),
      )

      toast.success("Kvietimas išsiųstas!")
      setSelectedFriend(null)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Nepavyko išsiųsti kvietimo")
    } finally {
      setIsSubmitting(false)
    }
    return
  }
    }

  const handleGenerateInviteLink = async () => {
    if (!user?.id) {
      toast.error("Turite būti prisijungęs, kad sukurtumėte kvietimą")
      return
    }
    if (!groupId) {
      toast.error("Nerastas grupės ID")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const numericGroupId = Number(groupId)
      const { token } = await groupApi.createInvite(
        numericGroupId,
        Number(user.id)
      )

      const link = `${window.location.origin}/groups/${numericGroupId}/join?token=${encodeURIComponent(
        token
      )}`

      setInviteLink(link)
      toast.success("Kvietimo nuoroda sugeneruota!")
    } catch (e: any) {
      toast.error(e?.message || "Nepavyko sugeneruoti kvietimo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast.success("Nuoroda nukopijuota!")
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      toast.error("Nepavyko nukopijuoti nuorodos")
    }
  }

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicViewLink)
      setPublicLinkCopied(true)
      toast.success("Vieša nuoroda nukopijuota!")
      setTimeout(() => setPublicLinkCopied(false), 2000)
    } catch {
      toast.error("Nepavyko nukopijuoti nuorodos")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pridėti narį</DialogTitle>
          <DialogDescription>
            Pridėkite naują narį prie grupės pasirinkdami iš draugų sąrašo, įvesdami vardą arba sugeneruodami nuorodą.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="friends" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends">Iš draugų</TabsTrigger>
            <TabsTrigger value="manual">El. paštas</TabsTrigger>
            <TabsTrigger value="link">Kvietimo nuoroda</TabsTrigger>
            <TabsTrigger value="public">Vieša nuoroda</TabsTrigger>
            
          </TabsList>

          {/* --- Draugų sąrašas --- */}
          {/*<TabsContent value="friends" className="space-y-4 flex-1 overflow-y-auto mt-4">
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Neturite draugų sąraše. Pridėkite draugų, kad galėtumėte juos kviesti į grupes.
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => setSelectedFriend(friend.id === selectedFriend ? null : friend.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedFriend === friend.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent"
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
                {isSubmitting ? "Pridedama..." : "Pridėti draugą"}
              </Button>
            )}
          </TabsContent>*/}

          <TabsContent value="friends" className="space-y-4 flex-1 overflow-y-auto mt-4">
            {isLoadingFriends ? (
              <p className="text-sm text-muted-foreground">Kraunami draugai...</p>
            ) : friendsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{friendsError}</AlertDescription>
              </Alert>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Draugų sąrašas tuščias arba nepavyko jo užkrauti.
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => {
                  const fullName = `${friend.vardas} ${friend.pavarde || ""}`.trim()

                  return (
                    <button
                      key={friend.id_vartotojas}
                      type="button"
                      onClick={() =>
                        setSelectedFriend(
                          String(friend.id_vartotojas) === selectedFriend ? null : String(friend.id_vartotojas),
                        )
                      }
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        selectedFriend === String(friend.id_vartotojas)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 text-left">
                        <p className="font-medium">{fullName}</p>
                        <p className="text-sm text-muted-foreground">{friend.el_pastas}</p>
                      </div>

                      {selectedFriend === String(friend.id_vartotojas) && (
                        <UserPlus className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {selectedFriend && (
              <Button onClick={handleSubmitFriend} disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Siunčiamas kvietimas..." : "Pakviesti draugą"}
              </Button>
            )}
          </TabsContent>


          {/* --- Rankinis pridėjimas --- */}
          <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/*<div className="space-y-2">
                <Label htmlFor="name">Vardas (nebūtina)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  placeholder="Įveskite vardą"
                  //required
                />
              </div>*/}

              <div className="space-y-2">
                <Label htmlFor="email">El. paštas</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Įveskite el. pašto adresą"
                  required
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting || !email.trim()}>
                  {isSubmitting ? "Pridedama..." : "Pridėti narį"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* --- Kvietimo nuoroda (su registracija) --- */}
          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="h-8 w-8 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Kvietimo nuoroda</p>
                    <p className="text-blue-800">
                      Sugeneruokite kvietimo nuorodą, kuria galėsite dalintis su draugais. Bet kas su šia nuoroda galės
                      <strong> prisijungti ir tapti grupės nariu</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {!inviteLink ? (
                <Button onClick={handleGenerateInviteLink} disabled={isSubmitting} className="w-full">
                  <Link2 className="h-6 w-6 mr-2" />
                  Generuoti kvietimo nuorodą
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Kvietimo nuoroda</Label>
                    <div className="flex gap-2">
                      <Input value={inviteLink} readOnly className="flex-1" />
                      <Button onClick={handleCopyLink} variant="outline" size="icon">
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ši nuoroda galioja 7 dienas ir gali būti panaudota 1 kartą.
                  </p>
                  <Button onClick={handleGenerateInviteLink} variant="outline" className="w-full bg-transparent">
                    Generuoti naują nuorodą
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* --- NAUJAS: Viešas peržiūros linkas --- */}
          <TabsContent value="public" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-8 w-8 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Viešos peržiūros nuoroda</p>
                    <p className="text-green-800">
                      Dalinkitės šia nuoroda su bet kuo - jie galės <strong>peržiūrėti grupės išlaidas be prisijungimo</strong>.
                      Ši nuoroda nesuteikia teisių redaguoti ar pridėti išlaidas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Vieša grupės nuoroda</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={publicViewLink} 
                      readOnly 
                      className="flex-1 bg-muted"
                    />
                    <Button 
                      onClick={handleCopyPublicLink} 
                      variant="outline" 
                      size="icon"
                      title="Kopijuoti nuorodą"
                    >
                      {publicLinkCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-900">
                    <strong>Pastaba:</strong> Ši nuoroda:
                  </p>
                  <ul className="text-sm text-amber-800 mt-2 ml-4 space-y-1 list-disc">
                    <li>Leidžia matyti <strong>tik išlaidas</strong> (eurais)</li>
                    <li>Neleidžia matyti narių balansų</li>
                    <li>Neleidžia pridėti ar redaguoti išlaidų</li>
                    <li>Neleidžia matyti pokalbių</li>
                    <li>Galioja visada (niekada nebaigiasi)</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleCopyPublicLink} 
                  className="w-full"
                  variant="default"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopijuoti viešą nuorodą
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}