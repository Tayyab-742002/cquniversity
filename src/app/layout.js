import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PsycoTest - Cognitive Assessment Platform',
  description: 'A comprehensive cognitive testing platform for psychological research',
  keywords: 'psychology, cognitive testing, research, assessment, neuroscience',
  authors: [{ name: 'PsycoTest Team' }],
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen bg-background">
       <MainLayout>
        {children}
       </MainLayout>
          </div>
      </body>
    </html>
    </ClerkProvider>
  )
}
