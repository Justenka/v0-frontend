"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle, UserCircle, LogIn } from "lucide-react"
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

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mano grupės</h1>
        <div className="flex gap-2">
          {!user && (
            <Link href="/login">
              <Button variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Prisijungti
              </Button>
            </Link>
          )}
          {!user && (
            <Button
              variant="outline"
              onClick={() => setIsNameDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <UserCircle className="h-4 w-4" />
              {isLoading ? "Kraunama..." : displayName ? displayName : "Nustatyti vardą"}
            </Button>
          )}
          <Link href="/groups/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Sukurti grupę
            </Button>
          </Link>
        </div>
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
