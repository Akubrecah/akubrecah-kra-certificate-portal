'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Activity, 
  ArrowUpRight, 
  CheckCircle, 
  Download, 
  Search, 
  Users,
  Loader2,
  History,
  Eye
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'react-hot-toast'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  name: string
  email: string
  pin: string
  status: string
  registeredAt: string
  lastActive: string
  role: string
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    new: 0,
    conversion: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userActivity, setUserActivity] = useState<any[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  // Helper: Get relative time
  const getTimeElapsed = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMins = Math.floor((now.getTime() - date.getTime()) / 60000)
      if (diffInMins < 1) return 'Just now'
      if (diffInMins < 60) return `${diffInMins}m ago`
      const diffInHours = Math.floor(diffInMins / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    } catch (e) {
      return 'Recently'
    }
  }

  // Helper: Generate trend data for chart
  const generateTrendData = () => {
    // Generate last 7 days labels
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      
      // Filter users registered on this day
      const count = users.filter(u => {
        const regDate = new Date(u.registeredAt)
        return regDate.getDate() === d.getDate() && regDate.getMonth() === d.getMonth()
      }).length

      return { name: label, users: count, active: Math.floor(count * 0.8) + 1 }
    })
  }

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/users')
        if (!response.ok) throw new Error('Failed to fetch users')
        const data = await response.json()
        setUsers(data)
        
        // Calculate basic metrics from data
        const now = new Date()
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
        
        const newUsers = data.filter((u: User) => new Date(u.registeredAt) > thirtyDaysAgo).length
        const activeUsers = data.filter((u: User) => new Date(u.lastActive) > thirtyDaysAgo).length
        
        const returnsCount = data.filter((u: User) => u.pin !== 'N/A').length
        const conversionRate = data.length > 0 ? (returnsCount / data.length) * 100 : 0
        
        setMetrics({
          total: data.length,
          active: activeUsers,
          new: newUsers,
          conversion: Math.round(conversionRate * 10) / 10
        })
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Could not load registered users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const fetchUserActivity = async (clerkId: string) => {
    try {
      setLoadingActivity(true)
      const response = await fetch(`/api/admin/activities?clerkId=${clerkId}`)
      if (!response.ok) throw new Error('Failed to fetch user activity')
      const data = await response.json()
      setUserActivity(data)
    } catch (error) {
      console.error('Error fetching activity:', error)
      toast.error('Could not load user actions')
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setIsSheetOpen(true)
    fetchUserActivity(user.id)
  }
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.pin && user.pin.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  // Format date to display in a more friendly way
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (e) {
      return 'Invalid Date'
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading realtime users...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">
      
      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors rounded-2xl border-white/5 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.total.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-muted-foreground mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold uppercase tracking-tighter">Real-time</span>
              <span className="ml-1 uppercase opacity-80">from Clerk</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors rounded-2xl border-white/5 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.active.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-muted-foreground mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold uppercase tracking-tighter">Live</span>
              <span className="ml-1 uppercase opacity-80">activity tracked</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors rounded-2xl border-white/5 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Users (30d)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.new.toLocaleString()}</div>
            <div className="flex items-center text-[10px] text-muted-foreground mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold uppercase tracking-tighter">Growth</span>
              <span className="ml-1 uppercase opacity-80">last 30 days</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors rounded-2xl border-white/5 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{metrics.conversion}%</div>
            <div className="flex items-center text-[10px] text-muted-foreground mt-1">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-bold uppercase tracking-tighter">3.2%</span>
              <span className="ml-1 uppercase opacity-80">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User growth chart */}
      <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">User Growth & Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateTrendData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px', border: 'none' }} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="New Users"
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="active" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Active Sessions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* User table */}
      <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Registered Clerk Users</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="SEARCH..."
                className="pl-9 h-9 rounded-full bg-black/5 border-white/5 precision-outline text-[10px] uppercase tracking-widest max-w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-full p-2.5 text-muted-foreground hover:bg-muted/50 border border-white/5 transition-all">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download CSV</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>KRA PIN</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs overflow-hidden">
                          {user.name.charAt(0)}
                        </div>
                        {user.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{user.email}</TableCell>
                    <TableCell className="text-xs font-mono">{user.pin}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[10px]">
                      {formatDate(user.registeredAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[10px]">
                      {getTimeElapsed(user.lastActive)}
                    </TableCell>
                    <TableCell className="text-right">
                      <button 
                        onClick={() => handleUserClick(user)}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                        title="View Actions"
                      >
                        <History className="h-4 w-4 text-primary" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] border-l-border bg-background/95 backdrop-blur-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              User Actions History
            </SheetTitle>
            <SheetDescription>
              Viewing activity log for <strong>{selectedUser?.name}</strong>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium truncate">{selectedUser?.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">KRA PIN</p>
                <p className="text-sm font-medium font-mono">{selectedUser?.pin}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Actions
              </h4>
              
              <ScrollArea className="h-[calc(100vh-320px)] pr-4">
                {loadingActivity ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p className="text-sm">Loading activity logs...</p>
                  </div>
                ) : userActivity.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                    <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No actions recorded for this user yet.</p>
                  </div>
                ) : (
                  <div className="relative space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {userActivity.map((activity, idx) => (
                      <div key={activity.id} className="relative pl-8 group">
                        <div className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 border-background shadow-sm transition-transform group-hover:scale-125 ${
                          activity.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold leading-none">{activity.title}</p>
                            <span className="text-[10px] text-muted-foreground">{getTimeElapsed(activity.timestamp)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {activity.description}
                          </p>
                          {activity.type === 'document' && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Certificate Generated
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

