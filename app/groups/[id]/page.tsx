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
import { EditTransactionDialog } from "@/components/edit-transaction-dialog"
import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types/user"
import PaymentHistory from "@/components/payment-history"
import type { BackendGroupForUser } from "@/types/backend"
import type { Category } from "@/types/category"
import { toast } from "sonner"

export default function GroupPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const groupId = params?.id ? Number.parseInt(params.id as string) : Number.NaN

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole>("guest") // Pridėkite naują state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "chat">("overview")

  const [editDialog, setEditDialog] = useState<{
    open: boolean
    transaction: Transaction | null
  }>({ open: false, transaction: null })

  // Auth guard
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Mapinam narius settings dialogui
  // Kol kas naudojame placeholder email ir role, vėliau reikės gauti iš backend'o
  const groupMembers = members.map((member) => ({
    id: member.id.toString(),
    name: member.name,
    email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    role: "member" as UserRole, // TODO: gauti realią rolę iš backend'o
  }))

  useEffect(() => {
    if (!groupId || Number.isNaN(groupId)) return
    if (typeof window === "undefined") return

    const key = `group-${groupId}-tab`
    const saved = window.localStorage.getItem(key)
    if (saved === "chat" || saved === "overview") {
      setActiveTab(saved)
    }
  }, [groupId])

  const handleTabChange = (value: string) => {
    const val = value === "chat" ? "chat" : "overview"
    setActiveTab(val)

    if (typeof window !== "undefined" && groupId && !Number.isNaN(groupId)) {
      const key = `group-${groupId}-tab`
      window.localStorage.setItem(key, val)
    }
  }

  useEffect(() => {
  const fetchData = async () => {
    // jei groupId neteisingas – išeinam
    if (!groupId || Number.isNaN(groupId)) {
      console.error("Group id is invalid")
      setLoading(false)
      return
    }

    // kol auth dar kraunasi – nieko nedarom
    if (isLoading) return

    // jei user nėra – nieko nefetchinam, auth guard viršuje pats nuves į /login
    if (!user) return

    try {
      // Fetch globalios kategorijos
      try {
        const allCategories = await groupApi.getCategories()
        setCategories(allCategories)
      } catch (error) {
        console.error("Nepavyko įkelti kategorijų:", error)
      }

      const userId = Number(user.id)
      console.log("User role:", user.id)

      try {
        const role = await groupApi.getUserRoleInGroup(groupId, userId)
        setUserRole(role)
        console.log("User role in group:", role)
      } catch (error) {
        console.error("Nepavyko gauti vartotojo rolės:", error)
        setUserRole("guest")
      }

      const backendGroups: BackendGroupForUser[] =
        await groupApi.getUserGroupsBackend(userId)

      const backendGroup = backendGroups.find((g) => g.id_grupe === groupId)
      if (!backendGroup) {
        console.error("Group not found in backend")
        setGroup(null)
        setLoading(false)
        return
      }

      const debts = await groupApi.getDebtsByGroup(groupId)

      const mappedTransactions = debts.map((d: any) => ({
        id: d.id_skola,
        title: d.pavadinimas,
        description: d.aprasymas || "",
        amount: Number(d.suma),
        currency:
          d.valiutos_kodas === 1
            ? "EUR"
            : d.valiutos_kodas === 2
            ? "USD"
            : "PLN",
        date: d.sukurimo_data,
        paidBy: `${d.creator_vardas} ${d.creator_pavarde}`,
        categoryId: d.kategorija ? String(d.kategorija) : null,
        splitType: "Lygiai",
      }))

      const groupData: Group = {
        id: backendGroup.id_grupe,
        title: backendGroup.pavadinimas,
        description: backendGroup.aprasas ?? null,
        createdAt: backendGroup.sukurimo_data,

        ownerId: undefined,
        ownerFirstName: backendGroup.owner_vardas,
        ownerLastName: backendGroup.owner_pavarde,

        role: backendGroup.role,
        memberStatus: backendGroup.nario_busena,

        members: [],
        transactions: [],
        balance: 0,
      }

      const fullGroupData = await groupApi.getGroup(groupId)
      setGroup(fullGroupData)
      setMembers(fullGroupData.members || [])
      setTransactions(mappedTransactions)
    } catch (error) {
      console.error("Failed to load data:", error)
      setGroup(null)
    } finally {
      setLoading(false)
    }
  }

  if (groupId) {
    void fetchData()
  }
}, [groupId, router, user, isLoading])

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
    setEditDialog({ open: true, transaction })
  }

  const handleSaveEdit = async () => {
    try {
      const groupData = await groupApi.getGroup(groupId)
      if (groupData) {
        setGroup(groupData)
        setMembers(groupData.members || [])
      }

      const debts = await groupApi.getDebtsByGroup(groupId)
      const mappedTransactions = debts.map((d: any) => ({
        id: d.id_skola,
        title: d.pavadinimas,
        description: d.aprasymas || "",
        amount: Number(d.suma),
        currency:
          d.valiutos_kodas === 1 ? "EUR" :
            d.valiutos_kodas === 2 ? "USD" : "PLN",
        date: d.sukurimo_data,
        paidBy: `${d.creator_vardas} ${d.creator_pavarde}`,
        categoryId: d.kategorija ? String(d.kategorija) : null,
        splitType: "Lygiai"
      }))
      setTransactions(mappedTransactions)
    } catch (error) {
      console.error("Failed to refresh after edit:", error)
    }
  }

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!user) {
      toast.error("Neprisijungęs vartotojas")
      return
    }

    try {
      await groupApi.deleteDebt(transactionId, Number(user.id))

      // Pašaliname iš local state
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId))

      // Refresh grupės duomenis
      const groupData = await groupApi.getGroup(groupId)
      if (groupData) {
        setGroup(groupData)
        setMembers(groupData.members || [])
      }
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      throw error // Throw error kad TransactionsList gautų ir parodytų toast
    }
  }

  const refreshGroupData = async () => {
  try {
    if (!groupId || Number.isNaN(groupId)) return

    // Refresh group and members
    const groupData = await groupApi.getGroup(groupId)
    if (groupData) {
      setGroup(groupData)
      setMembers(groupData.members || [])
    }

    // Refresh transactions
    const debts = await groupApi.getDebtsByGroup(groupId)
    const mappedTransactions = debts.map((d: any) => ({
      id: d.id_skola,
      title: d.pavadinimas,
      description: d.aprasymas || "",
      amount: Number(d.suma),
      currency:
  d.valiutos_kodas === 1 ? "EUR" :
  d.valiutos_kodas === 2 ? "USD" :
  d.valiutos_kodas === 3 ? "PLN" :
  d.valiutos_kodas === 4 ? "GBP" :
  d.valiutos_kodas === 5 ? "JPY" :
  "UNKNOWN",
      date: d.sukurimo_data,
      paidBy: `${d.creator_vardas} ${d.creator_pavarde}`,
      categoryId: d.kategorija ? String(d.kategorija) : null,
      splitType: "Lygiai"
    }))
    setTransactions(mappedTransactions)
  } catch (error) {
    console.error("Failed to refresh group data:", error)
  }
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

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          Atgal į grupes
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{group.pavadinimas}</h1>
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
                members={members}
                categories={categories}
                userRole={userRole}
                currentUserId={user?.id ? Number(user.id) : undefined}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onSave={refreshGroupData} // Pridėkite šią eilutę
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

      <EditTransactionDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, transaction: null })}
        transaction={editDialog.transaction}
        members={members}
        categories={categories}
        onSave={handleSaveEdit}
      />

    </div>
  )
}