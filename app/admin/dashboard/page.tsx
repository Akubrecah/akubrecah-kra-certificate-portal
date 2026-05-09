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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Syncing realtime data...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      {/* Top stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totals.users.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Real-time</span>
              <span className="ml-1">from Clerk</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {dashboardData.totals.revenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Live</span>
              <span className="ml-1">total revenue</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns Filed</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totals.returns.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Live</span>
              <span className="ml-1">total returns</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totals.successRate.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Live</span>
              <span className="ml-1">completion rate</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts section */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4 border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.userMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#06b6d4" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 8, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>PIN Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.pinBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent activity and table data */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground italic text-sm">
                  No recent activity found in database.
                </div>
              ) : (
                dashboardData.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4 rounded-lg border border-primary/5 p-3 bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div className="rounded-full p-2 bg-primary/10">
                      {activity.type === 'return' && <FileText className="h-4 w-4 text-primary" />}
                      {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-primary" />}
                      {activity.type === 'registration' && <Users className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.user}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'return' ? 'Filed a tax return' : 
                         activity.type === 'payment' ? 'Made a payment' : 
                         'Active session detected'}
                      </p>
                      <div className="flex items-center pt-1">
                        <CalendarDays className="mr-1 h-3 w-3 text-muted-foreground opacity-70" />
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          activity.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          activity.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Returns Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.returnsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

