import { Inter, Alfa_Slab_One, Satisfy, Plus_Jakarta_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes'
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

import { TooltipProviderWrapper } from '@/components/providers/tooltip-provider'
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { getDomainTheme } from '@/lib/utils'
import KRAAnnouncementBanner from '@/components/KRAAnnouncementBanner'
import { Analytics } from "@vercel/analytics/next"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta" })
const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-alfa" })
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], variable: "--font-satisfy" })

export const metadata = {
  title: "Akubrecah",
  description: "Your Professional KRA Compliance & PDF Mastery Suite. Verify KRA PINs and access 88+ powerful, private PDF tools locally in your browser.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const theme = getDomainTheme(hostname)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} ${alfa.variable} ${satisfy.variable} font-sans`} data-theme={theme} suppressHydrationWarning={true}>
        <ClerkProvider 
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          taskUrls={{
            'setup-mfa': '/session-tasks/setup-mfa',
            'reset-password': '/session-tasks/reset-password',
          }}
        >
          {/* SiteHeader is managed within AdminLayoutWrapper */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <TooltipProviderWrapper>
              <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
                {/* Design Background Glows */}
                <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[60%] w-[60%] animate-float bg-glow-teal opacity-80 blur-[100px]" />
                <div className="pointer-events-none fixed right-[-10%] bottom-[-10%] h-[60%] w-[60%] animate-float bg-glow-red opacity-30 blur-[100px] [animation-delay:2s]" />
                
                <KRAAnnouncementBanner />
                <AdminLayoutWrapper>
                  {children}
                </AdminLayoutWrapper>
              </div>
            </TooltipProviderWrapper>
            <Toaster
              toastOptions={{
                className: 'react-hot-toast',
                style: {
                  maxWidth: '500px',
                  fontFamily: 'var(--font-sans)',
                },
                success: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFFFF',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFFFF',
                  },
                },
              }}
            />
            <Analytics />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}