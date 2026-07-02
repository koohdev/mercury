import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

export const metadata: Metadata = {
  title: 'Mercury Marketing',
  description: 'Track your shifts and hours logged with ease.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mercury Marketing',
  },
  icons: {
    icon: '/standard-favicon.png',
    apple: '/home-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
}

// Trigger Vercel rebuild
export const viewport = {
  themeColor: '#0A0A0A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
