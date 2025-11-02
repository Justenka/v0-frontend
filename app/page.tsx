"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import GroupsList from "@/components/groups-list"
import { useState, useEffect } from "react"
import SetYourNameDialog from "@/components/set-name-dialog"
import { userApi } from "@/services/api-client"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const [yourName, setYourName] = useState<string>("")
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const name = await userApi.getUserName()
        setYourName(name)
        if (!name && !user) {
          setIsNameDialogOpen(true)
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserName()
  }, [user])

  const handleSaveName = async (name: string) => {
    try {
      await userApi.saveUserName(name)
      setYourName(name)
    } catch (error) {
      console.error("Failed to save user name:", error)
    }
  }

  const displayName = user?.name || yourName

  // 👇 Jei vartotojas nėra prisijungęs — rodom tik intro
  if (!user) {
    return (
      <div className="container max-w-5xl py-20">
        <div className="text-center bg-gradient-to-b from-gray-50 to-white rounded-2xl p-12 shadow-sm border border-gray-200">
          <h1 className="text-5xl font-extrabold mb-6 text-gray-900">Skolų Departamentas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Sveiki atvykę į jūsų asmeninį skolų ir grupinių išlaidų valdymo įrankį.
            Sekite, kam esate skolingi, matykite grupės balansus realiu laiku ir lengvai 
            dalinkitės išlaidomis su draugais, kolegomis ar šeimos nariais.
          </p>
        </div>
      </div>
    )
  }

  // 👇 Jei vartotojas prisijungęs — rodom grupių puslapį su mygtuku
  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Mano grupės</h2>

        {/* Mygtukas matomas tik prisijungusiam vartotojui */}
        <Link href="/groups/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Sukurti grupę
          </Button>
        </Link>
      </div>

      <GroupsList yourName={displayName} />

      <SetYourNameDialog
        open={isNameDialogOpen}
        onOpenChange={setIsNameDialogOpen}
        currentName={yourName}
        onSaveName={handleSaveName}
      />
    </div>
  )
}
