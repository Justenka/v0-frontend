"use client"

import type React from "react"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign } from "lucide-react"
import { toast } from "sonner"
import type { Member } from "@/types/member"

interface RegisterPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  onRegisterPayment: (fromMember: string, toMember: string, amount: number, note?: string) => void
}

export function RegisterPaymentDialog({ open, onOpenChange, members, onRegisterPayment }: RegisterPaymentDialogProps) {
  const [fromMember, setFromMember] = useState("")
  const [toMember, setToMember] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromMember || !toMember || !amount) {
      toast.error("Užpildykite visus laukus")
      return
    }

    if (fromMember === toMember) {
      toast.error("Negalima pervesti sau")
      return
    }

    const amountNum = Number.parseFloat(amount)
    if (amountNum <= 0) {
      toast.error("Suma turi būti didesnė už 0")
      return
    }

    onRegisterPayment(fromMember, toMember, amountNum, note)
    toast.success("Mokėjimas užregistruotas")

    // Reset form
    setFromMember("")
    setToMember("")
    setAmount("")
    setNote("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registruoti mokėjimą
          </DialogTitle>
          <DialogDescription>Užregistruokite mokėjimą tarp grupės narių</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-member">Iš</Label>
            <Select value={fromMember} onValueChange={setFromMember}>
              <SelectTrigger id="from-member">
                <SelectValue placeholder="Pasirinkite narį" />
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
            <Label htmlFor="to-member">Kam</Label>
            <Select value={toMember} onValueChange={setToMember}>
              <SelectTrigger id="to-member">
                <SelectValue placeholder="Pasirinkite narį" />
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
            <Label htmlFor="amount">Suma</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Pastaba (neprivaloma)</Label>
            <Textarea
              id="note"
              placeholder="Pvz., grąžinimas už vakarienę"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Atšaukti
            </Button>
            <Button type="submit">Registruoti</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
