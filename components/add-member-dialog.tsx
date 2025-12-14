"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
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
import { AlertCircle, UserPlus, Link2, Copy, Check, Eye, X, Search } from "lucide-react"
import type { Member } from "@/types/member"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { groupApi } from "@/services/group-api"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMember: (nameOrEmail: string) => Promise<boolean>
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export default function AddMemberDialog({ open, onOpenChange, onAddMember, existingMembers, groupId }: AddMemberDialogProps) {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<"friends" | "manual" | "link" | "public">("friends")

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

  // ✅ NEW: search state
  const [friendSearch, setFriendSearch] = useState("")

  const publicViewLink = useMemo(() => {
    if (!groupId) return ""
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/groups/${groupId}`
  }, [groupId])

  useEffect(() => {
    if (!open) return
    setActiveTab("friends")
    setEmail("")
    setError(null)
    setInviteLink("")
    setSelectedFriend(null)
    setLinkCopied(false)
    setPublicLinkCopied(false)
    setFriendSearch("")
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

  const close = () => onOpenChange(false)
  const resetInlineError = () => setError(null)

  const getInitials = (fullName: string) =>
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("")

  const resolveAvatarSrc = (avatarUrl?: string | null) => {
    if (!avatarUrl) return ""
    let a = String(avatarUrl)

    if (!a.startsWith("/") && !a.startsWith("http://") && !a.startsWith("https://")) {
      a = `/uploads/avatars/${a}`
    }

    if (a.startsWith("/") && !a.startsWith("http://") && !a.startsWith("https://")) {
      a = `${API_BASE}${a}`
    }

    return a
  }

  const handleSubmitManual = async () => {
    const memberEmail = email.trim()
    if (!memberEmail) return

    const normalizedEmail = memberEmail.toLowerCase()
    const isDuplicate = existingMembers.some((m) => (m.email || "").toLowerCase() === normalizedEmail)
    if (isDuplicate) {
      setError(`Narys su el. paštu "${memberEmail}" jau yra šioje grupėje.`)
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const success = await onAddMember(memberEmail)
      if (success) {
        toast.success("Narys pridėtas")
        setEmail("")
        close()
      } else {
        setError("Nepavyko pridėti nario. Bandykite dar kartą.")
      }
    } catch (err: any) {
      console.error("Error adding member:", err)
      setError(err?.message || "Įvyko klaida. Bandykite dar kartą.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitFriend = async () => {
    if (!selectedFriend) return
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
      await groupApi.inviteFriendToGroup(Number(groupId), Number(selectedFriend), Number(user.id))
      toast.success("Kvietimas išsiųstas!")
      setSelectedFriend(null)
      close()
    } catch (err: any) {
      setError(err?.message || "Nepavyko išsiųsti kvietimo")
    } finally {
      setIsSubmitting(false)
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
      const { token } = await groupApi.createInvite(numericGroupId, Number(user.id))

      const link = `${window.location.origin}/groups/${numericGroupId}/join?token=${encodeURIComponent(token)}`
      setInviteLink(link)
      toast.success("Kvietimo nuoroda sugeneruota!")
    } catch (e: any) {
      setError(e?.message || "Nepavyko sugeneruoti kvietimo")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast.success("Nuoroda nukopijuota!")
      setTimeout(() => setLinkCopied(false), 1500)
    } catch {
      toast.error("Nepavyko nukopijuoti nuorodos")
    }
  }

  const handleCopyPublicLink = async () => {
    if (!publicViewLink) return
    try {
      await navigator.clipboard.writeText(publicViewLink)
      setPublicLinkCopied(true)
      toast.success("Vieša nuoroda nukopijuota!")
      setTimeout(() => setPublicLinkCopied(false), 1500)
    } catch {
      toast.error("Nepavyko nukopijuoti nuorodos")
    }
  }

  // ✅ NEW: filtered friends list by search
  const filteredFriends = useMemo(() => {
    const q = friendSearch.trim().toLowerCase()
    if (!q) return friends

    return friends.filter((f) => {
      const fullName = `${f.vardas} ${f.pavarde || ""}`.trim().toLowerCase()
      const email = (f.el_pastas || "").toLowerCase()
      return fullName.includes(q) || email.includes(q)
    })
  }, [friends, friendSearch])

  const footerPrimary = (() => {
    if (activeTab === "friends") {
      return {
        label: isSubmitting ? "Siunčiamas..." : "Pakviesti draugą",
        onClick: handleSubmitFriend,
        disabled: isSubmitting || !selectedFriend,
        icon: <UserPlus className="h-4 w-4 mr-2" />,
      }
    }

    if (activeTab === "manual") {
      return {
        label: isSubmitting ? "Pridedama..." : "Pridėti narį",
        onClick: handleSubmitManual,
        disabled: isSubmitting || !email.trim(),
        icon: <UserPlus className="h-4 w-4 mr-2" />,
      }
    }

    if (activeTab === "link") {
      if (!inviteLink) {
        return {
          label: isSubmitting ? "Generuojama..." : "Generuoti kvietimo nuorodą",
          onClick: handleGenerateInviteLink,
          disabled: isSubmitting,
          icon: <Link2 className="h-4 w-4 mr-2" />,
        }
      }
      return {
        label: linkCopied ? "Nukopijuota" : "Kopijuoti nuorodą",
        onClick: handleCopyInviteLink,
        disabled: isSubmitting || !inviteLink,
        icon: linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />,
      }
    }

    return {
      label: publicLinkCopied ? "Nukopijuota" : "Kopijuoti viešą nuorodą",
      onClick: handleCopyPublicLink,
      disabled: isSubmitting || !publicViewLink,
      icon: publicLinkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />,
    }
  })()

  const footerSecondary =
    activeTab === "link" && inviteLink
      ? {
          label: "Generuoti naują",
          onClick: handleGenerateInviteLink,
          disabled: isSubmitting,
        }
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col gap-0">
        <DialogHeader className="pb-3">
          <DialogTitle>Pridėti narį</DialogTitle>
          <DialogDescription>
            Pridėkite narį: pakvieskite draugą, įveskite el. paštą, sugeneruokite kvietimą arba pasidalinkite vieša peržiūros
            nuoroda.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="pb-3">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as any)
              resetInlineError()
            }}
            className="w-full h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friends">Iš draugų</TabsTrigger>
              <TabsTrigger value="manual">El. paštas</TabsTrigger>
              <TabsTrigger value="link">Kvietimas</TabsTrigger>
              <TabsTrigger value="public">Vieša</TabsTrigger>
            </TabsList>

            {/* --- Draugai --- */}
            <TabsContent value="friends" className="mt-4 flex-1 overflow-hidden flex flex-col gap-3">
              {/* ✅ NEW: search bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    placeholder="Ieškoti draugų pagal vardą arba el. paštą..."
                    className="pl-9"
                  />
                </div>

                {friendSearch.trim().length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFriendSearch("")}
                    className="shrink-0"
                    title="Išvalyti paiešką"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Valyti
                  </Button>
                )}
              </div>

              {/* ✅ scroll container */}
              <div className="flex-1 overflow-y-auto pr-2 [scrollbar-gutter:stable]">
                {isLoadingFriends ? (
                  <p className="text-sm text-muted-foreground">Kraunami draugai...</p>
                ) : friendsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{friendsError}</AlertDescription>
                  </Alert>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    {friends.length === 0 ? "Draugų sąrašas tuščias." : "Nieko nerasta pagal paiešką."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map((friend) => {
                      const fullName = `${friend.vardas} ${friend.pavarde || ""}`.trim()
                      const idStr = String(friend.id_vartotojas)
                      const selected = selectedFriend === idStr
                      const avatarSrc = resolveAvatarSrc(friend.avatar_url)

                      return (
                        <button
                          key={friend.id_vartotojas}
                          type="button"
                          onClick={() => setSelectedFriend(selected ? null : idStr)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            selected ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarSrc || undefined} alt={fullName} />
                            <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 text-left">
                            <p className="font-medium">{fullName}</p>
                            <p className="text-sm text-muted-foreground">{friend.el_pastas}</p>
                          </div>

                          {selected && <UserPlus className="h-5 w-5 text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* --- Rankinis pridėjimas (email) --- */}
            <TabsContent value="manual" className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">El. paštas</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      resetInlineError()
                    }}
                    placeholder="pvz. vardas@email.com"
                    autoComplete="email"
                  />
                </div>

                <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Įvedus el. paštą narys bus pridedamas iš karto (jei toks vartotojas egzistuoja).
                </div>
              </div>
            </TabsContent>

            {/* --- Kvietimo nuoroda --- */}
            <TabsContent value="link" className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Link2 className="h-6 w-6 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Kvietimo nuoroda</p>
                    <p className="text-blue-800">Sugeneruokite kvietimo nuorodą. Su ja žmogus galės prisijungti prie grupės.</p>
                  </div>
                </div>
              </div>

              {inviteLink ? (
                <div className="space-y-2">
                  <Label>Kvietimo nuoroda</Label>
                  <div className="flex gap-2">
                    <Input value={inviteLink} readOnly className="flex-1" />
                    <Button onClick={handleCopyInviteLink} variant="outline" size="icon" type="button" title="Kopijuoti">
                      {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>

                  <p className="text-sm text-muted-foreground">Nuoroda galioja 7 dienas ir gali būti panaudota 1 kartą.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                  Paspauskite apačioje „Generuoti kvietimo nuorodą“.
                </div>
              )}
            </TabsContent>

            {/* --- Vieša peržiūros nuoroda --- */}
            <TabsContent value="public" className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Eye className="h-6 w-6 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Viešos peržiūros nuoroda</p>
                    <p className="text-green-800">
                      Su šia nuoroda galima <strong>tik peržiūrėti</strong> grupės išlaidas. Ji nesuteikia redagavimo teisių.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vieša grupės nuoroda</Label>
                <div className="flex gap-2">
                  <Input value={publicViewLink} readOnly className="flex-1 bg-muted" />
                  <Button onClick={handleCopyPublicLink} variant="outline" size="icon" type="button" title="Kopijuoti">
                    {publicLinkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t flex items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={isSubmitting} className="gap-2" title="Uždaryti">
            <X className="h-4 w-4" />
            Uždaryti
          </Button>

          <div className="flex items-center gap-2">
            {footerSecondary && (
              <Button type="button" variant="outline" onClick={footerSecondary.onClick} disabled={footerSecondary.disabled}>
                {footerSecondary.label}
              </Button>
            )}

            <Button type="button" onClick={footerPrimary.onClick} disabled={footerPrimary.disabled} className="min-w-[190px]">
              {footerPrimary.icon}
              {footerPrimary.label}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
