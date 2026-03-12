import type { Metadata } from 'next'
import { Caveat, Nunito } from 'next/font/google'
import './globals.css'
import { startMonitoring } from '@/lib/monitor'

const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })

if (typeof window === 'undefined') {
  startMonitoring()
}

export const metadata: Metadata = {
  title: 'Seshat',
  description: 'Visual homelab infrastructure map with live monitoring',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${caveat.variable} ${nunito.variable} font-nunito`}>{children}</body>
    </html>
  )
}
