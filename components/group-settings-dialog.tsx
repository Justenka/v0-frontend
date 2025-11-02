"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, UserPlus, Shield, Trash2, Link2, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import type { UserRole } from "@/types/user"

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  groupTitle: string
  members: Array<{ id: string; name: string; email: string; role: UserRole }>
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
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("member")
  const [inviteLink, setInviteLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  const canManageMembers = currentUserRole === "admin"

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

  const handleGenerateInviteLink = () => {
    // Mock: Generate invite link
    const link = `${window.location.origin}/groups/${groupId}/join?token=${Math.random().toString(36).substring(7)}`
    setInviteLink(link)
    toast.success("Invite link generated!")

    // Real implementation:
    /*
    // Generate unique invite token
    const { data, error } = await supabase
      .from('group_invites')
      .insert({
        group_id: groupId,
        created_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        max_uses: 10
      })
      .select()
      .single()

    if (data) {
      const link = `${window.location.origin}/groups/${groupId}/join?token=${data.token}`
      setInviteLink(link)
    }
    */
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
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

  return (
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Nariai ({members.length})</TabsTrigger>
            <TabsTrigger value="invite">Pakviesti</TabsTrigger>
            <TabsTrigger value="link">Kvietimo nuoroda</TabsTrigger>
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

          <TabsContent value="invite" className="space-y-4 mt-4">
            {canManageMembers ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">El. paštas</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="vardas@pavyzdys.lt"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Rolė</Label>
                    <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                      <SelectTrigger id="invite-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administratorius</SelectItem>
                        <SelectItem value="member">Narys</SelectItem>
                        <SelectItem value="guest">Svečias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleInviteMember} disabled={!inviteEmail} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Siųsti kvietimą
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">Tik administratoriai gali kviesti narius</div>
            )}
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            {canManageMembers ? (
              <>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Link2 className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 mb-1">Kvietimo nuoroda</p>
                        <p className="text-blue-800">
                          Sukurkite kvietimo nuorodą, kurią galite dalintis su draugais. Bet kas su šia nuoroda galės
                          prisijungti prie grupės.
                        </p>
                      </div>
                    </div>
                  </div>

                  {!inviteLink ? (
                    <Button onClick={handleGenerateInviteLink} className="w-full">
                      <Link2 className="h-4 w-4 mr-2" />
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
                        Ši nuoroda galioja 7 dienas ir gali būti panaudota iki 10 kartų.
                      </p>
                      <Button onClick={handleGenerateInviteLink} variant="outline" className="w-full bg-transparent">
                        Generuoti naują nuorodą
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                Tik administratoriai gali generuoti kvietimo nuorodas
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
