"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction } from "@/types/transaction"
import type { Member } from "@/types/member"
import { toast } from "sonner"
import { getSupportedCurrencies, type Currency } from "@/lib/currency-api"
import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context"

interface EditTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  members: Member[]
  categories: Array<{ id: string; name: string }>
  onSave: () => void
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  members,
  categories,
  onSave,
}: EditTransactionDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidByUserId, setPaidByUserId] = useState("")
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "custom">("equal")
  const [currency, setCurrency] = useState("EUR")
  const [categoryId, setCategoryId] = useState("")
  const [splits, setSplits] = useState<{ userId: number; amount: number; percentage: number }[]>([])
  const [fullDebtData, setFullDebtData] = useState<any>(null)
  const [supportedCurrencies, setSupportedCurrencies] = useState<Currency[]>([])
  const [loadingCurrencies, setLoadingCurrencies] = useState(true)

  // Load currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        setLoadingCurrencies(true)
        const currencies = await getSupportedCurrencies()
        setSupportedCurrencies(currencies)
      } catch (error) {
        console.error("Error loading currencies:", error)
        toast.error("Nepavyko įkelti valiutų")
      } finally {
        setLoadingCurrencies(false)
      }
    }

    loadCurrencies()
  }, [])

  useEffect(() => {
    if (transaction && open) {
      loadTransactionDetails()
    }
  }, [transaction, open])

  const loadTransactionDetails = async () => {
    if (!transaction) return

    try {
      const debtData = await groupApi.getDebt(transaction.id)
      setFullDebtData(debtData)

      setTitle(debtData.title)
      setAmount(debtData.amount.toString())
      setCurrency(debtData.currency || "EUR")
      setCategoryId(debtData.categoryId ? String(debtData.categoryId) : "")

      // Set splits
      if (debtData.splits && debtData.splits.length > 0) {
        setSplits(debtData.splits.map((s: any) => ({
          userId: s.userId,
          amount: s.amount || 0,
          percentage: s.percentage || 0,
        })))

        setSplitType("percentage")
        
      }
    } catch (error) {
      console.error("Failed to load transaction details:", error)
      toast.error("Nepavyko įkelti išlaidos duomenų")
    }
  }

  const handleSave = async () => {
    if (!transaction || !user) return

    const updatedAmount = parseFloat(amount)
    if (isNaN(updatedAmount) || updatedAmount <= 0) {
      toast.error("Įveskite teisingą sumą")
      return
    }

    if (!title.trim()) {
      toast.error("Įveskite pavadinimą")
      return
    }

    if (!paidByUserId) {
      toast.error("Pasirinkite kas mokėjo")
      return
    }

    setLoading(true)

    try {
      // Calculate splits based on type
      let calculatedSplits: { userId: number; amount?: number; percentage?: number }[] = []

      if (splitType === "equal") {
        const perPerson = updatedAmount / members.length
        calculatedSplits = members.map(m => ({
          userId: m.id,
          amount: perPerson,
          percentage: (100 / members.length),
        }))
      } else if (splitType === "percentage") {
        calculatedSplits = splits.map(s => ({
          userId: s.userId,
          percentage: s.percentage,
          amount: (updatedAmount * s.percentage) / 100,
        }))
      } else {
        calculatedSplits = splits.map(s => ({
          userId: s.userId,
          amount: s.amount,
          percentage: (s.amount / updatedAmount) * 100,
        }))
      }

      await groupApi.updateDebt(transaction.id, {
        title: title.trim(),
        amount: updatedAmount,
        currencyCode: currency,
        categoryId,
        splits: calculatedSplits,
        userId: Number(user.id),
      })

      toast.success("Išlaida atnaujinta")
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to update transaction:", error)
      toast.error(error.message || "Nepavyko atnaujinti išlaidos")
    } finally {
      setLoading(false)
    }
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redaguoti išlaidą</DialogTitle>
          <DialogDescription>Atnaujinkite išlaidos informaciją</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Pavadinimas</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Išlaidos pavadinimas"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Suma</Label>
              <Input
                id="edit-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Valiuta</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={loadingCurrencies}>
                <SelectTrigger id="edit-currency" className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-paidBy">Kas mokėjo</Label>
            <Select value={paidByUserId} onValueChange={setPaidByUserId}>
              <SelectTrigger id="edit-paidBy">
                <SelectValue placeholder="Pasirinkite" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Kategorija</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="edit-category">
                <SelectValue placeholder="Pasirinkite kategoriją" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Atšaukti
          </Button>
          <Button onClick={handleSave} disabled={loading || !title || !amount || !paidByUserId}>
            {loading ? "Saugoma..." : "Išsaugoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}