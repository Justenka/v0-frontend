"use client"

import { useEffect } from "react"

import { useState } from "react"

import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Member } from "@/types/member"

interface SettleUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: Member | null
  onSettleUp: (memberId: number, amount: number) => void
}

export default function SettleUpDialog({ open, onOpenChange, member, onSettleUp }: SettleUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!member || !amount.trim()) return

    const settleAmount = Number.parseFloat(amount)
    if (isNaN(settleAmount) || settleAmount <= 0) return

    const maxAmount = Math.abs(member.balance)
    const finalAmount = Math.min(settleAmount, maxAmount)

    setIsSubmitting(true)
    await onSettleUp(member.id, finalAmount)
    setAmount("")
    setIsSubmitting(false)
    onOpenChange(false)
  }

  useEffect(() => {
    if (open && member) {
      setAmount(Math.abs(member.balance).toFixed(2))
    }
  }, [open, member])

  if (!member || member.balance > 0) return null

  const maxAmount = Math.abs(member.balance)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gražinti {member.name}</DialogTitle>
            <DialogDescription>
              {member.balance > 0
                ? `${member.name} jums skolingas ${formatCurrency(member.balance)}`
                : `Jūs skolingas ${member.name} ${formatCurrency(Math.abs(member.balance))}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Suma
              </Label>
              <div className="col-span-3">
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                  placeholder={`Įveskite suma`}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Įveskite sumą iki {formatCurrency(maxAmount)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !amount.trim() ||
                Number.parseFloat(amount) <= 0 ||
                Number.parseFloat(amount) > maxAmount
              }
            >
              {isSubmitting ? "Kraunama..." : "Gražinti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}
