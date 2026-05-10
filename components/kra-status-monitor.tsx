import { useEffect, useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import useCustomToast from "@/lib/toast"

interface KraStatus {
  status: "up" | "down" | "degraded"
  responseTime: number
  lastChecked: Date
}

export function KraStatusMonitor() {
  const toast = useCustomToast()
  const [status, setStatus] = useState<KraStatus | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      // Simulate API call to check KRA status
      const response = await fetch("/api/kra/status")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to check KRA website status")
      }

      setStatus({
        status: data.status,
        responseTime: data.responseTime,
        lastChecked: new Date(),
      })

      // Show toast based on status
      if (data.status === "up") {
        toast.success("KRA website is up and running")
      } else if (data.status === "degraded") {
        toast.warning("KRA website is experiencing some issues")
      } else {
        toast.error("KRA website is down")
      }
    } catch (_error) {
      setStatus({
        status: "down",
        responseTime: 0,
        lastChecked: new Date(),
      })
      toast.error("Failed to check KRA website status")
    }
  }, [toast])

  useEffect(() => {
    // Initial check
    checkStatus()
    
    // Set up interval for periodic checks
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [checkStatus, toast])

  if (!status) {
    return null
  }

  return (
    <Card className="p-3 rounded-none border-white/10 bg-black/10 shadow-none">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest">GATEWAY</h3>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide opacity-90">
            LATENCY: {status.responseTime}MS
          </p>
        </div>
        <Badge
          className="rounded-none text-[8px] font-bold tracking-widest"
          variant={
            status.status === "up"
              ? "default"
              : status.status === "degraded"
              ? "secondary"
              : "destructive"
          }
        >
          {status.status.toUpperCase()}
        </Badge>
      </div>
    </Card>
  )
}
