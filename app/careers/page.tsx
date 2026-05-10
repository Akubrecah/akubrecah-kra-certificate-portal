"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, BookmarkPlus, Share2, Briefcase, MapPin, Clock, ArrowRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PageBackground } from "@/components/ui/page-background"
import { motion, AnimatePresence } from "framer-motion"
import { useUser, RedirectToSignIn } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

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
}

export default function CareersPage() {
  const { isLoaded, isSignedIn } = useUser()

  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [filter, setFilter] = useState({
    department: "all",
    type: "all",
    location: "all"
  })

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/jobs')
        if (!response.ok) throw new Error('Failed to fetch jobs')
        const data = await response.json()
        setJobPositions(data)
      } catch (error) {
        console.error('Error fetching jobs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])


  const filteredPositions = jobPositions.filter(position => {
    return (
      (filter.department === "all" || position.department === filter.department) &&
      (filter.type === "all" || position.type === filter.type) &&
      (filter.location === "all" || position.location === filter.location)
    )
  })

  return (
    <PageBackground className="pt-24 pb-20">
      {isSignedIn ? (
        <div className="container mx-auto px-6 max-w-7xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Open Positions</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-tight uppercase">
              Join the <span className="text-primary">Future</span> of Compliance.
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-90 font-bold max-w-2xl mx-auto">
              We're looking for precision-driven individuals to help revolutionize tax technology across the continent.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Select value={filter.department} onValueChange={(v) => setFilter(f => ({ ...f, department: v }))}>
              <SelectTrigger className="w-[160px] h-9 glass rounded-full text-[10px] font-bold uppercase tracking-widest border-border">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filter.type} onValueChange={(v) => setFilter(f => ({ ...f, type: v }))}>
              <SelectTrigger className="w-[160px] h-9 glass rounded-full text-[10px] font-bold uppercase tracking-widest border-border">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full-Time">Full-Time</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Grid */}
          {loading ? (
            <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Scanning Opportunities...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPositions.map((position, i) => (
                  <motion.div
                    layout
                    key={position.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card 
                      className="glass-card group cursor-pointer hover:border-primary/30 transition-all duration-500 overflow-hidden h-full flex flex-col"
                      onClick={() => setSelectedPosition(position)}
                    >
                      <CardHeader className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {position.type}
                          </Badge>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest opacity-70 font-mono">
                            #{position.jobNumber}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-base font-black tracking-tight uppercase leading-tight group-hover:text-primary transition-colors">
                            {position.title}
                          </CardTitle>
                          <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-90 flex items-center gap-1.5">
                            <MapPin size={10} className="text-primary" />
                            {position.location}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            {position.department}
                          </span>
                          <div className="h-8 w-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}


          {/* Empty State */}
          {filteredPositions.length === 0 && (
            <div className="text-center py-20 glass rounded-[2rem] border-dashed border-border">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No matching positions found</h3>
              <p className="text-[9px] uppercase tracking-widest opacity-70 mt-1">Try adjusting your filters to find more opportunities.</p>
            </div>
          )}
        </div>

        {/* Detail Dialog / Overlay */}
        <AnimatePresence>
          {selectedPosition && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPosition(null)}
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-7xl max-h-[85vh] glass-panel overflow-hidden flex flex-col shadow-2xl border-primary/10"
              >
                {/* Modal Header */}
                <div className="p-6 md:p-10 border-b border-border bg-muted/20 flex items-start justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                        {selectedPosition.jobNumber}
                      </Badge>
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-border">
                        {selectedPosition.department}
                      </Badge>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">
                      {selectedPosition.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-90">
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> {selectedPosition.location}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {selectedPosition.type}</span>
                      <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-primary" /> {selectedPosition.roleType}</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedPosition(null)}
                    className="rounded-full hover:bg-muted/50"
                  >
                    <X size={20} />
                  </Button>
                </div>

                {/* Modal Content */}
                <ScrollArea className="flex-1">
                  <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12">
                    {/* Overview */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Mission Overview</h4>
                      <div className="space-y-4">
                        {selectedPosition.overview.map((p, i) => (
                          <p key={i} className="text-sm text-foreground/80 leading-relaxed font-medium">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Core Responsibilities</h4>
                        <ul className="space-y-3">
                          {selectedPosition.responsibilities.map((r, i) => (
                            <li key={i} className="text-[11px] font-bold uppercase tracking-wide text-foreground/70 flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary">Technical Specs</h4>
                        <ul className="space-y-3">
                          {selectedPosition.requiredQualifications.map((q, i) => (
                            <li key={i} className="text-[11px] font-bold uppercase tracking-wide text-foreground/70 flex items-start gap-3">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Compensation */}
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <h4 className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-2">Compensation Bracket</h4>
                      <p className="text-lg font-black tracking-tight text-foreground uppercase">{selectedPosition.compensation}</p>
                    </div>
                  </div>
                </ScrollArea>

                {/* Modal Footer */}
                <div className="p-6 border-t border-border bg-background/50 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full border-border text-[9px] font-black uppercase tracking-widest px-4">
                      <BookmarkPlus size={14} className="mr-2" /> Save Protocol
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full border-border text-[9px] font-black uppercase tracking-widest px-4">
                      <Share2 size={14} className="mr-2" /> Share Intel
                    </Button>
                  </div>
                  <Button 
                    className="w-full md:w-auto bg-primary text-white rounded-full font-black uppercase tracking-widest text-[10px] h-10 px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                    onClick={() => setShowApplicationDialog(true)}
                  >
                    Initiate Application <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Application Dialog - Matching Style */}
        <AnimatePresence>
          {showApplicationDialog && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowApplicationDialog(false)}
                className="absolute inset-0 bg-background/90 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-xl glass-panel shadow-3xl border-primary/20 overflow-hidden"
              >
                <div className="p-8 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                      Personnel Onboarding
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => setShowApplicationDialog(false)} className="rounded-full">
                      <X size={18} />
                    </Button>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Onboarding Intel Request</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-90 mt-1">
                    Applying for: {selectedPosition?.title}
                  </p>
                </div>

                <ScrollArea className="max-h-[60vh]">
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-90">First Name</Label>
                        <Input className="glass h-10 text-xs font-bold uppercase tracking-widest border-border bg-background/40" placeholder="VAULT_ID" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-widest opacity-90">Last Name</Label>
                        <Input className="glass h-10 text-xs font-bold uppercase tracking-widest border-border bg-background/40" placeholder="ACCESS_CODE" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-90">Professional Email</Label>
                      <Input className="glass h-10 text-xs font-bold uppercase tracking-widest border-border bg-background/40" placeholder="PROTOCOL@COMPANY.COM" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest opacity-90">Resume Intel (.PDF)</Label>
                      <Input type="file" className="glass h-12 text-[10px] font-bold uppercase tracking-widest border-border bg-background/40 pt-3" />
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-8 border-t border-border bg-muted/20 flex gap-3">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-full font-black uppercase tracking-widest text-[10px] border border-border"
                    onClick={() => setShowApplicationDialog(false)}
                  >
                    Abort
                  </Button>
                  <Button 
                    className="flex-[2] h-12 rounded-full bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                  >
                    Submit Credentials
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ) : (
        <RedirectToSignIn />
      )}

    </PageBackground>
  )
}