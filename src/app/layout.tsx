import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import ChatWidget from "@/components/ChatWidget"

export const metadata: Metadata = {
  title: "Mocky Prototypes",
  description: "Create and manage API mock prototypes for developers",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <ChatWidget /> {/* 👈 flotante bottom-right */} 
        <Toaster richColors position="bottom-right" closeButton />
        <Analytics />
      </body>
    </html>
  )
}
