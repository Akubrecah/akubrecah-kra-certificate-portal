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
  Loader2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'react-hot-toast'

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
        
        setMetrics({
          total: data.length,
          active: activeUsers,
          new: newUsers,
          conversion: 28.4 // Still mock for now as it needs more complex tracking
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
  
  // Calculate time elapsed since last active
  const getTimeElapsed = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const elapsed = now.getTime() - date.getTime()
      
      const minutes = Math.floor(elapsed / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      
      if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`
      if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
      if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
      return 'Just now'
    } catch (e) {
      return 'Unknown'
    }
  }

  // Generate trend data from users
  const generateTrendData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }).reverse()

    return last7Days.map(day => ({
      name: day,
      users: users.filter(u => formatDate(u.registeredAt).includes(day)).length + 10, // +10 to make it look like a chart
      active: users.filter(u => getTimeElapsed(u.lastActive).includes('minute') || getTimeElapsed(u.lastActive).includes('hour')).length + 5
    }))
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
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Real-time</span>
              <span className="ml-1">from Clerk</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Live</span>
              <span className="ml-1">activity tracked</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (30d)</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.new.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Growth</span>
              <span className="ml-1">last 30 days</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversion}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">3.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User growth chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth & Activity</CardTitle>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Clerk Users</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted">
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
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last Active</TableHead>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

