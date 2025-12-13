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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Transaction } from "@/types/transaction"
import { toast } from "sonner"
import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context"

interface EditTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  categories: Array<{ id: string; name: string }>
  onSave: () => void
  groupId: number
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  onSave,
  groupId,
}: EditTransactionDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)

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
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [title, groupId, transaction])

  const loadTransactionDetails = async () => {
    if (!transaction) return

    try {
      const debtData = await groupApi.getDebt(transaction.id)
      setTitle(debtData.title)
      setCategoryId(debtData.categoryId ? String(debtData.categoryId) : "")
    } catch (error) {
      console.error("Failed to load transaction details:", error)
      toast.error("Nepavyko įkelti išlaidos duomenų")
    }
  }

  const handleSave = async () => {
    if (!transaction || !user) return

    if (!title.trim()) {
      toast.error("Įveskite pavadinimą")
      return
    }

    if (duplicateWarning) {
      toast.error("Išlaida su tokiu pavadinimu jau egzistuoja")
      return
    }

    setLoading(true)

    try {
      await groupApi.updateDebt(transaction.id, {
        title: title.trim(),
        categoryId,
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
      <DialogContent className="max-w-md">
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
            disabled={loading || !title || duplicateWarning}
          >
            {loading ? "Saugoma..." : "Išsaugoti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}