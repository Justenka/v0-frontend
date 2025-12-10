"use client"

import { useEffect, useState } from "react"
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
import { toast } from "sonner"

interface SettleUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromUserId: number
  toUserId: number
  toUserName: string
  maxAmount: number
  currency: string
  groupId: number
  onPaymentSuccess: () => void
}

export default function SettleUpDialog({
  open,
  onOpenChange,
  fromUserId,
  toUserId,
  toUserName,
  maxAmount,
  currency,
  groupId,
  onPaymentSuccess,
}: SettleUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(maxAmount.toFixed(2))
      setNote("")
    }
  }, [open, maxAmount])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const paymentAmount = parseFloat(amount)

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Įveskite teisingą sumą")
      return
    }

    if (paymentAmount > maxAmount) {
      toast.error(`Suma negali viršyti ${maxAmount.toFixed(2)} ${currency}`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          fromUserId,
          toUserId,
          amount: paymentAmount,
          currencyCode: currency,
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Nepavyko įrašyti mokėjimo")
      }

      toast.success(`Sėkmingai grąžinta ${paymentAmount.toFixed(2)} ${currency}`)
      setAmount("")
      setNote("")
      onOpenChange(false)
      onPaymentSuccess()
    } catch (error: any) {
      console.error("Payment error:", error)
      toast.error(error.message || "Klaida įrašant mokėjimą")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = (maxAmount * percentage).toFixed(2)
    setAmount(quickAmount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Grąžinti {toUserName}</DialogTitle>
            <DialogDescription>
              Jūs skolingas {toUserName} {formatCurrency(maxAmount, currency)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Suma ({currency})</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={maxAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maksimali suma: {formatCurrency(maxAmount, currency)}
              </p>
              
              <div className="flex gap-2 flex-wrap mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.25)}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.5)}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(0.75)}
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(maxAmount.toFixed(2))}
                >
                  Visa suma
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Atšaukti
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount}
            >
              {isSubmitting ? "Kraunama..." : "Grąžinti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currency,
  }).format(amount)
}