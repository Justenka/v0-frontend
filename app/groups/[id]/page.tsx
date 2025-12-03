"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PlusCircle,
  ArrowLeftCircle,
  UserPlus,
  Settings,
  MessageSquare,
  FileText,
  History,
} from "lucide-react"
import type { Group } from "@/types/group"
import type { Member } from "@/types/member"
import type { Transaction } from "@/types/transaction"
import MembersList from "@/components/members-list"
import TransactionsList from "@/components/transactions-list"
import AddMemberDialog from "@/components/add-member-dialog"
import { GroupSettingsDialog } from "@/components/group-settings-dialog"
import { GroupChat } from "@/components/group-chat"
import { groupApi } from "@/services/api-client"
import { useAuth } from "@/contexts/auth-context"
import { mockGroupPermissions, mockUsers, mockCategories } from "@/lib/mock-data"
import type { UserRole } from "@/types/user"
import PaymentHistory from "@/components/payment-history"
import type { BackendGroupForUser } from "@/types/backend"

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  const groupId = params?.id ? Number.parseInt(params.id as string) : Number.NaN
  const categories = mockCategories

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // NAUJAS – teisingas būdas gauti rolę
  const groupMembers = members.map((member) => {
    const memberUser = mockUsers.find((u) => u.name === member.name)
    const permission = mockGroupPermissions.find(
      (p) => p.groupId === groupId.toString() && p.userId === memberUser?.id,
    )
    return {
      id: memberUser?.id || member.id.toString(),
      name: member.name,
      email: memberUser?.email || `${member.name.toLowerCase()}@example.com`,
      role: permission?.role || ("member" as UserRole),
    }
  })

const currentUserMember = groupMembers.find((m) =>
  Number(m.id) === Number(user?.id)
)

const userRole: UserRole = currentUserMember
  ? (currentUserMember.role === "admin" ? "admin" : "member")
  : "guest"

    useEffect(() => {
    const fetchData = async () => {
      try {
        if (!groupId || Number.isNaN(groupId)) {
          console.error("Group id is invalid")
          setLoading(false)
          return
        }

        if (authLoading) return

        if (!user) {
          // jei vartotojas neprisijungęs – metam į login
          router.push("/login")
          setLoading(false)
          return
        }

        const userId = Number(user.id)
        const backendGroups: BackendGroupForUser[] = await groupApi.getUserGroupsBackend(userId)

        const backendGroup = backendGroups.find((g) => g.id_grupe === groupId)
        if (!backendGroup) {
          console.error("Group not found in backend")
          setGroup(null)
          setLoading(false)
          return
        }

        // Mapinam į Group tipą, kad likęs UI veiktų
        const groupData: Group = {
          id: backendGroup.id_grupe, // number
          title: backendGroup.pavadinimas,
          description: backendGroup.aprasas ?? null,
          createdAt: backendGroup.sukurimo_data,

          ownerId: undefined, // jei SELECT'e neturi fk_id_vartotojas, paliekam kol kas
          ownerFirstName: backendGroup.owner_vardas,
          ownerLastName: backendGroup.owner_pavarde,

          role: backendGroup.role,
          memberStatus: backendGroup.nario_busena,

          // frontend logika – kol kas tuščia, kol neprijungsim realių narių / skolų iš DB
          members: [],
          transactions: [],
          balance: 0,
        }
        // Po to, kai gavai backendGroup...
        const fullGroupData = await groupApi.getGroup(groupId)
        setGroup(fullGroupData)
        setMembers(fullGroupData.members || [])
        setTransactions(groupData.transactions || [])
      } catch (error) {
        console.error("Failed to load data:", error)
        setGroup(null)
      } finally {
        setLoading(false)
      }
    }

    if (groupId) {
      fetchData()
    }
  }, [groupId, router, user])

  const handleAddMember = async (name: string): Promise<boolean> => {
    if (userRole === "guest") {
      alert("Svečiai negali pridėti narių")
      return false
    }

    try {
      const normalizedName = name.toLowerCase()
      const isDuplicate = members.some((member) => member.name.toLowerCase() === normalizedName)

      if (isDuplicate) {
        return false
      }

      const updatedGroup = await groupApi.addMember(groupId, name)
      if (updatedGroup) {
        setMembers(updatedGroup.members)
        setIsAddMemberOpen(false)
        return true
      }
      return false
    } catch (error) {
      console.error("Failed to add member:", error)
      return false
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (userRole !== "admin") {
      alert("Tik administratoriai gali šalinti narius")
      return
    }

    await groupApi.removeMember(groupId, memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleSettleUp = async (memberId: number, amount: number) => {
    await groupApi.settleUp(groupId, memberId)

    try {
      const groupData = await groupApi.getGroup(groupId)
      if (!groupData) throw new Error("Failed to refresh group data")
      setGroup(groupData)
      setMembers(groupData.members || [])
      setTransactions((groupData as any).transactions || [])
    } catch (err) {
      console.error("Failed to refresh group after settle:", err)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    console.log("Edit transaction:", transaction)
  }

  const handleDeleteTransaction = (transactionId: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId))
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-muted rounded mb-8"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h2 className="text-2xl font-bold mb-4">Grupė nerasta</h2>
        <Link href="/">
          <Button>
            <ArrowLeftCircle className="mr-2 h-4 w-4" />
            Atgal į grupes
          </Button>
        </Link>
      </div>
    )
  }
  const canAddExpense = userRole !== "guest" && members.length > 0
  const canEdit = userRole === "admin"

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          Atgal į grupes
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{group.title}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/groups/${groupId}/reports`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Ataskaitos
              </Button>
            </Link>
            {userRole === "admin" && (
              <Link href={`/groups/${groupId}/history`}>
                <Button variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Istorija
                </Button>
              </Link>
            )}
            <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Nustatymai
            </Button>
            {canAddExpense ? (
              <Link href={`/groups/${groupId}/transactions/new`}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Pridėti išlaidą
                </Button>
              </Link>
            ) : (
              <Button
                disabled
                title={userRole === "guest" ? "Svečiai negali pridėti išlaidų" : "Pridėkite bent vieną narį"}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Pridėti išlaidą
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Apžvalga</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Pokalbiai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nariai</CardTitle>
                {userRole !== "guest" && (
                  <Button variant="outline" size="sm" onClick={() => setIsAddMemberOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Pridėti narį
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <MembersList members={members} onSettleUp={handleSettleUp} onRemoveMember={handleRemoveMember} />
            </CardContent>
          </Card>

          <PaymentHistory groupId={groupId} />

          <Card>
            <CardHeader>
              <CardTitle>Transakcijos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsList
                transactions={transactions}
                canEdit={canEdit}
                onEdit={handleEditTransaction}
                categories={categories}
                onDelete={handleDeleteTransaction}
                members={members}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Grupės pokalbiai</CardTitle>
            </CardHeader>
            <CardContent>
              <GroupChat groupId={groupId.toString()} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddMemberDialog
        open={isAddMemberOpen}
        onOpenChange={setIsAddMemberOpen}
        onAddMember={handleAddMember}
        existingMembers={members}
      />

      <GroupSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        groupId={groupId.toString()}
        groupTitle={group.title}
        members={groupMembers}
        currentUserRole={userRole}
      />
    </div>
  )
}
