'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2,
  MapPin,
  Briefcase,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface JobPosition {
  id: string
  title: string
  location: string
  type: string
  department: string
  jobNumber: string
  worksite: string
  travel: string
  roleType: string
  profession: string
  discipline: string
  employmentType: string
  datePosted: string
  description: string
  overview: string[]
  responsibilities: string[]
  requiredQualifications: string[]
  preferredQualifications: string[]
  additionalRequirements: string[]
  compensation: string
  createdAt: string
  updatedAt: string
}

const INITIAL_JOB_STATE: Partial<JobPosition> = {
  title: '',
  location: 'Nairobi, Kenya',
  type: 'Full-Time',
  department: 'Engineering',
  jobNumber: '',
  worksite: 'Office',
  travel: 'None',
  roleType: 'Individual Contributor',
  profession: 'Software Engineering',
  discipline: 'Computer Science',
  employmentType: 'Full-Time',
  datePosted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  description: '',
  overview: [],
  responsibilities: [],
  requiredQualifications: [],
  preferredQualifications: [],
  additionalRequirements: [],
  compensation: '',
}

export default function AdminCareersPage() {
  const [jobs, setJobs] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Partial<JobPosition> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/jobs')
      if (!response.ok) throw new Error('Failed to fetch jobs')
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load job positions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingJob(INITIAL_JOB_STATE)
    setIsDialogOpen(true)
  }

  const handleEdit = (job: JobPosition) => {
    setEditingJob(job)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job position?')) return

    try {
      const response = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete')
      toast.success('Job position deleted')
      fetchJobs()
    } catch (error) {
      toast.error('Failed to delete job position')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob?.title || !editingJob?.jobNumber) {
      toast.error('Title and Job Number are required')
      return
    }

    try {
      setSubmitting(true)
      const url = editingJob.id ? `/api/admin/jobs/${editingJob.id}` : '/api/admin/jobs'
      const method = editingJob.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingJob),
      })

      if (!response.ok) throw new Error('Failed to save job')
      
      toast.success(editingJob.id ? 'Job updated' : 'Job created')
      setIsDialogOpen(false)
      fetchJobs()
    } catch (error) {
      toast.error('Failed to save job position')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading careers...</span>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight uppercase">Careers Management</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Create and manage job opportunities within the portal.
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest h-9 px-6"
        >
          <Plus className="mr-2 h-4 w-4" /> New Position
        </Button>
      </div>

      <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-muted/20">
          <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Open Positions List</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="SEARCH POSITIONS..."
              className="pl-9 h-9 rounded-full bg-black/5 border-white/5 precision-outline text-[10px] uppercase tracking-widest min-w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-white/5">
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Position</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Job ID</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Department</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Location</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    No positions found. Click "New Position" to start.
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow key={job.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm uppercase tracking-tight">{job.title}</span>
                        <span className="text-[8px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-0.5">
                          Posted: {job.datePosted}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary font-bold">#{job.jobNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 bg-white/5">
                        {job.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {job.location}
                    </TableCell>
                    <TableCell>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {job.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => handleEdit(job)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 glass-panel border-white/10 shadow-2xl">
          <DialogHeader className="p-6 border-b border-white/5 bg-muted/20">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter">
              {editingJob?.id ? 'Modify Position' : 'Broadcast New Position'}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Configure the parameters for this job listing.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6">
            <form id="job-form" onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Position Title</Label>
                  <Input 
                    value={editingJob?.title} 
                    onChange={e => setEditingJob(prev => ({ ...prev, title: e.target.value }))}
                    className="glass h-11 text-xs font-bold uppercase tracking-widest"
                    placeholder="E.G. SENIOR SYSTEMS ARCHITECT"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Job Number / Reference</Label>
                  <Input 
                    value={editingJob?.jobNumber} 
                    onChange={e => setEditingJob(prev => ({ ...prev, jobNumber: e.target.value }))}
                    className="glass h-11 text-xs font-bold uppercase tracking-widest font-mono"
                    placeholder="AKB-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Department</Label>
                  <Input 
                    value={editingJob?.department} 
                    onChange={e => setEditingJob(prev => ({ ...prev, department: e.target.value }))}
                    className="glass h-10 text-[10px] font-bold uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Location</Label>
                  <Input 
                    value={editingJob?.location} 
                    onChange={e => setEditingJob(prev => ({ ...prev, location: e.target.value }))}
                    className="glass h-10 text-[10px] font-bold uppercase tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Job Type</Label>
                  <Input 
                    value={editingJob?.type} 
                    onChange={e => setEditingJob(prev => ({ ...prev, type: e.target.value }))}
                    className="glass h-10 text-[10px] font-bold uppercase tracking-widest"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Mission Overview / Description</Label>
                <Textarea 
                  value={editingJob?.description} 
                  onChange={e => setEditingJob(prev => ({ ...prev, description: e.target.value }))}
                  className="glass min-h-[120px] text-xs font-medium leading-relaxed"
                  placeholder="Describe the primary mission and impact of this role..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Responsibilities (Comma separated)</Label>
                  <Textarea 
                    value={editingJob?.responsibilities?.join(', ')} 
                    onChange={e => setEditingJob(prev => ({ ...prev, responsibilities: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                    className="glass min-h-[80px] text-[10px] font-bold uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Required Specs (Comma separated)</Label>
                  <Textarea 
                    value={editingJob?.requiredQualifications?.join(', ')} 
                    onChange={e => setEditingJob(prev => ({ ...prev, requiredQualifications: e.target.value.split(',').map(s => s.trim()).filter(s => s) }))}
                    className="glass min-h-[80px] text-[10px] font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Compensation Bracket</Label>
                <Input 
                  value={editingJob?.compensation} 
                  onChange={e => setEditingJob(prev => ({ ...prev, compensation: e.target.value }))}
                  className="glass h-11 text-sm font-black tracking-tight uppercase"
                  placeholder="E.G. KSH 150,000 - 250,000"
                />
              </div>
            </form>
          </ScrollArea>

          <DialogFooter className="p-6 border-t border-white/5 bg-muted/20">
            <Button 
              variant="ghost" 
              onClick={() => setIsDialogOpen(false)}
              className="rounded-full text-[10px] font-black uppercase tracking-widest px-8"
            >
              Abort
            </Button>
            <Button 
              type="submit" 
              form="job-form"
              disabled={submitting}
              className="rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest px-10 h-11 shadow-xl shadow-primary/20"
            >
              {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : editingJob?.id ? 'Commit Changes' : 'Initialize Broadcast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
