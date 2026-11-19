import React from 'react'
import type { Metadata } from 'next'
import './styles.css'

const title = 'Agro Web'
const description = 'Smarter Farming. Stronger Farmers. Better Harvests.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title,
  description,
  icons: { icon: '/agroweb-logo.svg', shortcut: '/agroweb-logo.svg' },
  openGraph: {
    title,
    description,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fbfaf5] text-[#17382c] antialiased">
        <div id="root" tabIndex={-1}>
          {children}
        </div>
      </body>
    </html>
  )
}
