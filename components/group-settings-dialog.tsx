"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Shield, Trash2, AlertTriangle, UserMinus } from "lucide-react"
import { toast } from "sonner"
import type { UserRole } from "@/types/user"
import { groupApi } from "@/services/group-api"

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupTitle: string
  members: Array<{ id: string; name: string; email: string; role: UserRole; balance?: number }>
  currentUserRole: UserRole
  currentUserId: number
  onRolesUpdated?: () => void
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  groupId,
  groupTitle,
  members,
  currentUserRole,
  currentUserId,
  onRolesUpdated,
}: GroupSettingsDialogProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManageMembers = currentUserRole === "admin"
  const [membersState, setMembersState] = useState(members)

  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // remove member confirm
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string; role: UserRole } | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)

  // ✅ per-member remove errors (rodoma tame pačiame nario box'e)
  const [removeErrorByMemberId, setRemoveErrorByMemberId] = useState<Record<string, string>>({})

  useEffect(() => {
    setMembersState(members)
    setRemoveErrorByMemberId({})
  }, [members])

  const canDeleteGroup = () => {
    if (!canManageMembers) return { canDelete: false, reason: "Tik administratoriai gali ištrinti grupę" }
    if (members.length === 1) return { canDelete: true, reason: "" }

    const hasUnpaidDebts = members.some((m) => typeof m.balance === "number" && Math.abs(m.balance) > 0.01)
    if (hasUnpaidDebts) return { canDelete: false, reason: "Negalima ištrinti grupės, kol yra neapmokėtų skolų" }

    return { canDelete: true, reason: "" }
  }

  const deleteStatus = canDeleteGroup()

  const canLeaveGroup = () => {
    if (membersState.length === 1) {
      return { canLeave: false, reason: "Jūs esate vienintelis narys — tokiu atveju ištrinkite grupę." }
    }

    const me = membersState.find((m) => m.id === String(currentUserId))
    const myBalanceKnown = me?.balance !== undefined && me?.balance !== null
    const myBalance = Number(me?.balance ?? 0)

    if (!myBalanceKnown) {
      return { canLeave: false, reason: "Nepavyko nustatyti balanso. Atnaujinkite puslapį." }
    }

    if (Math.abs(myBalance) > 0.01) {
      return { canLeave: false, reason: "Negalite palikti grupės, kol neatsiskaitėte (balansas turi būti 0)." }
    }

    if (currentUserRole === "admin") {
      const adminCount = membersState.filter((m) => m.role === "admin").length
      if (adminCount <= 1) {
        return { canLeave: false, reason: "Esate vienintelis administratorius. Pirma perduokite admin teises kitam nariui." }
      }
    }

    return { canLeave: true, reason: "" }
  }

  const leaveStatus = canLeaveGroup()

  const handleLeaveGroup = async () => {
    setIsLeaving(true)
    try {
      await groupApi.leaveGroup(Number(groupId), currentUserId)
      toast.success("Palikote grupę")
      onOpenChange(false)
      router.push("/")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Nepavyko palikti grupės")
    } finally {
      setIsLeaving(false)
      setShowLeaveDialog(false)
    }
  }

  const handleChangeRole = async (memberId: string, newRole: UserRole) => {
    if (!canManageMembers) return

    if (!currentUserId) {
      toast.error("Turite būti prisijungęs")
      return
    }

    try {
      const res = await groupApi.updateMemberRole(Number(groupId), Number(memberId), newRole, currentUserId)

      setMembersState((prev) => {
        if (res?.transferred) {
          return prev.map((m) => {
            if (m.id === memberId) return { ...m, role: "admin" as UserRole }
            if (m.id === String(currentUserId)) return { ...m, role: "member" as UserRole }
            return m
          })
        }
        return prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      })

      toast.success("Nario rolė pakeista")
    } catch (e: any) {
      toast.error(e?.message || "Nepavyko pakeisti rolės")
    }

    if (onRolesUpdated) onRolesUpdated()
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "default"
      case "member":
        return "secondary"
      case "guest":
        return "outline"
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Administratorius"
      case "member":
        return "Narys"
      case "guest":
        return "Svečias"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleDeleteGroup = async () => {
    setIsDeleting(true)
    try {
      await groupApi.deleteGroup(Number.parseInt(groupId))
      toast.success("Grupė sėkmingai ištrinta")
      onOpenChange(false)
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("Nepavyko ištrinti grupės")
      console.error("[v0] Error deleting group:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // ✅ gražinam žmogui suprantamą pašalinimo klaidą
  const explainRemoveError = (raw: string) => {
    const msg = (raw || "").toLowerCase()

    if (msg.includes("atsiskait") || msg.includes("neapmok") || msg.includes("skol")) {
      return "Negalima pašalinti, nes šis narys dar nėra pilnai atsiskaitęs su grupės nariais."
    }
    if (msg.includes("paskutin") && msg.includes("administrator")) {
      return "Negalima pašalinti, nes tai paskutinis administratorius. Pirma priskirkite admin kitam nariui."
    }
    if (msg.includes("savinink") || msg.includes("owner")) {
      return "Negalima pašalinti grupės savininko. Pirma perduokite administratoriaus teises/owner kitam nariui."
    }
    if (msg.includes("tik administrator")) {
      return "Tik administratoriai gali šalinti narius."
    }

    return raw || "Nepavyko pašalinti nario."
  }

  // ✅ click ant "Pašalinti": nieko nerašom boxe, bet jei yra klaida – parodom tame boxe
  const handleRemoveClick = (member: { id: string; name: string; role: UserRole }) => {
    // išvalom konkretaus nario seną klaidą
    setRemoveErrorByMemberId((prev) => {
      const next = { ...prev }
      delete next[member.id]
      return next
    })

    if (!canManageMembers) {
      setRemoveErrorByMemberId((prev) => ({ ...prev, [member.id]: "Tik administratoriai gali šalinti narius." }))
      return
    }

    // neleidžiam pašalinti savęs, jei esi vienintelis admin
    const isSelfAdmin = member.id === String(currentUserId) && member.role === "admin"
    if (isSelfAdmin) {
      const adminCount = membersState.filter((m) => m.role === "admin").length
      if (adminCount <= 1) {
        setRemoveErrorByMemberId((prev) => ({
          ...prev,
          [member.id]: "Negalite pašalinti savęs, nes esate vienintelis administratorius. Pirma perduokite admin teises kitam nariui.",
        }))
        return
      }
    }

    setRemoveTarget({ id: member.id, name: member.name, role: member.role })
    setRemoveDialogOpen(true)
  }

  const handleRemoveMemberConfirmed = async () => {
    if (!canManageMembers) return
    if (!removeTarget) return

    const memberIdNum = Number(removeTarget.id)
    if (!memberIdNum) {
      toast.error("Blogas nario ID")
      return
    }

    setIsRemoving(true)
    try {
      await groupApi.removeMember(Number(groupId), memberIdNum, currentUserId)

      setMembersState((prev) => prev.filter((m) => m.id !== removeTarget.id))

      // išvalom jo klaidą, jei buvo
      setRemoveErrorByMemberId((prev) => {
        const next = { ...prev }
        delete next[removeTarget.id]
        return next
      })

      toast.success("Narys pašalintas")
      setRemoveDialogOpen(false)
      setRemoveTarget(null)

      if (onRolesUpdated) onRolesUpdated()
    } catch (e: any) {
      const pretty = explainRemoveError(e?.message || "")
      setRemoveErrorByMemberId((prev) => ({ ...prev, [removeTarget.id]: pretty }))
      setRemoveDialogOpen(false) // uždarom confirm, o paaiškinimą rodom nario box'e
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Grupės nustatymai
            </DialogTitle>
            <DialogDescription>Valdykite grupės narius ir teises</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="members" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Nariai ({membersState.length})</TabsTrigger>
              <TabsTrigger value="danger" className="text-red-600">
                Pavojinga zona
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4 mt-4">
              <div className="space-y-3">
                {membersState.map((member) => {
                  const isSelf = member.id === String(currentUserId)
                  const isSelfAdmin = isSelf && member.role === "admin"

                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {canManageMembers ? (
                            <>
                              <Select
                                value={member.role}
                                disabled={isSelfAdmin}
                                onValueChange={(value) => handleChangeRole(member.id, value as UserRole)}
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administratorius</SelectItem>
                                  <SelectItem value="member">Narys</SelectItem>
                                  <SelectItem value="guest">Svečias</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveClick({ id: member.id, name: member.name, role: member.role })}
                                disabled={isSelfAdmin}
                                title={
                                  isSelfAdmin
                                    ? "Pirmiausia perduokite admin teises kitam nariui"
                                    : "Pašalinti narį"
                                }
                              >
                                <UserMinus className="h-4 w-4 mr-2" />
                                Pašalinti
                              </Button>
                            </>
                          ) : (
                            <Badge variant={getRoleBadgeVariant(member.role)}>{getRoleLabel(member.role)}</Badge>
                          )}
                        </div>

                        {/* ✅ čia “tas pats boxas”: default tuščias, bet jei klaida – rodome */}
                        {!!removeErrorByMemberId[member.id] && (
                          <div className="max-w-[360px] rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                            {removeErrorByMemberId[member.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Teisių lygiai:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>
                        <strong>Administratorius:</strong> Gali valdyti narius, redaguoti ir trinti išlaidas
                      </li>
                      <li>
                        <strong>Narys:</strong> Gali pridėti išlaidas ir peržiūrėti grupę
                      </li>
                      <li>
                        <strong>Svečias:</strong> Gali tik peržiūrėti grupę
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-slate-700 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-900 mb-1">Administratoriaus teisių perdavimas</p>
                    <p className="text-slate-700">
                      Jei esate vienintelis administratorius, negalėsite palikti grupės ar pašalinti savęs, kol nepriskirsite
                      „Administratorius“ rolės kitam nariui. Pasirinkite narį sąraše ir pakeiskite jo rolę į „Administratorius“.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="danger" className="space-y-4 mt-6">
              <div className="p-5 border border-orange-300 rounded-lg bg-orange-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-orange-800">Palikti grupę</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {leaveStatus.canLeave
                        ? "Jūs išeisite iš grupės ir nebegalėsite jos matyti, kol vėl nebūsite pakviestas."
                        : leaveStatus.reason}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowLeaveDialog(true)} disabled={!leaveStatus.canLeave}>
                    Palikti
                  </Button>
                </div>
              </div>

              <div className="p-5 border border-red-300 rounded-lg bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800">Ištrinti grupę</h3>
                    <p className="text-sm text-red-700 mt-1">
                      {deleteStatus.canDelete ? "Šis veiksmas negrįžtamas. Visi duomenys bus prarasti." : deleteStatus.reason}
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={!deleteStatus.canDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Ištrinti
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Remove member confirm */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Pašalinti narį?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {removeTarget ? (
                  <div>
                    Jūs ketinate pašalinti narį: <span className="font-medium">{removeTarget.name}</span>.
                  </div>
                ) : (
                  <div>Pasirinkite narį.</div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMemberConfirmed}
              disabled={isRemoving || !removeTarget}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? "Šalinama..." : "Taip, pašalinti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Ar tikrai norite ištrinti šią grupę?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>Jūs ketinate ištrinti grupę.</div>
                <div className="text-red-600 font-medium">
                  Šis veiksmas negrįžtamas. Visi duomenys, įskaitant išlaidas, pranešimus ir istoriją, bus prarasti.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Trinamas..." : "Taip, ištrinti grupę"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave group */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Ar tikrai norite palikti šią grupę?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Jūs ketinate palikti grupę. Vėliau prisijungti galėsite tik gavę kvietimą.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Atšaukti</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLeaving ? "Paliekama..." : "Taip, palikti grupę"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
