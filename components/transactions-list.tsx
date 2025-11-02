"use client"

import { useState } from "react"
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

interface TransactionsListProps {
  transactions: Transaction[]
  members: Member[]
  categories: Array<{ id: string; name: string }>
  canEdit?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transactionId: number) => void
}

export default function TransactionsList({
  transactions,
  members,
  categories,
  canEdit = false,
  onEdit,
  onDelete,
}: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all") // 🆕 NEW STATE
  const [sortBy, setSortBy] = useState<string>("date-desc")
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Get unique payers for filter
  const uniquePayers = Array.from(new Set(transactions.map((t) => t.paidBy)))

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.paidBy.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = filterBy === "all" || transaction.paidBy === filterBy

    // 🆕 NEW: Filter by category
    const matchesCategory =
      categoryFilter === "all" || transaction.categoryId === categoryFilter

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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = (updatedTransaction: Transaction) => {
    onEdit?.(updatedTransaction)
  }

  const handleDelete = (transactionId: number) => {
    if (confirm("Ar tikrai norite ištrinti šią išlaidą?")) {
      onDelete?.(transactionId)
      toast.success("Išlaida ištrinta")
    }
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
            {/* Filter by payer */}
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

            {/* 🆕 Filter by category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Pagal kategoriją" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos kategorijos</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort by */}
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
            sortedTransactions.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{transaction.title}</h3>
                        {canEdit && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Redaguoti
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(transaction.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Ištrinti
                              </DropdownMenuItem>
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
                              {categories.find((c) => c.id === transaction.categoryId)?.name || "Kategorija"}
                            </Badge>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Padalinta: {transaction.splitType}</p>
                      {transaction.lateFee && transaction.lateFeeDays && (
                        <Badge variant="outline" className="mt-2 text-yellow-700 border-yellow-300">
                          Delspinigiai: {formatCurrency(transaction.lateFee)} po {transaction.lateFeeDays}d
                        </Badge>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-lg">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
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
