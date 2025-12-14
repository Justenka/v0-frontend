"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { groupApi } from "@/services/group-api"
import { useAuth } from "@/contexts/auth-context" // Import useAuth

interface Member {
  id: number
  name: string
  balance: number
}

interface Transaction {
  id: number
  title: string
  description: string
  amount: number
  date: string
  paidBy: string
  categoryName: string
  currency: string
}

export default function GroupReportsPage() {
  const params = useParams()
  const groupId = params?.id ? parseInt(params.id as string) : NaN
  const { user } = useAuth() // Get user from auth context

  const [groupTitle, setGroupTitle] = useState("")
  const [members, setMembers] = useState<Member[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate statistics
  const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalTransactions = transactions.length
  const averageExpense = totalExpenses / totalTransactions || 0

  // Calculate per member statistics
  const memberStats = members.map((member) => {
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
    {} as Record<string, { total: number; count: number }>
  )

  useEffect(() => {
    const fetchData = async () => {
      if (!groupId || isNaN(groupId)) {
        setLoading(false)
        return
      }

      try {
        // Fetch group data using existing API
        const fullGroupData = await groupApi.getGroup(groupId)

        setGroupTitle(fullGroupData.pavadinimas || fullGroupData.title || "Grupė")

        // Map members
        const mappedMembers: Member[] = (fullGroupData.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          balance: m.balance || 0,
        }))
        setMembers(mappedMembers)

        // Map transactions
        const mappedTransactions: Transaction[] = (fullGroupData.transactions || []).map((t: any) => ({
          id: t.id,
          title: t.title || t.pavadinimas,
          description: t.description || t.aprasymas || "",
          amount: Number(t.amount || t.suma),
          date: t.date || t.sukurimo_data,
          paidBy: t.paidBy || t.paidByName,
          categoryName: t.categoryName || "Be kategorijos",
          currency: t.currency || "EUR",
        }))
        setTransactions(mappedTransactions)
      } catch (error) {
        console.error("Failed to load group data:", error)
        toast.error("Nepavyko įkelti duomenų")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [groupId])

  const handleExportPDF = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Prašome prisijungti")
      return
    }

    setIsExporting(true)
    try {
      // Call the backend API endpoint with user ID in header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/groups/${groupId}/reports/pdf`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/pdf',
            'x-user-id': String(user.id), // Pass user ID from auth context
          },
        }
      )

      if (!response.ok) {
        // Check if response is JSON (error message) or HTML (404 page)
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('application/json')) {
          const error = await response.json()
          throw new Error(error.message || 'Nepavyko sugeneruoti ataskaitos')
        } else {
          throw new Error(
            response.status === 404
              ? 'PDF generavimo endpoint nerastas. Patikrinkite serverio konfigūraciją.'
              : `Serverio klaida: ${response.status}`
          )
        }
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Verify we got a PDF
      if (blob.type !== 'application/pdf') {
        throw new Error('Gautas neteisingas failo formatas')
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ataskaita-${groupTitle}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('PDF ataskaita sėkmingai atsisiųsta')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Nepavyko sugeneruoti PDF ataskaitos')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    try {
      // Generate CSV content with semicolon separator
      const headers = ['Data', 'Pavadinimas', 'Suma', 'Valiuta', 'Sumokėjo', 'Kategorija']
      const rows = transactions.map((t) => [
        new Date(t.date).toLocaleDateString('lt-LT'),
        t.title,
        t.amount.toFixed(2),
        t.currency,
        t.paidBy,
        t.categoryName,
      ])

      // Use semicolon as separator
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(';'))
        .join('\n')

      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ataskaita-${groupTitle}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('CSV ataskaita sėkmingai atsisiųsta')
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast.error('Nepavyko sugeneruoti CSV ataskaitos')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{groupTitle} - Ataskaitos</h1>
          <p className="text-muted-foreground">Išsamios finansinės ataskaitos ir statistika</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generuojama...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </>
            )}
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
            <div className="text-2xl font-bold">{members.length}</div>
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

      <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-1 mb-6">
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
      </div>
    </div>
  )
}