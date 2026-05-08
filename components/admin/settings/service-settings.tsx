'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Save, RefreshCw, AlertCircle, CheckCircle2, Plus, Zap } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ServiceSetting {
  id?: string
  service_key: string
  service_name: string
  is_active: boolean
  description: string
}

export function ServiceSettings() {
  const [services, setServices] = useState<ServiceSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // New Service Form State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newService, setNewService] = useState({
    key: '',
    name: '',
    description: '',
    isActive: true
  })

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/settings/services')
      const result = await response.json()
      if (result.success) {
        setServices(result.data)
      } else {
        setError(result.error || 'Failed to fetch settings')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleToggle = (key: string, checked: boolean) => {
    setServices(prev => prev.map(s => 
      s.service_key === key ? { ...s, is_active: checked } : s
    ))
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const promises = services.map(service => 
        fetch('/api/admin/settings/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            key: service.service_key, 
            isActive: service.is_active 
          })
        })
      )
      
      const results = await Promise.all(promises)
      const allSuccessful = results.every(r => r.ok)
      
      if (allSuccessful) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Some settings failed to save')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleAddService = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      })
      const result = await response.json()
      
      if (result.success) {
        setIsAddDialogOpen(false)
        setNewService({ key: '', name: '', description: '', isActive: true })
        fetchSettings()
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to add service')
      }
    } catch (err: any) {
      setError(err.message || 'Error adding service')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-muted shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-heading text-primary flex items-center gap-2">
              <Zap className="h-6 w-6 text-brand-cyan" />
              Platform Services
            </CardTitle>
            <CardDescription>
              Add or toggle specific services across the Akubrecah Entertainment platform
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-green hover:bg-brand-green/90 text-white font-bold">
                  <Plus className="h-4 w-4 mr-2" /> Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-heading">Register New Service</DialogTitle>
                  <DialogDescription>
                    Create a new service entry. The Service Key must be unique (e.g., 'new_service_slug').
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input 
                      id="name" 
                      placeholder="e.g. Register NSSF" 
                      value={newService.name}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="key">Service Key (Unique)</Label>
                    <Input 
                      id="key" 
                      placeholder="e.g. register_nssf" 
                      value={newService.key}
                      onChange={(e) => setNewService({...newService, key: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="desc">Description</Label>
                    <Input 
                      id="desc" 
                      placeholder="Short description for users" 
                      value={newService.description}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-brand-cyan text-black" onClick={handleAddService} disabled={saving}>
                    {saving ? "Adding..." : "Create Service"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSettings} 
              disabled={loading || saving}
              className="border-muted text-muted-foreground hover:text-primary"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-brand-cyan/5 border-brand-cyan/20 text-brand-red">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-brand-green/5 border-brand-green/20 text-brand-green">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Platform updated successfully.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {loading && services.length === 0 ? (
            <div className="col-span-full flex flex-col gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 w-full animate-pulse bg-muted/20 rounded-xl" />
              ))}
            </div>
          ) : (
            services.map((service) => (
              <div 
                key={service.service_key} 
                className="flex items-center justify-between p-5 rounded-2xl border border-muted bg-background hover:border-brand-cyan/20 hover:shadow-md transition-all group"
              >
                <div className="space-y-1">
                  <Label className="text-lg font-heading text-primary group-hover:text-brand-cyan transition-colors">
                    {service.service_name}
                  </Label>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {service.description || 'No description provided.'}
                  </p>
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    {service.service_key}
                  </code>
                </div>
                <Switch 
                  checked={service.is_active} 
                  onCheckedChange={(checked) => handleToggle(service.service_key, checked)}
                  className="data-[state=checked]:bg-brand-green"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end border-t border-muted px-6 py-4 bg-muted/5">
        <Button 
          onClick={handleSave} 
          disabled={loading || saving}
          className="bg-primary hover:bg-primary/90 text-black font-bold px-8 h-12 rounded-xl shadow-lg"
        >
          {saving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
