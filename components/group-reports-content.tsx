"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Calendar } from "lucide-react"
import type { Group } from "@/types/group"
import type { Transaction } from "@/types/transaction"

interface GroupReportsContentProps {
  group: Group
  transactions: Transaction[]
}

export function GroupReportsContent({ group, transactions }: GroupReportsContentProps) {
  // Calculate statistics
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalTransactions = transactions.length
  const averageExpense = totalExpenses / totalTransactions || 0

  // Calculate per member statistics
  const memberStats = group.members.map((member) => {
    const paidTransactions = transactions.filter((t) => t.paidBy === member.name)
    const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0)
    const transactionCount = paidTransactions.length

    return {
      name: member.name,
      totalPaid,
      transactionCount,
      balance: member.balance,
    }
  })

  // Calculate monthly breakdown
  const monthlyData = transactions.reduce(
    (acc, t) => {
      const month = new Date(t.date).toLocaleDateString("lt-LT", { year: "numeric", month: "long" })
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0 }
      }
      acc[month].total += t.amount
      acc[month].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const handleExport = (format: "csv" | "pdf") => {
    // MOCK: Export functionality
    // REAL IMPLEMENTATION with MySQL/phpMyAdmin:
    // const response = await fetch(`/api/groups/${group.id}/reports/export?format=${format}`)
    // const blob = await response.blob()
    // const url = window.URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = `${group.title}-report.${format}`
    // a.click()
    // SQL Query for data:
    // SELECT t.*, m.name as member_name
    // FROM transactions t
    // JOIN members m ON t.paid_by = m.id
    // WHERE t.group_id = ?
    // ORDER BY t.date DESC
    alert(`Eksportuojama ${format.toUpperCase()} ataskaita...`)
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group.title} - Ataskaitos</h1>
          <p className="text-muted-foreground">Išsamios finansinės ataskaitos ir statistika</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viso išlaidų</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExpenses.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Iš {totalTransactions} operacijų</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vidutinė išlaida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageExpense.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">Per operaciją</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Narių skaičius</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.members.length}</div>
            <p className="text-xs text-muted-foreground">Aktyvių narių</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laikotarpis</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(monthlyData).length}</div>
            <p className="text-xs text-muted-foreground">Mėnesiai</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Nariai</TabsTrigger>
          <TabsTrigger value="monthly">Mėnesinis</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Narių statistika</CardTitle>
              <CardDescription>Išlaidų ir balansų suvestinė pagal narius</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {memberStats.map((stat) => (
                  <div key={stat.name} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">{stat.name}</p>
                      <p className="text-sm text-muted-foreground">{stat.transactionCount} operacijos</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">{stat.totalPaid.toFixed(2)} €</p>
                      <p className={`text-sm ${stat.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {stat.balance >= 0 ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Gaus: {stat.balance.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Skolingas: {Math.abs(stat.balance).toFixed(2)} €
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mėnesinė suvestinė</CardTitle>
              <CardDescription>Išlaidų pasiskirstymas pagal mėnesius</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(monthlyData).map(([month, data]) => (
                  <div key={month} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">{month}</p>
                      <p className="text-sm text-muted-foreground">{data.count} operacijos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{data.total.toFixed(2)} €</p>
                      <p className="text-sm text-muted-foreground">Vid. {(data.total / data.count).toFixed(2)} €</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
