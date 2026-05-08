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
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      
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
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-[200px] flex-shrink-0">
            <div className="sticky top-16 space-y-4">
              <TabsList className="flex flex-col h-auto bg-card w-full p-0 border rounded-md">
                <TabsTrigger 
                  value="general" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Settings className="h-4 w-4" />
                  <span>General</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Shield className="h-4 w-4" />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="localization" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Globe className="h-4 w-4" />
                  <span>Localization</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="api" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Database className="h-4 w-4" />
                  <span>API & Integrations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tax" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>Tax Settings</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="payment" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none border-b text-sm transition-all"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Payment</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="flex items-center justify-start gap-2 w-full px-3 py-2 h-10 data-[state=active]:bg-brand-cyan data-[state=active]:text-black data-[state=active]:shadow-none rounded-none text-sm transition-all"
                >
                  <Zap className="h-4 w-4" />
                  <span>Services</span>
                </TabsTrigger>
              </TabsList>
              
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Having trouble with settings? Contact our support team for assistance.
                  </p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Contact Support
                  </Button>
                </CardFooter>
              </Card>
            </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Localization Settings</CardTitle>
                  <CardDescription>
                    Configure regional settings and localization preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Select 
                      value={localizationSettings.defaultLanguage}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, defaultLanguage: val})}
                    >
                      <SelectTrigger id="default-language">
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
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={localizationSettings.timezone}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, timezone: val})}
                    >
                      <SelectTrigger id="timezone">
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
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select 
                      value={localizationSettings.dateFormat}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, dateFormat: val})}
                    >
                      <SelectTrigger id="date-format">
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
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select 
                      value={localizationSettings.currency}
                      onValueChange={(val) => setLocalizationSettings({...localizationSettings, currency: val})}
                    >
                      <SelectTrigger id="currency">
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
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enabled Languages</Label>
                      <p className="text-sm text-muted-foreground">
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
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="en">English</Label>
                        <p className="text-sm text-muted-foreground">Primary language</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="sw" 
                        checked={localizationSettings.enabledLanguages.sw} 
                        onCheckedChange={(c) => setLocalizationSettings({...localizationSettings, enabledLanguages: {...localizationSettings.enabledLanguages, sw: !!c}})} 
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="sw">Swahili</Label>
                        <p className="text-sm text-muted-foreground">Regional language</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="fr" 
                        checked={localizationSettings.enabledLanguages.fr} 
                        onCheckedChange={(c) => setLocalizationSettings({...localizationSettings, enabledLanguages: {...localizationSettings.enabledLanguages, fr: !!c}})} 
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="fr">French</Label>
                        <p className="text-sm text-muted-foreground">Additional language</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings}>Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('localization', localizationSettings)} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-0">
              <ApiSettings />
            </TabsContent>
            
            <TabsContent value="email" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Email Settings</CardTitle>
                  <CardDescription>
                    Configure email delivery settings and templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smtp-provider">Email Provider</Label>
                      <div>
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                    </div>
                    <Select 
                      value={emailSettings.provider}
                      onValueChange={(val) => setEmailSettings({...emailSettings, provider: val})}
                    >
                      <SelectTrigger id="smtp-provider">
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
                    <Label htmlFor="from-email">Default "From" Email</Label>
                    <Input 
                      id="from-email" 
                      placeholder="noreply@akubrecahentertainment.com" 
                      value={emailSettings.fromEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="reply-to-email">Reply-To Email</Label>
                    <Input 
                      id="reply-to-email" 
                      placeholder="support@akubrecahentertainment.com" 
                      value={emailSettings.replyToEmail}
                      onChange={(e) => setEmailSettings({...emailSettings, replyToEmail: e.target.value})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Templates</Label>
                      <p className="text-sm text-muted-foreground">
                        Manage email templates for various notifications
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Welcome Email</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-3 pt-0">
                        <Button variant="outline" size="sm">Edit Template</Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Password Reset</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-3 pt-0">
                        <Button variant="outline" size="sm">Edit Template</Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">Return Confirmation</CardTitle>
                      </CardHeader>
                      <CardFooter className="p-3 pt-0">
                        <Button variant="outline" size="sm">Edit Template</Button>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="email-test" 
                      checked={emailSettings.testOnSave}
                      onCheckedChange={(c) => setEmailSettings({...emailSettings, testOnSave: c})}
                    />
                    <Label htmlFor="email-test">Send test email on save</Label>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings}>Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('email', emailSettings)} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="tax" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Settings</CardTitle>
                  <CardDescription>
                    Configure tax-related settings and rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="tax-year">Current Tax Year</Label>
                    <Select 
                      value={taxSettings.taxYear}
                      onValueChange={(val) => setTaxSettings({...taxSettings, taxYear: val})}
                    >
                      <SelectTrigger id="tax-year">
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
                    <Label htmlFor="vat-rate">Default VAT Rate (%)</Label>
                    <Input 
                      id="vat-rate" 
                      type="number" 
                      value={taxSettings.vatRate}
                      onChange={(e) => setTaxSettings({...taxSettings, vatRate: e.target.value})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Filing Deadlines</Label>
                      <p className="text-sm text-muted-foreground">
                        Set default deadlines for different tax returns
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="individual-deadline">Individual Returns</Label>
                      <Input 
                        id="individual-deadline" 
                        type="date" 
                        value={taxSettings.individualDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, individualDeadline: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="corporate-deadline">Corporate Returns</Label>
                      <Input 
                        id="corporate-deadline" 
                        type="date" 
                        value={taxSettings.corporateDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, corporateDeadline: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="monthly-deadline">Monthly Remittances</Label>
                      <Input 
                        id="monthly-deadline" 
                        type="number" 
                        value={taxSettings.monthlyDeadline}
                        onChange={(e) => setTaxSettings({...taxSettings, monthlyDeadline: e.target.value})}
                        placeholder="Day of month"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="extension-days">Extension Period (days)</Label>
                      <Input 
                        id="extension-days" 
                        type="number" 
                        value={taxSettings.extensionDays}
                        onChange={(e) => setTaxSettings({...taxSettings, extensionDays: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Tax Authority Connection</Label>
                      <p className="text-sm text-muted-foreground">
                        Configure connection to KRA API
                      </p>
                    </div>
                    <div>
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="kra-api-key">KRA API Key</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="kra-api-key" 
                        type="password" 
                        defaultValue="●●●●●●●●●●●●●●●●●●●●"
                      />
                      <Button variant="outline">Show</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="test-mode" 
                        checked={taxSettings.testMode}
                        onCheckedChange={(c) => setTaxSettings({...taxSettings, testMode: c})}
                      />
                      <Label htmlFor="test-mode">Use Sandbox Environment</Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-7">
                      Submissions will be sent to the KRA test environment
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <Button variant="outline" onClick={fetchSettings}>Discard</Button>
                  <Button onClick={() => handleSaveInlineSettings('tax', taxSettings)} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
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
