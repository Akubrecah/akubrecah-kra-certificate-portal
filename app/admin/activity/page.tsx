'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  User, 
  CreditCard, 
  Settings, 
  Calendar,
  RefreshCw 
} from 'lucide-react'

// Import our ActivityLog component
import { ActivityLog, ActivityItem, ActivityType, ActivityStatus } from '@/components/admin/activity-log'
import { LiveStatusMonitor } from '@/components/live-status-monitor'

// Import mock data
import { mockActivityData, getActivityLogData } from '@/lib/data/activity-log-data'

import { useSearchParams } from 'next/navigation'

export default function ActivityLogPage() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/activities?type=${activeTab}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [activeTab])

  // Filter activities based on search and status
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || activity.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  })

  const handleActivityClick = (activity: ActivityItem) => {
    console.log('Activity clicked:', activity)
  }

  return (
    <div className="space-y-6">
      <LiveStatusMonitor />
      <Card className="border-white/5 bg-background/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
        <CardHeader className="pb-4 text-center border-b border-white/5">
          <CardTitle className="text-sm font-bold uppercase tracking-[0.2em]">Activity Logs</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-widest opacity-50">Real-time platform events</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full flex justify-center bg-muted/50 rounded-full p-1 h-10 border border-white/5">
              <TabsTrigger value="all" className="rounded-full text-[10px] uppercase tracking-wider px-4">All</TabsTrigger>
              <TabsTrigger value="auth" className="rounded-full text-[10px] uppercase tracking-wider px-4">Auth</TabsTrigger>
              <TabsTrigger value="return" className="rounded-full text-[10px] uppercase tracking-wider px-4">Filings</TabsTrigger>
              <TabsTrigger value="system" className="rounded-full text-[10px] uppercase tracking-wider px-4">System</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-50" />
                  <Input
                    placeholder="Search logs..." 
                    className="pl-9 h-9 rounded-full text-[11px] precision-outline bg-muted/30 border-white/5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[140px] h-9 rounded-full text-[11px] precision-outline bg-muted/30 border-white/5">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={fetchActivities}
                  className="h-9 rounded-full px-4 text-[10px] font-bold uppercase tracking-wider border-white/10 hover:bg-white/5"
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <ActivityLog 
                activities={filteredActivities}
                maxItems={50}
                height={600}
                showFilters={false}
                showSearch={false} 
                onItemClick={handleActivityClick}
                onRefresh={fetchActivities}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
