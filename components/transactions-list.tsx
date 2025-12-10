"use client"
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2, Search, Filter } from "lucide-react"
import type { Transaction } from "@/types/transaction"
import type { Member } from "@/types/member"
import { toast } from "sonner"
import { EditTransactionDialog } from "./edit-transaction-dialog"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types/user"
import { groupApi } from "@/services/group-api"

interface TransactionsListProps {
  transactions: Transaction[]
  members: Member[]
  categories: Array<{ id: string; name: string }>
  userRole: UserRole
  currentUserId?: number
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: number) => Promise<void>
}

export default function TransactionsList({
  transactions,
  members,
  categories,
  userRole,
  currentUserId,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  // Valiutų konvertavimas
  const [userCurrency, setUserCurrency] = useState<{ id: number; name: string } | null>(null)
  const [convertedAmounts, setConvertedAmounts] = useState<Record<number, number>>({})
  const [isConverting, setIsConverting] = useState(false)

  // Gauti vartotojo valiutą
  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (!user) return
      
      try {

        const userData = await fetch(`${API_BASE}/api/vartotojai/${user.id}`).then(r => r.json())
        const currencies = await groupApi.getAllCurrencies()
        
        const userCurr = currencies.find(c => c.id_valiuta === userData.valiutos_kodas)
        if (userCurr) {
          setUserCurrency({ id: userCurr.id_valiuta, name: userCurr.name })
        }
      } catch (error) {
        console.error("Nepavyko gauti vartotojo valiutos:", error)
      }
    }

    fetchUserCurrency()
  }, [user])

  // Konvertuoti transakcijas į vartotojo valiutą
  useEffect(() => {
    const convertTransactions = async () => {
      if (!userCurrency || transactions.length === 0) return

      setIsConverting(true)
      const converted: Record<number, number> = {}

      try {
        for (const transaction of transactions) {
          // Mapuojame valiutos kodą į id_valiuta
          const transactionCurrencyId = 
            transaction.currency === "EUR" ? 1 :
            transaction.currency === "USD" ? 2 :
            transaction.currency === "PLN" ? 3 : 1

          if (transactionCurrencyId === userCurrency.id) {
            // Ta pati valiuta, nereikia konvertuoti
            converted[transaction.id] = transaction.amount
          } else {
            // Konvertuojame
            const convertedAmount = await groupApi.convertCurrency(
              transaction.amount,
              transactionCurrencyId,
              userCurrency.id
            )
            converted[transaction.id] = convertedAmount
          }
        }

        setConvertedAmounts(converted)
      } catch (error) {
        console.error("Konvertavimo klaida:", error)
        toast.error("Nepavyko konvertuoti valiutų")
      } finally {
        setIsConverting(false)
      }
    }

    convertTransactions()
  }, [transactions, userCurrency])

  // Get unique payers for filter
  const uniquePayers = Array.from(new Set(transactions.map((t) => t.paidBy)))

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.paidBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterBy === "all" || transaction.paidBy === filterBy
    const matchesCategory = categoryFilter === "all" || transaction.categoryId === categoryFilter

    return matchesSearch && matchesFilter && matchesCategory
  })

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      case "date-asc":
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      case "amount-desc":
        return b.amount - a.amount
      case "amount-asc":
        return a.amount - b.amount
      default:
        return 0
    }
  })
  
  const canEditTransaction = (transaction: Transaction): boolean => {
    if (userRole === "guest") return false
    const isPayer = transaction.paidBy === user?.name
    return isPayer
  }

  const canDeleteTransaction = (transaction: Transaction): boolean => {
    if (userRole === "guest") return false
    const isAdmin = userRole === "admin"
    const isPayer = transaction.paidBy === user?.name
    return isAdmin || isPayer
  }

  const handleEdit = (transaction: Transaction) => {
    if (!canEditTransaction(transaction)) {
      toast.error("Tik mokėtojas gali redaguoti šią išlaidą")
      return
    }
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = (updatedTransaction: Transaction) => {
    onEdit?.(updatedTransaction)
  }

  const handleDelete = async (transaction: Transaction) => {
    if (!canDeleteTransaction(transaction)) {
      toast.error("Neturite teisės ištrinti šios išlaidos")
      return
    }

    if (!confirm("Ar tikrai norite ištrinti šią išlaidą?")) {
      return
    }

    setDeletingId(transaction.id)
    
    try {
      await onDelete?.(transaction.id)
      toast.success("Išlaida ištrinta")
    } catch (error: any) {
      console.error("Failed to delete transaction:", error)
      toast.error(error.message || "Nepavyko ištrinti išlaidos")
    } finally {
      setDeletingId(null)
    }
  }

  // Formatuojame sumą su vartotojo valiuta
  const formatAmount = (transaction: Transaction): string => {
    if (!userCurrency || isConverting) {
      return formatCurrency(transaction.amount, transaction.currency)
    }

    const convertedAmount = convertedAmounts[transaction.id]
    if (convertedAmount !== undefined) {
      return formatCurrency(convertedAmount, userCurrency.name)
    }

    return formatCurrency(transaction.amount, transaction.currency)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Išlaidų dar nėra</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Ieškoti išlaidų..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Pagal mokėtoją" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi</SelectItem>
                {uniquePayers.map((payer) => (
                  <SelectItem key={payer} value={payer}>
                    {payer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Pagal kategoriją" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos kategorijos</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id || `cat-${cat.name}`} value={cat.id || ""}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Naujausi</SelectItem>
                <SelectItem value="date-asc">Seniausi</SelectItem>
                <SelectItem value="amount-desc">Suma ↓</SelectItem>
                <SelectItem value="amount-asc">Suma ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Currency display notice */}
        {userCurrency && (
          <p className="text-xs text-muted-foreground">
            Visos sumos rodomos: {userCurrency.name}
          </p>
        )}

        {/* Results count */}
        {searchQuery || filterBy !== "all" || categoryFilter !== "all" ? (
          <p className="text-sm text-gray-600">
            Rasta {sortedTransactions.length} iš {transactions.length} išlaidų
          </p>
        ) : null}

        {/* Transactions List */}
        <div className="space-y-3">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Išlaidų nerasta</p>
            </div>
          ) : (
            sortedTransactions.map((transaction) => {
              const canEdit = canEditTransaction(transaction)
              const canDelete = canDeleteTransaction(transaction)
              const showMenu = canEdit || canDelete

              return (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium">{transaction.title}</h3>
                          {showMenu && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  disabled={deletingId === transaction.id}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Redaguoti
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(transaction)} 
                                    className="text-red-600"
                                    disabled={deletingId === transaction.id}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deletingId === transaction.id ? "Trinamas..." : "Ištrinti"}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString("lt-LT")}
                          </p>
                          <span className="text-gray-300">•</span>
                          <Badge variant="secondary" className="text-xs">
                            Mokėjo: {transaction.paidBy}
                          </Badge>
                          {transaction.categoryId && (
                            <>
                              <span className="text-gray-300">•</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.categoryName ||
                                  categories.find((c) => c.id === transaction.categoryId)?.name ||
                                  "Be kategorijos"}
                              </Badge>
                            </>
                          )}
                          {/* Originalios valiutos indikatorius */}
                          {transaction.currency !== userCurrency?.name && (
                            <>
                              <span className="text-gray-300">•</span>
                              <Badge variant="outline" className="text-xs text-gray-500">
                                Orig: {formatCurrency(transaction.amount, transaction.currency)}
                              </Badge>
                            </>
                          )}
                        </div>
                        {transaction.lateFee && transaction.lateFeeDays && (
                          <Badge variant="outline" className="mt-2 text-yellow-700 border-yellow-300">
                            Delspinigiai: {formatCurrency(transaction.lateFee)} po {transaction.lateFeeDays}d
                          </Badge>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-lg">
                          {formatAmount(transaction)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={editingTransaction}
        members={members}
        categories={categories}
        onSave={handleSaveEdit}
      />
    </>
  )
}

function formatCurrency(amount: number, currencyCode = "EUR"): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}