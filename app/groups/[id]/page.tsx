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
  Lock,
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
  const [userRole, setUserRole] = useState<UserRole>("guest")
  const [isPublicView, setIsPublicView] = useState(false) // NAUJAS STATE
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "chat">("overview")

  const [editDialog, setEditDialog] = useState<{
    open: boolean
    transaction: Transaction | null
  }>({ open: false, transaction: null })

  // Auth guard - PAKEISTAS: nebenukreipia į login jei nėra user
  useEffect(() => {
    if (!isLoading && !user) {
      // Jei nėra vartotojo, leidžiame viešą peržiūrą
      setIsPublicView(true)
      setUserRole("guest")
    }
  }, [isLoading, user])

  const groupMembers = members.map((member) => ({
    id: member.id.toString(),
    name: member.name,
    email: member.email,
    role: member.role,
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
      if (!groupId || Number.isNaN(groupId)) {
        console.error("Group id is invalid")
        setLoading(false)
        return
      }

      if (isLoading) return

      try {
        // Fetch globalios kategorijos
        try {
          const allCategories = await groupApi.getCategories()
          setCategories(allCategories)
        } catch (error) {
          console.error("Nepavyko įkelti kategorijų:", error)
        }

        // PAKEISTA LOGIKA: jei user yra, gauname rolę, jei ne - guest
        if (user) {
          const userId = Number(user.id)
          
          try {
            const role = await groupApi.getUserRoleInGroup(groupId, userId)
            setUserRole(role)
            setIsPublicView(false)
          } catch (error) {
            console.error("Nepavyko gauti vartotojo rolės:", error)
            setUserRole("guest")
            setIsPublicView(true)
          }
        } else {
          // Nėra user - viešas režimas
          setIsPublicView(true)
          setUserRole("guest")
        }

        // Gauname grupės duomenis (dabar veikia ir be autentifikacijos)
        const fullGroupData = await groupApi.getGroup(groupId)
        setGroup(fullGroupData)
        setMembers(fullGroupData.members || [])
        
        // Jei yra transactions iš backend (naujas endpoint turi juos)
        if (fullGroupData.transactions) {
          setTransactions(fullGroupData.transactions)
        } else {
          // Fallback - gauname per debts endpoint
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
              d.valiutos_kodas === 5 ? "JPY" : "UNKNOWN",
            date: d.sukurimo_data,
            paidBy: `${d.creator_vardas} ${d.creator_pavarde}`,
            categoryId: d.kategorija ? String(d.kategorija) : null,
            splitType: "Lygiai",
          }))
          setTransactions(mappedTransactions)
        }
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
    if (!user) {
      toast.error("Neprisijungęs vartotojas")
      return false
    }

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

      const updatedGroup = await groupApi.addMember(groupId, name, Number(user.id))
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
    if (!user) {
      toast.error("Neprisijungęs vartotojas")
      return false
    }

    if (userRole !== "admin") {
      alert("Tik administratoriai gali šalinti narius")
      return
    }

    await groupApi.removeMember(groupId, memberId, Number(user.id))
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleSettleUp = async (memberId: number, amount: number) => {
    if (!user) {
      toast.error("Neprisijungęs vartotojas")
      return
    }

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
    if (!user) {
      toast.error("Prisijunkite norėdami redaguoti")
      return
    }
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
          d.valiutos_kodas === 2 ? "USD" : 
          d.valiutos_kodas === 3 ? "PLN" :
          d.valiutos_kodas === 4 ? "GBP" :
          d.valiutos_kodas === 5 ? "JPY" : "UNKNOWN",
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
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId))

      const groupData = await groupApi.getGroup(groupId)
      if (groupData) {
        setGroup(groupData)
        setMembers(groupData.members || [])
      }
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      throw error
    }
  }

  const refreshGroupData = async () => {
    try {
      if (!groupId || Number.isNaN(groupId)) return

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
          d.valiutos_kodas === 2 ? "USD" :
          d.valiutos_kodas === 3 ? "PLN" :
          d.valiutos_kodas === 4 ? "GBP" :
          d.valiutos_kodas === 5 ? "JPY" : "UNKNOWN",
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
      {/* NAUJAS: Viešo režimo indikatorius */}
      {isPublicView && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          <Lock className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Peržiūrite grupę kaip svečias
            </p>
            <p className="text-xs text-blue-700">
              Prisijunkite norėdami pridėti išlaidas ar valdyti grupę
            </p>
          </div>
          <Link href="/login">
            <Button size="sm" variant="default">
              Prisijungti
            </Button>
          </Link>
        </div>
      )}

      <div className="mb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          Atgal į grupes
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{group.pavadinimas}</h1>
          <div className="flex items-center gap-2">
            {!isPublicView && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Apžvalga</TabsTrigger>
          {!isPublicView && (
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Pokalbiai
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Nariai - rodome tik viešoje peržiūroje be balansų */}
          {!isPublicView && (
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
                <MembersList 
                  members={members} 
                  onSettleUp={handleSettleUp} 
                  onRemoveMember={handleRemoveMember} 
                  groupId={groupId}
                  onBalanceUpdate={refreshGroupData}
                />
              </CardContent>
            </Card>
          )}

          {!isPublicView && <PaymentHistory groupId={groupId} />}

          {/* Išlaidos - rodoma VISIEMS (ir viešai) */}
          <Card>
            <CardHeader>
              <CardTitle>Išlaidos</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsList
                transactions={transactions}
                members={members}
                categories={categories}
                userRole={userRole}
                groupId={groupId}
                currentUserId={user?.id ? Number(user.id) : undefined}
                onEdit={isPublicView ? undefined : handleEditTransaction}
                onDelete={isPublicView ? undefined : handleDeleteTransaction}
                onSave={refreshGroupData}
                isPublicView={isPublicView}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {!isPublicView && (
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
        )}
      </Tabs>

      {!isPublicView && (
        <>
          <AddMemberDialog
            open={isAddMemberOpen}
            onOpenChange={setIsAddMemberOpen}
            onAddMember={handleAddMember}
            existingMembers={members}
            groupId={groupId.toString()}
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
            categories={categories}
            groupId={groupId}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </div>
  )
}