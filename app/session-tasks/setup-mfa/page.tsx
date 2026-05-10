import { TaskSetupMFA } from '@clerk/nextjs'

export default function SetupMFAPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/80 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground font-alfa">Secure Your Account</h1>
        <p className="text-muted-foreground text-center mb-8">
          To protect your compliance data, we require multi-factor authentication.
        </p>
        <TaskSetupMFA redirectUrlComplete="/dashboard" />
      </div>
    </div>
  )
}
