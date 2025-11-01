import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { LanguageProvider } from "@/contexts/language-context"
import { NavigationHeader } from "@/components/navigation-header"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Skolų Departamentas",
  description: "Valdykite grupinius mokėjimus ir skolas",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lt">
      <body className="bg-gray-50 text-gray-900">
        <LanguageProvider>
          <AuthProvider>
            <NavigationHeader />
            <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
            <Toaster />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
