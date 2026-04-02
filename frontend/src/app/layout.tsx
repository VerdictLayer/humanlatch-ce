import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HumanLatch',
  description: 'Control plane for AI actions with policy, approvals, and audit trails.',
  icons: { icon: '/humanlatch-logo-64.png', apple: '/humanlatch-logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f1117] text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  )
}
