'use client'

import * as React from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from './_actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [isPending, setIsPending] = React.useState(false)
  const { user } = useUser()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await completeOnboarding(formData)
      if (res?.message) {
        // Forces a token refresh and refreshes the `User` object
        await user?.reload()
        toast.success('Onboarding complete! Welcome to Akubrecah.')
        router.push('/')
      }
      if (res?.error) {
        toast.error(res.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements to match root layout */}
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[60%] w-[60%] animate-float bg-brand-cyan/20 blur-[100px]" />
      <div className="pointer-events-none fixed right-[-10%] bottom-[-10%] h-[60%] w-[60%] animate-float bg-brand-red/10 blur-[100px]" />

      <Card className="w-full max-w-md border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading tracking-tight text-foreground">Welcome</CardTitle>
          <CardDescription className="text-muted-foreground">
            Let's get you set up with your Akubrecah account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="applicationName">Full Name / Organization</Label>
              <Input
                id="applicationName"
                name="applicationName"
                placeholder="e.g. John Doe or Akubrecah Inc"
                required
                className="bg-background/50 border-border/50 focus:border-brand-cyan/50 focus:ring-brand-cyan/20"
              />
              <p className="text-xs text-muted-foreground">Enter the name you'll use for KRA filings.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationType">Account Type</Label>
              <Input
                id="applicationType"
                name="applicationType"
                placeholder="e.g. Personal, Business, Consultant"
                required
                className="bg-background/50 border-border/50 focus:border-brand-cyan/50 focus:ring-brand-cyan/20"
              />
              <p className="text-xs text-muted-foreground">Briefly describe your usage type.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-brand-cyan hover:bg-brand-cyan-dark text-white font-medium h-11 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Finalizing Setup...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
