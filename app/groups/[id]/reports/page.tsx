import { mockGroups, mockTransactions } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { GroupReportsContent } from "@/components/group-reports-content"

export default async function GroupReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const groupId = Number.parseInt(id)

  if (Number.isNaN(groupId)) {
    notFound()
  }

  const group = mockGroups.find((g) => g.id === groupId)

  if (!group) {
    notFound()
  }

  const transactions = mockTransactions[groupId] || []

  return <GroupReportsContent group={group} transactions={transactions} />
}
