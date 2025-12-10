import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { NavigationHeader } from "@/components/navigation-header"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Skolų Departamentas",
  description: "Valdykite grupinius mokėjimus ir skolas",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lt">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-gray-50 text-gray-900">
          <AuthProvider>
            <NavigationHeader />
            <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center"> {children}</main>
            <Toaster />
          </AuthProvider>
      </body>
    </html>
  )
}
