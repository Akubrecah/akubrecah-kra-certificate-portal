'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  FileText, 
  Users, 
  Activity,
  CalendarDays,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Initial state - will be replaced by API data
const initialState = {
  totals: {
    users: 0,
    revenue: 0,
    returns: 0,
    successRate: 0
  },
  userMetrics: [
    { name: 'Loading...', users: 0 }
  ],
  pinBreakdown: [
    { name: 'Business', value: 430 },
    { name: 'Individual', value: 720 }
  ],
  transactionData: [
    { name: 'Week 1', amount: 24000 },
    { name: 'Week 2', amount: 31000 },
  ],
  returnsData: [
    { name: 'Today', completed: 0, pending: 0, failed: 0 },
  ],
  recentActivity: []
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(initialState)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard')
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        const data = await response.json()
        
        if (data.success) {
          setDashboardData({
            ...initialState,
            ...data,
            // Keep some mock data for charts that don't have real data yet
            pinBreakdown: data.pinBreakdown || initialState.pinBreakdown,
            transactionData: data.transactionData || initialState.transactionData,
            returnsData: data.returnsData || initialState.returnsData,
          })
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Could not load dashboard metrics')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000)
      if (diffInMins < 60) return `${diffInMins} mins ago`
      const diffInHours = Math.floor(diffInMins / 60)
      if (diffInHours < 24) return `${diffInHours} hours ago`
      return `${Math.floor(diffInHours / 24)} days ago`
    } catch (e) {
      return 'Recently'
    }
  }

  if (loading && dashboardData.totals.users === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="ml-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Syncing realtime data...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Top stats row - High density minimal cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Network Growth", value: dashboardData.totals.users, icon: Users, sub: "Clerk Synced" },
          { title: "Protocol Yield", value: `KES ${dashboardData.totals.revenue}`, icon: DollarSign, sub: "Gross Return" },
          { title: "Active Files", value: dashboardData.totals.returns, icon: FileText, sub: "Generated" },
          { title: "Success Rate", value: `${dashboardData.totals.successRate.toFixed(1)}%`, icon: CheckCircle, sub: "Completion" }
        ].map((stat, i) => (
          <Card key={i} className="bg-white/5 border-white/5 shadow-none hover:bg-white/[0.08] transition-all group rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">{stat.title}</CardTitle>
              <stat.icon className="h-3 w-3 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-xl font-bold tracking-tight">{stat.value.toLocaleString()}</div>
              <div className="flex items-center text-[9px] font-bold uppercase tracking-widest text-primary/40 mt-1">
                <span>{stat.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-white/5 bg-white/5 shadow-none p-6">
          <div className="flex flex-col gap-1 mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">User Ingress</h3>
            <p className="text-[9px] uppercase tracking-widest opacity-40">7-Day Registration Velocity</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardData.userMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.05} vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff" fontSize={8} tickLine={false} axisLine={false} tick={{ opacity: 0.3 }} />
              <YAxis stroke="#ffffff" fontSize={8} tickLine={false} axisLine={false} tick={{ opacity: 0.3 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}
                labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}
                itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' }}
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: 'hsl(var(--primary))' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="rounded-2xl border-white/5 bg-white/5 shadow-none p-6">
          <div className="flex flex-col gap-1 mb-8">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Asset Distribution</h3>
            <p className="text-[9px] uppercase tracking-widest opacity-40">Account Classification</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={dashboardData.pinBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                 itemStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Recent activity */}
      <Card className="rounded-2xl border-white/5 bg-white/5 shadow-none p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Vault Activity</h3>
            <p className="text-[9px] uppercase tracking-widest opacity-40">Live Real-time Ledger</p>
          </div>
          <Activity className="h-4 w-4 text-primary opacity-40" />
        </div>
        
        <div className="space-y-3">
          {dashboardData.recentActivity.length === 0 ? (
            <div className="py-20 text-center text-[9px] font-bold uppercase tracking-widest opacity-20 border border-dashed border-white/5 rounded-2xl">
              LEDGER EMPTY
            </div>
          ) : (
            dashboardData.recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex items-center gap-6 p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all rounded-xl">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                  {activity.type === 'return' && <FileText className="h-3 w-3 text-primary" />}
                  {activity.type === 'payment' && <DollarSign className="h-3 w-3 text-primary" />}
                  {activity.type === 'registration' && <Users className="h-3 w-3 text-primary" />}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-bold uppercase tracking-wide">{activity.user}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest opacity-40">
                      {activity.type} Protocol Verified
                    </p>
                  </div>
                  <div className="text-right space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-30">{formatTimeAgo(activity.time)}</p>
                    <span className="inline-block text-[8px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border border-primary/20 text-primary bg-primary/5">
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
