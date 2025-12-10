"use client"

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
  currency: string
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
  const [settleDialogData, setSettleDialogData] = useState<{
    fromUserId: number
    toUserId: number
    toUserName: string
    maxAmount: number
    currency: string
  } | null>(null)

  useEffect(() => {
    if (user && groupId) {
      loadBalances()
    }
  }, [user, groupId, members])

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
      // Nėra skolų su šiuo nariu
      return
    }

    if (balance.type === 'owes_me') {
      // Jie skolingi mums - negalime mes jiems grąžinti
      return
    }

    // Atidarome dialogo langą su tikrais duomenimis
    setSettleDialogData({
      fromUserId: Number(user.id),
      toUserId: member.id,
      toUserName: member.name,
      maxAmount: balance.amount,
      currency: balance.currency,
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

      if (isCurrentUser) {
        return member.balance > 0
          ? `Jums priklauso ${formatCurrency(Math.abs(member.balance))}`
          : `Jūs skolingi ${formatCurrency(Math.abs(member.balance))}`
      }

      return member.balance > 0
        ? `Jums priklauso ${formatCurrency(Math.abs(member.balance))}`
        : `Skolingas ${formatCurrency(Math.abs(member.balance))}`
    }

    // Use balance from getUserBalances API
    if (isCurrentUser) {
      if (balance.type === 'owes_me') {
        return `Jums priklauso ${formatCurrency(balance.amount, balance.currency)}`
      } else {
        return `Jūs skolingi ${formatCurrency(balance.amount, balance.currency)}`
      }
    } else {
      if (balance.type === 'owes_me') {
        return `Jums priklauso ${formatCurrency(balance.amount, balance.currency)}`
      } else {
        return `Skolingas ${formatCurrency(balance.amount, balance.currency)}`
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
          currency={settleDialogData.currency}
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
