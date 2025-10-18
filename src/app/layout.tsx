import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import dynamic from 'next/dynamic'

const inter = Inter({ subsets: ['latin'] })

const ClientLayout = dynamic(() => import('@/components/layout/client-layout'), {
  ssr: false,
})

export const metadata: Metadata = {
  title: 'Tanawal Admin Portal',
  description: 'Admin portal for Tanawal food delivery app',
  keywords: ['food delivery', 'admin', 'tanawal', 'restaurant management'],
  authors: [{ name: 'Tanawal Team' }],
  robots: 'noindex, nofollow', // Prevent indexing of admin portal
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
