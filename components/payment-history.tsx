"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockPayments } from "@/lib/mock-data"
import { ArrowRight, Calendar } from "lucide-react"
import { format } from "date-fns"

interface PaymentHistoryProps {
  groupId: number
  transactionId?: number
}

export default function PaymentHistory({ groupId, transactionId }: PaymentHistoryProps) {
  // Get payments for this group, optionally filtered by transaction
  let payments = mockPayments[groupId] || []

  if (transactionId) {
    payments = payments.filter((p) => p.transactionId === transactionId)
  }

  if (payments.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Mokėjimų istorija</CardTitle>
        <CardDescription>
          {transactionId ? "Mokėjimai už šią operaciją" : "Naujausi mokėjimai šioje grupėje"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{payment.fromMemberName}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{payment.toMemberName}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {payment.currency} {payment.amount.toFixed(2)}
                  </p>
                  {payment.note && <p className="text-xs text-muted-foreground">{payment.note}</p>}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(payment.date, "MMM d, HH:mm")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
