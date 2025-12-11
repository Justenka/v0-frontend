"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
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
  groupId: number // Add this prop
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  members,
  categories,
  onSave,
  groupId,
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
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

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

  // Debounced duplicate check
  useEffect(() => {
    if (!title.trim() || !transaction) {
      setDuplicateWarning(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingDuplicate(true)
        const result = await groupApi.checkDuplicateDebtName(
          groupId,
          title.trim(),
          transaction.id
        )
        setDuplicateWarning(result.exists)
      } catch (error) {
        console.error("Error checking duplicate:", error)
      } finally {
        setCheckingDuplicate(false)
      }
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [title, groupId, transaction])

  const loadTransactionDetails = async () => {
    if (!transaction) return

    try {
      const debtData = await groupApi.getDebt(transaction.id)
      setFullDebtData(debtData)

      setTitle(debtData.title)
      setAmount(debtData.amount.toString())
      setCurrency(debtData.currency || "EUR")
      setCategoryId(debtData.categoryId ? String(debtData.categoryId) : "")

      // Set the payer
      if (debtData.paidByUserId) {
        setPaidByUserId(String(debtData.paidByUserId))
      } else if (debtData.splits && debtData.splits.length > 0) {
        const payer = debtData.splits.find((s: any) => s.role === 2)
        if (payer) {
          setPaidByUserId(String(payer.userId))
        }
      }

      // Set splits
      if (debtData.splits && debtData.splits.length > 0) {
        setSplits(debtData.splits.map((s: any) => ({
          userId: s.userId,
          amount: s.amount || 0,
          percentage: s.percentage || 0,
        })))

        const totalAmount = debtData.amount
        const equalShare = totalAmount / debtData.splits.length
        const tolerance = 0.01
        
        const isEqual = debtData.splits.every((s: any) => 
          Math.abs(s.amount - equalShare) < tolerance
        )
        
        if (isEqual) {
          setSplitType("equal")
        } else {
          const hasPercentages = debtData.splits.some((s: any) => 
            s.percentage && s.percentage > 0
          )
          setSplitType(hasPercentages ? "percentage" : "custom")
        }
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

    if (duplicateWarning) {
      toast.error("Išlaida su tokiu pavadinimu jau egzistuoja")
      return
    }

    setLoading(true)

    try {
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
        paidById: Number(paidByUserId),
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
              className={duplicateWarning ? "border-red-500" : ""}
            />
            {duplicateWarning && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Išlaida su tokiu pavadinimu jau egzistuoja šioje grupėje
                </AlertDescription>
              </Alert>
            )}
            {checkingDuplicate && (
              <p className="text-xs text-muted-foreground">Tikrinama...</p>
            )}
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
          <Button 
            onClick={handleSave} 
            disabled={loading || !title || !amount || !paidByUserId || duplicateWarning}
          >
            {loading ? "Saugoma..." : "Išsaugoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}