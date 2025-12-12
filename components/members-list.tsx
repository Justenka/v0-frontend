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
  onRemoveMember: (memberId: number) => void
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
  type: 'owes_me' | 'i_owe'
}

export default function MembersList({ 
  members, 
  onSettleUp, 
  onRemoveMember,
  groupId,
  onBalanceUpdate 
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
  maxAmountEUR: number      // NAUJAS
  currency: string
  kursasEurui: number       // NAUJAS
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
      const userData = await fetch(`${API_BASE}/api/vartotojai/${user.id}`).then(r => r.json())
      const currencies = await groupApi.getAllCurrencies()
      
      const userCurr = currencies.find(c => c.id_valiuta === userData.valiutos_kodas)
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
// Konvertuojame balansus į vartotojo valiutą
useEffect(() => {
  const convertBalances = async () => {
    if (!userCurrency || balances.length === 0) return

    const converted: Record<number, number> = {}

    try {
      for (const balance of balances) {
        // SVARBU: balance.amount jau yra originalioje valiutoje
        // balance.amountEUR yra EUR
        
        // Mapuojame valiutos pavadinimą į id_valiuta
        const balanceCurrencyId = 
          balance.currency === "EUR" ? 1 :
          balance.currency === "USD" ? 2 :
          balance.currency === "PLN" ? 3 :
          balance.currency === "GBP" ? 4 :
          balance.currency === "JPY" ? 5 : 1

        if (balanceCurrencyId === userCurrency.id) {
          // Ta pati valiuta kaip vartotojo - imame EUR ir konvertuojame į vartotojo valiutą
          // (kuris šiuo atveju yra tas pats kaip originali valiuta)
          converted[balance.userId] = balance.amount
        } else {
          // Skirtingos valiutos - konvertuojame EUR į vartotojo valiutą
          const convertedAmount = await groupApi.convertCurrency(
            balance.amountEUR, // Konvertuojame iš EUR
            1, // EUR ID
            userCurrency.id
          )
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
      console.log('Loaded balances:', userBalances)
      setBalances(userBalances)
    } catch (error) {
      console.error("Failed to load balances:", error)
    }
  }

  const getBalanceForMember = (memberId: number): Balance | null => {
    const balance = balances.find(b => b.userId === memberId) || null
    console.log(`Balance for member ${memberId}:`, balance)
    return balance
  }

const handleSettleUpClick = (member: Member) => {
  if (!user) return

  const balance = getBalanceForMember(member.id)
  
  if (!balance) {
    return
  }

  if (balance.type === 'owes_me') {
    return
  }

  // Konvertuota suma vartotojo valiutoje
  const displayAmount = convertedBalances[member.id] ?? balance.amount
  const displayCurrency = userCurrency?.name || balance.currency

  setSettleDialogData({
    fromUserId: Number(user.id),
    toUserId: member.id,
    toUserName: member.name,
    maxAmount: balance.amount,           // Originali suma (iš skolos valiutos)
    maxAmountEUR: balance.amountEUR,     // EUR suma
    currency: balance.currency,          // Originali valiuta
    kursasEurui: balance.kursasEurui,    // Kursas
    displayAmount: displayAmount,        // Konvertuota suma
    displayCurrency: displayCurrency,    // Vartotojo valiuta
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

  const formatCurrency = (amount: number, currency: string = "EUR"): string => {
    // Handle invalid amounts
    if (amount === undefined || amount === null || isNaN(amount)) {
      return new Intl.NumberFormat("lt-LT", {
        style: "currency",
        currency: currency,
      }).format(0)
    }
    return new Intl.NumberFormat("lt-LT", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const getBalanceText = (member: Member): string => {
    const isCurrentUser = user && Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)

    // If no balance info from API, check member.balance
    if (!balance) {
      // Check if member.balance exists and is a valid number
      if (member.balance === undefined || member.balance === null || member.balance === 0) {
        return "Atsiskaityta"
      }

      const displayCurrency = userCurrency?.name || "EUR"

      if (isCurrentUser) {
        return member.balance > 0
          ? `Jums priklauso ${formatCurrency(Math.abs(member.balance), displayCurrency)}`
          : `Jūs skolingi ${formatCurrency(Math.abs(member.balance), displayCurrency)}`
      }

      return member.balance > 0
        ? `Jums priklauso ${formatCurrency(Math.abs(member.balance), displayCurrency)}`
        : `Skolingas ${formatCurrency(Math.abs(member.balance), displayCurrency)}`
    }

    // Use balance from getUserBalances API with conversion
    const displayCurrency = userCurrency?.name || balance.currency
    const convertedAmount = convertedBalances[member.id] ?? balance.amount
    const showOriginal = balance.currency !== displayCurrency

    if (isCurrentUser) {
      if (balance.type === 'owes_me') {
        return showOriginal
          ? `Jums priklauso ${formatCurrency(convertedAmount, displayCurrency)}`
          : `Jums priklauso ${formatCurrency(convertedAmount, displayCurrency)}`
      } else {
        return showOriginal
          ? `Jūs skolingi ${formatCurrency(convertedAmount, displayCurrency)}`
          : `Jūs skolingi ${formatCurrency(convertedAmount, displayCurrency)}`
      }
    } else {
      if (balance.type === 'owes_me') {
        return showOriginal
          ? `Jums priklauso ${formatCurrency(convertedAmount, displayCurrency)}`
          : `Jums priklauso ${formatCurrency(convertedAmount, displayCurrency)}`
      } else {
        return showOriginal
          ? `Skolingas ${formatCurrency(convertedAmount, displayCurrency)}`
          : `Skolingas ${formatCurrency(convertedAmount, displayCurrency)}`
      }
    }
  }

  const canSettle = (member: Member): boolean => {
    if (!user) return false
    
    const isCurrentUser = Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)
    
    // Galime grąžinti tik jei:
    // 1. Tai ne mes patys
    // 2. Yra balansas
    // 3. Mes skolingi jiems (type === 'i_owe')
    return !isCurrentUser && balance !== null && balance.type === 'i_owe'
  }

  const canRemove = (member: Member): boolean => {
    const balance = getBalanceForMember(member.id)
    // Galime pašalinti tik jei nėra jokių skolų
    return balance === null
  }

  const getSettleButtonTitle = (member: Member): string => {
    if (!user) return ""
    
    const isCurrentUser = Number(user.id) === member.id
    const balance = getBalanceForMember(member.id)
    
    if (isCurrentUser) {
      return "Negalite grąžinti sau"
    }
    
    if (!balance) {
      return "Nėra skolų su šiuo nariu"
    }
    
    if (balance.type === 'owes_me') {
      return "Jie jums skolingi, ne atvirkščiai"
    }
    
    return ""
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = user && Number(user.id) === member.id
        const balance = getBalanceForMember(member.id)
        const hasBalance = balance !== null

        return (
          <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="font-medium">
                {isCurrentUser ? "Jūs" : member.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {getBalanceText(member)}
              </p>
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
              <Button
                variant="destructive"
                onClick={() => onRemoveMember(member.id)}
                disabled={!canRemove(member)}
                title={!canRemove(member) ? "Negalima pašalinti nario kol jis pilnai neatsiskaitęs" : ""}
              >
                Pašalinti
              </Button>
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

function formatCurrency(amount: number, currency: string = "EUR"): string {
  // Handle invalid amounts
  if (amount === undefined || amount === null || isNaN(amount)) {
    return new Intl.NumberFormat("lt-LT", {
      style: "currency",
      currency: currency,
    }).format(0)
  }
  
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: currency,
  }).format(amount)
}
