"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

import { PlusCircle, Users, DollarSign, TrendingUp, MessageSquare, Bell, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GroupsList from "@/components/groups-list"

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-12">
        <p>Kraunama...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-6xl py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Skolų Departamentas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Valdykite grupinius mokėjimus, sekite skolas ir lengvai dalinkitės išlaidomis su draugais, kolegomis ar
            šeimos nariais.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8">
                Pradėti naudotis
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
                Registruotis
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Grupių valdymas</CardTitle>
              <CardDescription>
                Kurkite grupes kelionėms, butui ar biuro pietums. Kvieskite narius ir valdykite teises.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <DollarSign className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Išlaidų dalijimas</CardTitle>
              <CardDescription>
                Dalinkite išlaidas lygiai, procentais arba pasirinktinėmis sumomis. Palaikome kelias valiutas.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Ataskaitos</CardTitle>
              <CardDescription>
                Peržiūrėkite išsamias finansines ataskaitas, eksportuokite duomenis CSV ar PDF formatu.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-orange-600 mb-2" />
              <CardTitle>Žinutės</CardTitle>
              <CardDescription>
                Grupiniai pokalbiai ir asmeninės žinutės. Bendrauk su draugais tiesiogiai platformoje.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bell className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Pranešimai</CardTitle>
              <CardDescription>
                Gaukite pranešimus apie naujas išlaidas, mokėjimus ir grupės veiklą realiu laiku.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Teisių valdymas</CardTitle>
              <CardDescription>
                Administratoriai, nariai ir svečiai - skirtingos teisės skirtingiems vaidmenims.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Pasiruošę pradėti?</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Prisijunkite dabar ir pradėkite valdyti savo grupinius mokėjimus efektyviau nei bet kada anksčiau.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Sukurti paskyrą nemokamai
            </Button>
          </Link>
        </div>
      </div>
    )
  }

 // Prisijungus – "Mano grupės"
  return (
    <div className="container max-w-5xl py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Mano grupės</h2>

        <Link href="/groups/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Sukurti grupę
          </Button>
        </Link>
      </div>

      <GroupsList />
    </div>
  )
}