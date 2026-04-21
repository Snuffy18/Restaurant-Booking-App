import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Floor Plan Builder',
  description: 'Restaurant floor plan builder',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
