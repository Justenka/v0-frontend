"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Member } from "@/types/member"
import SettleUpDialog from "@/components/settle-up-dialog"
import { useAuth } from "@/contexts/auth-context"
import { groupApi } from "@/services/group-api"

interface MembersListProps {
  members: Member[]
  onSettleUp: (memberId: number, amount: number) => void

  // ✅ padarom optional — jei nepaduosi, šalinimo mygtuko nebus
  onRemoveMember?: (memberId: number) => void

  // ✅ ar adminas (ar turi teisę valdyti narius)
  canManageMembers?: boolean

  groupId?: number
  onBalanceUpdate?: () => void
}

interface Balance {
  userId: number
  userName: string
  amount: number
  amountEUR: number
  currency: string
  kursasEurui: number
  type: "owes_me" | "i_owe"
}

export default function MembersList({
  members,
  onSettleUp,
  onRemoveMember,
  canManageMembers = false,
  groupId,
  onBalanceUpdate,
}: MembersListProps) {
  const { user } = useAuth()
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false)
  const [balances, setBalances] = useState<Balance[]>([])
  const [userCurrency, setUserCurrency] = useState<{ id: number; name: string } | null>(null)
  const [convertedBalances, setConvertedBalances] = useState<Record<number, number>>({})
  const [settleDialogData, setSettleDialogData] = useState<{
    fromUserId: number
    toUserId: number
    toUserName: string
    maxAmount: number
    maxAmountEUR: number
    currency: string
    kursasEurui: number
    displayAmount: number
    displayCurrency: string
  } | null>(null)

  useEffect(() => {
    if (user && groupId) {
      loadBalances()
    }
  }, [user, groupId, members])

  useEffect(() => {
    const fetchUserCurrency = async () => {
      if (!user) return

      try {
        const userData = await fetch(`${API_BASE}/api/vartotojai/${user.id}`).then((r) => r.json())
        const currencies = await groupApi.getAllCurrencies()

        const userCurr = currencies.find((c) => c.id_valiuta === userData.valiutos_kodas)
        if (userCurr) {
          setUserCurrency({ id: userCurr.id_valiuta, name: userCurr.name })
        }
      } catch (error) {
        console.error("Nepavyko gauti vartotojo valiutos:", error)
      }
    }

    if (user) {
      fetchUserCurrency()
    }
  }, [user])

  // Konvertuojame balansus į vartotojo valiutą
  useEffect(() => {
    const convertBalances = async () => {
      if (!userCurrency || balances.length === 0) return

      const converted: Record<number, number> = {}

      try {
        for (const balance of balances) {
          const balanceCurrencyId =
            balance.currency === "EUR"
              ? 1
              : balance.currency === "USD"
                ? 2
                : balance.currency === "PLN"
                  ? 3
                  : balance.currency === "GBP"
                    ? 4
                    : balance.currency === "JPY"
                      ? 5
                      : 1

          if (balanceCurrencyId === userCurrency.id) {
            converted[balance.userId] = balance.amount
          } else {
            const convertedAmount = await groupApi.convertCurrency(balance.amountEUR, 1, userCurrency.id)
            converted[balance.userId] = convertedAmount
          }
        }

        setConvertedBalances(converted)
      } catch (error) {
        console.error("Konvertavimo klaida:", error)
      }
    }

    convertBalances()
  }, [balances, userCurrency])

  const loadBalances = async () => {
    if (!user || !groupId) return

    try {
      const userBalances = await groupApi.getUserBalances(groupId, Number(user.id))
      console.log("Loaded balances:", userBalances)
      setBalances(userBalances)
    } catch (error) {
      console.error("Failed to load balances:", error)
    }
  }

  const getBalanceForMember = (memberId: number): Balance | null => {
    const balance = balances.find((b) => b.userId === memberId) || null
    console.log(`Balance for member ${memberId}:`, balance)
    return balance
  }

  const handleSettleUpClick = (member: Member) => {
    if (!user) return

    const balance = getBalanceForMember(member.id)
    if (!balance) return
    if (balance.type === "owes_me") return

    const displayAmount = convertedBalances[member.id] ?? balance.amount
    const displayCurrency = userCurrency?.name || balance.currency

    setSettleDialogData({
      fromUserId: Number(user.id),
      toUserId: member.id,
      toUserName: member.name,
      maxAmount: balance.amount,
      maxAmountEUR: balance.amountEUR,
      currency: balance.currency,
      kursasEurui: balance.kursasEurui,
      displayAmount,
      displayCurrency,
    })
    setSelectedMember(member)
    setIsSettleUpOpen(true)
  }

  const handlePaymentSuccess = async () => {
    await loadBalances()
    if (onBalanceUpdate) {
      onBalanceUpdate()
    }
  }

  const formatCurrencyLocal = (amount: number, currency: string = "EUR"): string => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat("lt-LT", {
        style: "currency",
        currency,
      }).format(0)
    }
    return new Intl.NumberFormat("lt-LT", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const getBalanceText = (member: Member): string => {
    const isCurrentUser = user && Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)

    if (!balance) {
      if (member.balance === undefined || member.balance === null || member.balance === 0) {
        return "Atsiskaityta"
      }

      const displayCurrency = userCurrency?.name || "EUR"

      if (isCurrentUser) {
        return member.balance > 0
          ? `Jums priklauso ${formatCurrencyLocal(Math.abs(member.balance), displayCurrency)}`
          : `Jūs skolingi ${formatCurrencyLocal(Math.abs(member.balance), displayCurrency)}`
      }

      return member.balance > 0
        ? `Jums priklauso ${formatCurrencyLocal(Math.abs(member.balance), displayCurrency)}`
        : `Skolingas ${formatCurrencyLocal(Math.abs(member.balance), displayCurrency)}`
    }

    const displayCurrency = userCurrency?.name || balance.currency
    const convertedAmount = convertedBalances[member.id] ?? balance.amount

    if (isCurrentUser) {
      if (balance.type === "owes_me") {
        return `Jums priklauso ${formatCurrencyLocal(convertedAmount, displayCurrency)}`
      }
      return `Jūs skolingi ${formatCurrencyLocal(convertedAmount, displayCurrency)}`
    }

    if (balance.type === "owes_me") {
      return `Jums priklauso ${formatCurrencyLocal(convertedAmount, displayCurrency)}`
    }
    return `Skolingas ${formatCurrencyLocal(convertedAmount, displayCurrency)}`
  }

  const canSettle = (member: Member): boolean => {
    if (!user) return false

    const isCurrentUser = Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)

    return !isCurrentUser && balance !== null && balance.type === "i_owe"
  }

  const canRemove = (member: Member): boolean => {
    const balance = getBalanceForMember(member.id)
    return balance === null
  }

  const getSettleButtonTitle = (member: Member): string => {
    if (!user) return ""

    const isCurrentUser = Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)

    if (isCurrentUser) return "Negalite grąžinti sau"
    if (!balance) return "Nėra skolų su šiuo nariu"
    if (balance.type === "owes_me") return "Jie jums skolingi, ne atvirkščiai"

    return ""
  }

  // ✅ ar rodyti šalinimo mygtuką (tik jei paduotas handleris ir admin teisė)
  const showRemoveButton = !!onRemoveMember && canManageMembers

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = user && Number(user.id) === member.id
        const balance = getBalanceForMember(member.id)
        const hasBalance = balance !== null

        return (
          <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="font-medium">{isCurrentUser ? "Jūs" : member.name}</p>
              <p className="text-sm text-muted-foreground">{getBalanceText(member)}</p>
            </div>

            <div className="flex items-center gap-2">
              {hasBalance && (
                <Button
                  onClick={() => handleSettleUpClick(member)}
                  disabled={!canSettle(member)}
                  title={getSettleButtonTitle(member)}
                >
                  Grąžinti
                </Button>
              )}

              {/* ✅ Pašalinti rodome tik adminui IR tik jei onRemoveMember paduotas */}
              {showRemoveButton && (
                <Button
                  variant="destructive"
                  onClick={() => onRemoveMember(member.id)}
                  disabled={!canRemove(member)}
                  title={!canRemove(member) ? "Negalima pašalinti nario kol jis pilnai neatsiskaitęs" : ""}
                >
                  Pašalinti
                </Button>
              )}
            </div>
          </div>
        )
      })}

      {settleDialogData && groupId && (
        <SettleUpDialog
          open={isSettleUpOpen}
          onOpenChange={setIsSettleUpOpen}
          fromUserId={settleDialogData.fromUserId}
          toUserId={settleDialogData.toUserId}
          toUserName={settleDialogData.toUserName}
          maxAmount={settleDialogData.maxAmount}
          maxAmountEUR={settleDialogData.maxAmountEUR}
          currency={settleDialogData.currency}
          kursasEurui={settleDialogData.kursasEurui}
          displayAmount={settleDialogData.displayAmount}
          displayCurrency={settleDialogData.displayCurrency}
          groupId={groupId}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
