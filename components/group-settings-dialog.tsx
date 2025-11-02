"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, UserPlus, Shield, Trash2, Link2, Copy, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import type { UserRole } from "@/types/user"
import { groupApi } from "@/services/api-client"

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupTitle: string
  members: Array<{ id: string; name: string; email: string; role: UserRole; balance?: number }>
  currentUserRole: UserRole
}

export function GroupSettingsDialog({
  open,
  onOpenChange,
  groupId,
  groupTitle,
  members,
  currentUserRole,
}: GroupSettingsDialogProps) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const canManageMembers = currentUserRole === "admin"

  const canDeleteGroup = () => {
    // Only admins can delete
    if (!canManageMembers) return { canDelete: false, reason: "Tik administratoriai gali ištrinti grupę" }

    // Check if user is the only member
    if (members.length === 1) return { canDelete: true, reason: "" }

    // Check if all balances are zero (no unpaid debts)
    const hasUnpaidDebts = members.some((m) => m.balance && Math.abs(m.balance) > 0.01)
    if (hasUnpaidDebts) {
      return { canDelete: false, reason: "Negalima ištrinti grupės, kol yra neapmokėtų skolų" }
    }

    return { canDelete: true, reason: "" }
  }

  const deleteStatus = canDeleteGroup()

  const handleInviteMember = () => {
    if (!inviteEmail) return

    // Mock: Send invitation
    toast.success(`Kvietimas išsiųstas ${inviteEmail}`)
    setInviteEmail("")

    // Real implementation:
    /*
    // Create invitation
    await supabase.from('group_invitations').insert({
      group_id: groupId,
      email: inviteEmail,
      role: inviteRole,
      invited_by: user.id
    })

    // Send notification
    const invitedUser = await supabase
      .from('users')
      .select('id')
      .eq('email', inviteEmail)
      .single()

    if (invitedUser.data) {
      await supabase.from('notifications').insert({
        user_id: invitedUser.data.id,
        type: 'group_invite',
        title: 'Group Invitation',
        message: `You've been invited to join ${groupTitle}`,
        action_url: `/groups/${groupId}/accept-invite`
      })
    }
    */
  }

  const handleChangeRole = (memberId: string, newRole: UserRole) => {
    toast.success("Narės rolė pakeista")

    // Real implementation:
    /*
    await supabase
      .from('group_permissions')
      .update({ role: newRole })
      .eq('group_id', groupId)
      .eq('user_id', memberId)
    */
  }

  const handleRemoveMember = (memberId: string) => {
    toast.success("Narys pašalintas iš grupės")

    // Real implementation:
    /*
    await supabase
      .from('group_permissions')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId)
    */
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
              <TabsTrigger value="members">Nariai ({members.length})</TabsTrigger>
              <TabsTrigger value="danger" className="text-red-600">Pavojinga zona</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="space-y-4 mt-4">
              <div className="space-y-3">
                {members.map((member) => (
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
                    <div className="flex items-center gap-2">
                      {canManageMembers ? (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleChangeRole(member.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administratorius</SelectItem>
                              <SelectItem value="member">Narys</SelectItem>
                              <SelectItem value="guest">Svečias</SelectItem>
                            </SelectContent>
                          </Select>
                          {member.role !== "admin" && (
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id)}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </>
                      ) : (
                        <Badge variant={getRoleBadgeVariant(member.role)}>{getRoleLabel(member.role)}</Badge>
                      )}
                    </div>
                  </div>
                ))}
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
            </TabsContent>
            <TabsContent value="danger" className="space-y-4 mt-6">
              <div className="p-5 border border-red-300 rounded-lg bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800">Ištrinti grupę</h3>
                    <p className="text-sm text-red-700 mt-1">
                      {deleteStatus.canDelete
                        ? "Šis veiksmas negrįžtamas. Visi duomenys bus prarasti."
                        : deleteStatus.reason}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={!deleteStatus.canDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Ištrinti
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Ar tikrai norite ištrinti šią grupę?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>
                  Jūs ketinate ištrinti grupę <strong>"{groupTitle}"</strong>.
                </div>
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
    </>
  )
}
