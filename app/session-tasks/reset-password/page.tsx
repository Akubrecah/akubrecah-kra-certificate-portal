import { TaskResetPassword } from '@clerk/nextjs'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/80 backdrop-blur-xl p-8 rounded-3xl border border-border/50 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground font-alfa">Reset Password</h1>
        <p className="text-muted-foreground text-center mb-8">
          Your password has been marked as compromised. Please create a new secure password to continue.
        </p>
        <TaskResetPassword redirectUrlComplete="/dashboard" />
      </div>
    </div>
  )
}
