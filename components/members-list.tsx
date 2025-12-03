"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Member } from "@/types/member"
import SettleUpDialog from "@/components/settle-up-dialog"

interface MembersListProps {
  members: Member[]
  onSettleUp: (memberId: number, amount: number) => void
  onRemoveMember: (memberId: number) => void
}


export default function MembersList({ members, onSettleUp, onRemoveMember }: MembersListProps) {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false)
  const [userName, setUserName] = useState("")

  //paskui sutvarkyt reikia

  // useEffect(() => {
  //   const fetchUserName = async () => {
  //     try {
  //       const name = await userApi.getUserName()
  //       setUserName(name)
  //     } catch (error) {
  //       console.error("Failed to fetch user name:", error)
  //     }
  //   }

  //   fetchUserName()
  // }, [])

  const handleSettleUpClick = (member: Member) => {
    setSelectedMember(member)
    setIsSettleUpOpen(true)
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.name === userName
        const canSettle = isCurrentUser && member.balance < 0

        return (
          <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="font-medium">{isCurrentUser ? "Jūs" : member.name}</p>
              {member.balance !== 0 && (
                <p className="text-sm text-muted-foreground">
                  {member.name === userName ? (
                    member.balance > 0
                      ? `Jums priklauso ${formatCurrency(member.balance)}`
                      : member.balance < 0
                      ? `Jūs skolingi ${formatCurrency(Math.abs(member.balance))}`
                      : "Jūs neskolingi"
                  ) : (
                    member.balance > 0
                      ? `Jiems priklauso ${formatCurrency(member.balance)}`
                      : member.balance < 0
                      ? `Skolingas ${formatCurrency(Math.abs(member.balance))}`
                      : "Atsiskaites"
                  )}
                </p>
              )}
              {member.balance === 0 && <p className="text-sm text-muted-foreground">Atsiskaityta</p>}
            </div>

            <div className="flex items-center gap-2">
              {member.balance !== 0 && (
                <Button
                  onClick={() => handleSettleUpClick(member)}
                  disabled={!canSettle}
                  title={
                    !isCurrentUser
                      ? "Only the person who owes can settle"
                      : member.balance >= 0
                      ? "Jūs niekam neskolingi"
                      : ""
                  }
                >
                  Gražinti
                </Button>
              )}
                <Button
                  variant="destructive"
                  onClick={() => onRemoveMember(member.id)}
                  disabled={member.balance !== 0}
                  title={member.balance !== 0 ? "Negalima pašalinti nario kol jis pilnai neatsiskaitęs" : ""}
                >
                  Pašalinti
                </Button>
            </div>
          </div>
        )
      })}
      <SettleUpDialog
        open={isSettleUpOpen}
        onOpenChange={setIsSettleUpOpen}
        member={selectedMember}
        onSettleUp={onSettleUp}
      />
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
  }).format(amount)
}
