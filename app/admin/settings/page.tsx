'use client'

import React, { useState, useEffect } from 'react'
import useCustomToast from "@/lib/toast"

import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Mail, 
  FileText, 
  CreditCard, 
  Save,
  Users,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Import settings components
import { GeneralSettings } from '@/components/admin/settings/general-settings'
import { SecuritySettings } from '@/components/admin/settings/security-settings'
import { NotificationSettings } from '@/components/admin/settings/notification-settings'
import { ApiSettings } from '@/components/admin/settings/api-settings'
import { PaymentSettings } from '@/components/admin/settings/payment-settings'
import { ServiceSettings } from '@/components/admin/settings/service-settings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<Record<string, any>>({})
  const toast = useCustomToast()

  // Inline forms state
  const [taxSettings, setTaxSettings] = useState({
    taxYear: '2023',
    vatRate: '16',
    individualDeadline: '2023-06-30',
    corporateDeadline: '2023-06-30',
    monthlyDeadline: '20',
    extensionDays: '30',
    testMode: true
  })

  const [localizationSettings, setLocalizationSettings] = useState({
    defaultLanguage: 'en',
    timezone: 'africa-nairobi',
    dateFormat: 'dd-mm-yyyy',
    currency: 'kes',
    enabledLanguages: { en: true, sw: true, fr: false }
  })

  const [emailSettings, setEmailSettings] = useState({
    provider: 'sendgrid',
    fromEmail: 'noreply@akubrecahentertainment.com',
    replyToEmail: 'support@akubrecahentertainment.com',
    testOnSave: false
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      
      if (data.success && data.data) {
        setSettings(data.data)
        
        // Populate inline form states if they exist in DB
        if (data.data.tax) setTaxSettings({ ...taxSettings, ...data.data.tax })
        if (data.data.localization) setLocalizationSettings({ ...localizationSettings, ...data.data.localization })
        if (data.data.email) setEmailSettings({ ...emailSettings, ...data.data.email })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error("Could not load your configuration. Using defaults.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSaveInlineSettings = async (category: string, dataToSave: any) => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settings: dataToSave })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setSaveSuccess(true)
        toast.success("Your changes have been successfully saved.")
        setTimeout(() => setSaveSuccess(null), 3000)
        
        // Update local state
        setSettings(prev => ({
          ...prev,
          [category]: { ...prev[category], ...dataToSave }
        }))
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error(`Error saving ${category} settings:`, error)
      setSaveSuccess(false)
      toast.error(error.message || "There was a problem saving your changes.")
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="flex-1 space-y-8 p-6 lg:p-2 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold uppercase tracking-[0.3em]">Settings</h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Configure platform parameters and preferences</p>
      </div>

      
      {saveSuccess !== null && (
        <Alert 
          variant={saveSuccess ? "default" : "destructive"}
          className="duration-300 animate-in fade-in"
        >
          {saveSuccess ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {saveSuccess ? "Settings saved" : "Error saving settings"}
          </AlertTitle>
          <AlertDescription>
            {saveSuccess 
              ? "Your changes have been successfully saved." 
              : "There was a problem saving your changes. Please try again."}
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col gap-8">
          <div className="flex justify-center">
            <TabsList className="flex flex-wrap h-auto bg-card p-1 border border-white/5 rounded-full overflow-hidden">
              <TabsTrigger 
                value="general" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Alerts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="localization" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Regional</span>
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Database className="h-3.5 w-3.5" />
                <span>API</span>
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Email</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tax" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Tax</span>
              </TabsTrigger>
              <TabsTrigger 
                value="payment" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Payment</span>
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="flex items-center gap-2 px-4 py-2 h-9 data-[state=active]:bg-brand-cyan data-[state=active]:text-black rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Services</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1">
            <TabsContent value="general" className="mt-0">
              <GeneralSettings />
            </TabsContent>
            
            <TabsContent value="security" className="mt-0">
              <SecuritySettings />
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              <NotificationSettings />
            </TabsContent>
            
            <TabsContent value="localization" className="mt-0">
              <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Localization Settings</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest opacity-50">
                    Configure regional settings and localization preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <Label htmlFor="default-language" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default Language</Label>
                    <Select 
                      value={localizationSettings.defaultLanguage}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, defaultLanguage: val})}
                    >
                      <SelectTrigger id="default-language" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="timezone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timezone</Label>
                    <Select 
                      value={localizationSettings.timezone}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, timezone: val})}
                    >
                      <SelectTrigger id="timezone" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africa-nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="europe-london">Europe/London (UTC+0/+1)</SelectItem>
                        <SelectItem value="america-new_york">America/New_York (UTC-5/-4)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="date-format" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date Format</Label>
                    <Select 
                      value={localizationSettings.dateFormat}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, dateFormat: val})}
                    >
                      <SelectTrigger id="date-format" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                        <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="currency" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default Currency</Label>
                    <Select 
                      value={localizationSettings.currency}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, currency: val})}
                    >
                      <SelectTrigger id="currency" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kes">Kenyan Shilling (KES)</SelectItem>
                        <SelectItem value="usd">US Dollar (USD)</SelectItem>
                        <SelectItem value="eur">Euro (EUR)</SelectItem>
                        <SelectItem value="gbp">British Pound (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Enabled Languages</Label>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        Select which languages are available to users
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="en" 
                        checked={localizationSettings.enabledLanguages.en} 
                        onCheckedChange={(c) => setLocalizationSettings({...localizationSettings, enabledLanguages: {...localizationSettings.enabledLanguages, en: !!c}})} 
                        className="rounded-full"
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="en" className="text-[10px] font-bold uppercase tracking-widest">English</Label>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Primary language</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="sw" 
                        checked={localizationSettings.enabledLanguages.sw} 
                        onCheckedChange={(c) => setLocalizationSettings({...localizationSettings, enabledLanguages: {...localizationSettings.enabledLanguages, sw: !!c}})} 
                        className="rounded-full"
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="sw" className="text-[10px] font-bold uppercase tracking-widest">Swahili</Label>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Regional language</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="fr" 
                        checked={localizationSettings.enabledLanguages.fr} 
                        onCheckedChange={(c) => setLocalizationSettings({...localizationSettings, enabledLanguages: {...localizationSettings.enabledLanguages, fr: !!c}})} 
                        className="rounded-full"
                      />
                      <div className="grid gap-1">
                        <Label htmlFor="fr" className="text-[10px] font-bold uppercase tracking-widest">French</Label>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Additional language</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-white/5 px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('localization', localizationSettings)} disabled={isSaving} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-0">
              <ApiSettings />
            </TabsContent>
            
            <TabsContent value="email" className="mt-0">
              <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Email Settings</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest opacity-50">
                    Configure email delivery settings and templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smtp-provider" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Provider</Label>
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                    </div>
                    <Select 
                      value={emailSettings.provider}
                      onValueChange={(val) => setEmailSettings({...emailSettings, provider: val})}
                    >
                      <SelectTrigger id="smtp-provider" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">Amazon SES</SelectItem>
                        <SelectItem value="smtp">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="from-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default "From" Email</Label>
                    <Input 
                      id="from-email" 
                      placeholder="NOREPLY@AKUBRECAHENTERTAINMENT.COM" 
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                      className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="reply-to-email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reply-To Email</Label>
                    <Input 
                      id="reply-to-email" 
                      placeholder="SUPPORT@AKUBRECAHENTERTAINMENT.COM" 
                      value={emailSettings.replyToEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, replyToEmail: e.target.value})}
                      className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                    />
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Templates</Label>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        Manage email templates for various notifications
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-black/5 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Welcome Email</span>
                      <Button variant="outline" size="sm" className="rounded-full h-7 text-[8px] uppercase tracking-widest px-4">Edit</Button>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-black/5 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Password Reset</span>
                      <Button variant="outline" size="sm" className="rounded-full h-7 text-[8px] uppercase tracking-widest px-4">Edit</Button>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-black/5 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Return Confirmation</span>
                      <Button variant="outline" size="sm" className="rounded-full h-7 text-[8px] uppercase tracking-widest px-4">Edit</Button>
                    </div>
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="email-test" 
                      checked={emailSettings.testOnSave}
                      onCheckedChange={(c) => setEmailSettings({...emailSettings, testOnSave: c})}
                    />
                    <Label htmlFor="email-test" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Send test email on save</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-white/5 px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('email', emailSettings)} disabled={isSaving} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="tax" className="mt-0">
              <Card className="rounded-2xl border-white/5 shadow-sm overflow-hidden">
                <CardHeader className="border-b border-white/5 pb-6">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Tax Settings</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest opacity-50">
                    Configure tax-related settings and rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <Label htmlFor="tax-year" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Tax Year</Label>
                    <Select 
                      value={taxSettings.taxYear}
                      onValueChange={(val) => setTaxSettings({...taxSettings, taxYear: val})}
                    >
                      <SelectTrigger id="tax-year" className="rounded-full border-white/10 bg-black/5 precision-outline">
                        <SelectValue placeholder="Select tax year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                        <SelectItem value="2022">2022</SelectItem>
                        <SelectItem value="2021">2021</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="vat-rate" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Default VAT Rate (%)</Label>
                    <Input 
                      id="vat-rate" 
                      type="number" 
                      value={taxSettings.vatRate}
                      onChange={(e) => setTaxSettings({...taxSettings, vatRate: e.target.value})}
                      className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                    />
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filing Deadlines</Label>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        Set default deadlines for different tax returns
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="individual-deadline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Individual Returns</Label>
                      <Input 
                        id="individual-deadline" 
                        type="date" 
                        value={taxSettings.individualDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, individualDeadline: e.target.value})}
                        className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest px-4"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="corporate-deadline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Corporate Returns</Label>
                      <Input 
                        id="corporate-deadline" 
                        type="date" 
                        value={taxSettings.corporateDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, corporateDeadline: e.target.value})}
                        className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest px-4"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly-deadline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly Remittances</Label>
                      <Input 
                        id="monthly-deadline" 
                        type="number" 
                        value={taxSettings.monthlyDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, monthlyDeadline: e.target.value})}
                        placeholder="Day of month"
                        className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="extension-days" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Extension Period (days)</Label>
                      <Input 
                        id="extension-days" 
                        type="number" 
                        value={taxSettings.extensionDays}
                        onChange={(e) => setTaxSettings({...taxSettings, extensionDays: e.target.value})}
                        className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                      />
                    </div>
                  </div>
                  
                  <Separator className="bg-white/5" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax Authority Connection</Label>
                      <p className="text-[10px] uppercase tracking-widest opacity-50">
                        Configure connection to KRA API
                      </p>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="kra-api-key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">KRA API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="kra-api-key" 
                        type="password" 
                        defaultValue="●●●●●●●●●●●●●●●●●●●●"
                        className="rounded-full border-white/10 bg-black/5 precision-outline h-9 text-[10px] uppercase tracking-widest"
                      />
                      <Button variant="outline" className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">Show</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="test-mode" 
                        checked={taxSettings.testMode}
                        onCheckedChange={(c) => setTaxSettings({...taxSettings, testMode: c})}
                      />
                      <Label htmlFor="test-mode" className="text-[10px] font-bold uppercase tracking-widest opacity-70">Use Sandbox Environment</Label>
                    </div>
                    <p className="text-[8px] uppercase tracking-widest opacity-40 ml-12">
                      Submissions will be sent to the KRA test environment
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-white/5 px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('tax', taxSettings)} disabled={isSaving} className="rounded-full h-9 text-[10px] uppercase tracking-widest px-6">
                    <Save className="mr-2 h-3.5 w-3.5" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="payment" className="mt-0">
              <PaymentSettings />
            </TabsContent>
            
            <TabsContent value="services" className="mt-0">
              <ServiceSettings />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
