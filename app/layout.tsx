import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'MediCore — Plataforma Clínica Digital',
  description: 'Software médico profesional para reanimación neonatal, monitoreo intensivo y registro clínico.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className="h-full antialiased">
        <body className="min-h-full flex flex-col bg-white text-gray-900">{children}</body>
      </html>
    </ClerkProvider>
  )
}