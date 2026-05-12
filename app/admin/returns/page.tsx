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
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  AlertTriangle,
  Search,
  RefreshCw,
  FileDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface RetrievalData {
  id: string;
  userName: string;
  userEmail: string;
  pinNumber: string;
  authorizedBy: string;
  submissionDate: string;
  status: string;
  amount: number;
  activityType: string;
  description: string;
}

export default function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [retrievals, setRetrievals] = useState<RetrievalData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRetrievals = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/admin/returns')
      if (!response.ok) throw new Error('Failed to fetch retrievals')
      const data = await response.json()
      setRetrievals(data)
    } catch (error) {
      console.error('Error fetching retrievals:', error)
      toast.error('Failed to load real-time retrieval data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRetrievals()
  }, [])
  
  const filteredRetrievals = retrievals.filter(ret => 
    ret.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.pinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ret.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Format date to display in a more friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
    }
  }

  const exportToCSV = () => {
    if (filteredRetrievals.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['User', 'Email', 'KRA PIN', 'Authorized By', 'Date Time', 'Status', 'Amount']
    const csvContent = [
      headers.join(','),
      ...filteredRetrievals.map(ret => [
        `"${ret.userName}"`,
        `"${ret.userEmail}"`,
        `"${ret.pinNumber}"`,
        `"${ret.authorizedBy}"`,
        `"${formatDate(ret.submissionDate)}"`,
        `"${ret.status}"`,
        ret.amount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `KRA_Retrievals_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Report generated successfully')
  }

  // Calculate metrics based on real data
  const totalRetrievals = retrievals.length
  const completedRetrievals = retrievals.filter(r => r.status === 'completed').length
  const pendingRetrievals = retrievals.filter(r => r.status === 'pending').length
  const failedRetrievals = retrievals.filter(r => r.status === 'failed').length

  // Generate chart data from real retrievals
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const chartData = last7Days.map(date => {
    const dayRetrievals = retrievals.filter(r => r.submissionDate && typeof r.submissionDate === 'string' && r.submissionDate.startsWith(date))
    return {
      name: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      completed: dayRetrievals.filter(r => r.status === 'completed').length,
      pending: dayRetrievals.filter(r => r.status === 'pending').length,
      failed: dayRetrievals.filter(r => r.status === 'failed').length,
    }
  })

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Retrievals Management</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRetrievals} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportToCSV}>
            <FileDown className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
      
      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Retrievals</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRetrievals}</div>
            <p className="text-xs text-muted-foreground">Real-time system data</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRetrievals}</div>
            <p className="text-xs text-muted-foreground">Successful retrievals</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRetrievals}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedRetrievals}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Returns chart */}
      <Card>
        <CardHeader>
          <CardTitle>Retrieval Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
              <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Returns table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Retrieval Records</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search retrievals..."
                className="pl-8 max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading real-time data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>KRA PIN</TableHead>
                  <TableHead>Authorized By</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRetrievals.length > 0 ? (
                  filteredRetrievals.map((ret) => (
                    <TableRow key={ret.id}>
                      <TableCell className="font-medium">
                        <div>{ret.userName}</div>
                        <div className="text-xs text-muted-foreground">{ret.userEmail}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ret.pinNumber}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-muted px-2 py-1 rounded">{ret.authorizedBy}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(ret.submissionDate)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(ret.status)}`}>
                          {ret.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        KES {ret.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No retrieval records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
