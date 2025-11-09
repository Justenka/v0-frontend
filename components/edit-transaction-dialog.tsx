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
import { Checkbox } from "@/components/ui/checkbox"
import type { Transaction } from "@/types/transaction"
import type { Member } from "@/types/member"
import { toast } from "sonner"
import { supportedCurrencies } from "@/lib/currency-api"

interface EditTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  members: Member[]
  categories: Array<{ id: string; name: string }>
  onSave: (updatedTransaction: Transaction) => void
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  members,
  categories,
  onSave,
}: EditTransactionDialogProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [splitType, setSplitType] = useState("equal")
  const [currency, setCurrency] = useState("EUR")
  const [categoryId, setCategoryId] = useState("")
  const [enableLateFee, setEnableLateFee] = useState(false)
  const [lateFeeAmount, setLateFeeAmount] = useState("")
  const [lateFeeDays, setLateFeeDays] = useState("7")

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title)
      setAmount(transaction.amount.toString())
      setPaidBy(transaction.paidBy)
      setSplitType(transaction.splitType.includes("Equally") ? "equal" : "custom")
      setCurrency(transaction.currency || "EUR")
      setCategoryId(transaction.categoryId || "")
      setEnableLateFee(!!transaction.lateFee)
      setLateFeeAmount(transaction.lateFee?.toString() || "")
      setLateFeeDays(transaction.lateFeeDays?.toString() || "7")
    }
  }, [transaction, members])

  const handleSave = () => {
    if (!transaction) return

    const updatedTransaction: Transaction = {
      ...transaction,
      title,
      amount: Number.parseFloat(amount),
      paidBy,
      splitType: splitType === "equal" ? `Equally among ${members.length} people` : "Custom split",
      currency,
      categoryId,
      lateFee: enableLateFee ? Number.parseFloat(lateFeeAmount) : undefined,
      lateFeeDays: enableLateFee ? Number.parseInt(lateFeeDays) : undefined,
    }

    // MOCK: Update transaction
    // REAL IMPLEMENTATION with MySQL/phpMyAdmin:
    // const response = await fetch('/api/transactions/update', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     transactionId: transaction.id,
    //     ...updatedTransaction
    //   })
    // })
    // SQL Query:
    // UPDATE transactions
    // SET title = ?, amount = ?, paid_by = ?, split_type = ?,
    //     currency = ?, category_id = ?, late_fee = ?, late_fee_days = ?
    // WHERE id = ?

    onSave(updatedTransaction)
    toast.success("Išlaida atnaujinta")
    onOpenChange(false)
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
              <Select value={currency} onValueChange={setCurrency}>
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
            <Label htmlFor="edit-paidBy">Mokėjo</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger id="edit-paidBy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
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

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-enable-late-fee"
                checked={enableLateFee}
                onCheckedChange={(checked) => setEnableLateFee(checked as boolean)}
              />
              <Label htmlFor="edit-enable-late-fee" className="cursor-pointer">
                Delspinigiai
              </Label>
            </div>

            {enableLateFee && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-late-fee-amount">Suma</Label>
                  <Input
                    id="edit-late-fee-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={lateFeeAmount}
                    onChange={(e) => setLateFeeAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-late-fee-days">Po dienų</Label>
                  <Input
                    id="edit-late-fee-days"
                    type="number"
                    min="1"
                    value={lateFeeDays}
                    onChange={(e) => setLateFeeDays(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Atšaukti
          </Button>
          <Button onClick={handleSave} disabled={!title || !amount || !paidBy}>
            Išsaugoti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
