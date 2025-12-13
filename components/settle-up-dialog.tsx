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
  maxAmount: number          // Originali suma
  maxAmountEUR: number       // EUR suma
  currency: string           // Originali valiuta
  kursasEurui: number        // Kursas
  displayAmount: number      // Konvertuota suma (rodyti)
  displayCurrency: string    // Vartotojo valiuta
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
  maxAmountEUR,
  currency,
  kursasEurui,
  displayAmount,
  displayCurrency,
  groupId,
  onPaymentSuccess,
}: SettleUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setAmount(displayAmount.toFixed(2))
      setNote("")
    }
  }, [open, displayAmount])

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    const paymentAmount = parseFloat(amount)

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Įveskite teisingą sumą")
      return
    }

    if (paymentAmount > displayAmount) {
      toast.error(`Suma negali viršyti ${displayAmount.toFixed(2)} ${displayCurrency}`)
      return
    }

    setIsSubmitting(true)

    try {
      // Skaičiuojame kiek EUR reikia sumokėti
      let backendAmountEUR: number
      
      if (displayCurrency === currency) {
        // Vartotojo valiuta = skolos valiuta
        // paymentAmount yra originalioje valiutoje, konvertuojame į EUR
        backendAmountEUR = paymentAmount / kursasEurui
      } else {
        // Vartotojo valiuta skiriasi nuo skolos valiutos
        // Proporcingai skaičiuojame EUR sumą
        backendAmountEUR = (paymentAmount / displayAmount) * maxAmountEUR
      }

      console.log(`Mokama: ${paymentAmount} ${displayCurrency}`)
      console.log(`EUR suma: ${backendAmountEUR.toFixed(2)} EUR`)
      console.log(`Originali suma: ${maxAmount.toFixed(2)} ${currency}`)
      console.log(`maxAmountEUR: ${maxAmountEUR}, kursasEurui: ${kursasEurui}`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          fromUserId,
          toUserId,
          amount: backendAmountEUR,  // Siunti EUR sumą
          currencyCode: 'EUR',        // Visada EUR
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Nepavyko įrašyti mokėjimo")
      }

      toast.success(`Sėkmingai grąžinta ${paymentAmount.toFixed(2)} ${displayCurrency}`)
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
    const quickAmount = (displayAmount * percentage).toFixed(2)
    setAmount(quickAmount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Grąžinti {toUserName}</DialogTitle>
            <DialogDescription>
              Jūs skolingas {toUserName} {formatCurrency(displayAmount, displayCurrency)}
             {/* {displayCurrency !== currency && (
                <span className="text-xs block mt-1 text-muted-foreground">
                  (Originali suma: {formatCurrency(maxAmount, currency)})
                </span>
              )} */}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Suma ({displayCurrency})</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={displayAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maksimali suma: {formatCurrency(displayAmount, displayCurrency)}
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
                  onClick={() => setAmount(displayAmount.toFixed(2))}
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
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > displayAmount}
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