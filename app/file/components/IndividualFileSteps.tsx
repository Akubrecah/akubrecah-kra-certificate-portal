// @ts-nocheck
'use client'

import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    User, 
    Lock, 
    Mail, 
    Phone, 
    ShieldCheck, 
    ArrowRight, 
    Fingerprint,
    MapPin,
    CreditCard,
    Smartphone,
    Eye,
    EyeOff
} from "lucide-react"
import { FadeIn } from "@/components/core/fade-in"
import { ScaleIn } from "@/components/core/scale-in"
import { TextRoll } from "@/components/core/text-roll"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Step1IDProps {
    idNumber: string
    setIdNumber: (value: string) => void
    onNext: () => void
    loading: boolean
    error: string | null
}

export function Step1ID({ idNumber, setIdNumber, onNext, loading, error }: Step1IDProps) {
    return (
        <FadeIn>
            <div className="glass p-10 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group max-w-2xl mx-auto">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Fingerprint className="w-24 h-24 text-brand-cyan" />
                </div>
                
                <div className="relative space-y-8 text-center">
                    <ScaleIn delay={0.2}>
                        <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 mx-auto shadow-inner">
                            <User className="w-10 h-10 text-brand-cyan" />
                        </div>
                    </ScaleIn>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-foreground tracking-tight">
                            <TextRoll>Individual Returns</TextRoll>
                        </h2>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Identity Verification</p>
                    </div>

                    <div className="space-y-6 text-left">
                        <div className="space-y-3">
                            <Label htmlFor="idNumber" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                National ID Number
                            </Label>
                            <div className="relative group/input">
                                <Input
                                    id="idNumber"
                                    type="text"
                                    placeholder="Enter your 8-digit ID"
                                    value={idNumber}
                                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                                    maxLength={8}
                                    className="h-16 rounded-2xl border-border bg-background/50 backdrop-blur-sm text-xl font-black tracking-widest focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all pl-6"
                                    disabled={loading}
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <CreditCard className="w-5 h-5 text-muted-foreground/50 group-focus-within/input:text-brand-cyan transition-colors" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium px-1 leading-relaxed">
                                Enter the 8-digit number found on your national identification card.
                            </p>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-destructive/10 border border-destructive/30 p-4 rounded-2xl flex items-start gap-3"
                                >
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-destructive">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Button
                            onClick={onNext}
                            disabled={idNumber.length !== 8 || loading}
                            className="w-full h-16 bg-gradient-to-r from-brand-cyan to-brand-cyan-dark hover:from-brand-cyan hover:to-brand-cyan-dark text-black font-black text-lg rounded-2xl shadow-xl shadow-brand-cyan/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Retrieving Profile...
                                </>
                            ) : (
                                <>
                                    Secure Continue
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </FadeIn>
    )
}

interface ManufacturerDetails {
    basic: {
        fullName: string
        firstName: string
        middleName: string
        lastName: string
        manufacturerName: string
        registrationNumber: string
        idNumber: string
        idType: string
        pin: string
    }
    business: {
        businessName: string
        registrationDate: string
        commencementDate: string
        businessType: string
        tradingName: string
    }
    contact: {
        mainEmail: string
        secondaryEmail: string
        mobileNumber: string
        telephoneNumber: string
        faxNumber: string
    }
    address: {
        descriptive: string
        buildingNumber: string
        streetRoad: string
        cityTown: string
        county: string
        district: string
        town: string
        lrNumber: string
        postalCode: string
        poBox: string
        taxArea: string
        jurisdictionStationId: string
        locationId: string
    }
}

interface Step2VerifyProps {
    pin: string
    name: string
    email: string
    mobileNumber: string
    manufacturerDetails: ManufacturerDetails
    onBack: () => void
    onNext: () => void
}

export function Step2Verify({ pin, name, email, mobileNumber, manufacturerDetails, onBack, onNext }: Step2VerifyProps) {
    return (
        <FadeIn>
            <div className="glass p-10 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group max-w-2xl mx-auto">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <ShieldCheck className="w-24 h-24 text-brand-cyan" />
                </div>
                
                <div className="relative space-y-8">
                    <div className="text-center space-y-4">
                        <ScaleIn delay={0.2}>
                            <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center border border-green-100 mx-auto shadow-inner">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                        </ScaleIn>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-foreground tracking-tight">
                                <TextRoll>Verify Profile</TextRoll>
                            </h2>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Confirm your details</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {/* Profile Card */}
                        <div className="p-8 rounded-[2rem] bg-secondary/50 border border-border space-y-6">
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                        <User className="h-5 w-5 text-brand-cyan" />
                                    </div>
                                    <h3 className="font-black text-foreground uppercase text-xs tracking-widest">Personal Info</h3>
                                </div>
                                <Badge className="bg-brand-cyan text-black border-none text-[9px] font-black tracking-widest uppercase">
                                    Verified
                                </Badge>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Full Name</span>
                                    <span className="text-sm font-black text-foreground uppercase">
                                        {manufacturerDetails?.basic?.fullName || name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">KRA PIN</span>
                                    <span className="text-sm font-black text-foreground font-mono">{pin}</span>
                                </div>
                                {manufacturerDetails?.basic?.idNumber && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID Number</span>
                                        <span className="text-sm font-black text-foreground">{manufacturerDetails.basic.idNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="p-8 rounded-[2rem] bg-secondary/50 border border-border space-y-6">
                            <div className="flex items-center gap-3 border-b border-border pb-4">
                                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                                    <Smartphone className="h-5 w-5 text-brand-cyan" />
                                </div>
                                <h3 className="font-black text-foreground uppercase text-xs tracking-widest">Secure Contact</h3>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Primary Email</p>
                                        <p className="text-xs font-bold text-foreground lowercase truncate">
                                            {manufacturerDetails?.contact?.mainEmail || email || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Mobile Contact</p>
                                        <p className="text-xs font-bold text-foreground">
                                            {manufacturerDetails?.contact?.mobileNumber || mobileNumber || "Not provided"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Badge */}
                        {(manufacturerDetails?.address?.descriptive || manufacturerDetails?.address?.county) && (
                            <div className="p-5 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-sm shrink-0">
                                    <MapPin className="h-5 w-5 text-brand-cyan" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black text-brand-cyan uppercase tracking-widest">Primary Station</p>
                                    <p className="text-xs font-black text-foreground uppercase truncate">
                                        {manufacturerDetails.address.descriptive || manufacturerDetails.address.county}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            onClick={onBack}
                            variant="outline"
                            className="flex-1 h-16 rounded-2xl border-border font-black uppercase text-xs tracking-widest hover:bg-secondary transition-all"
                        >
                            Correction
                        </Button>
                        <Button
                            onClick={onNext}
                            className="flex-[2] h-16 bg-gradient-to-r from-brand-cyan to-brand-cyan-dark hover:from-brand-cyan hover:to-brand-cyan-dark text-black font-black text-lg rounded-2xl shadow-xl shadow-brand-cyan/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                        >
                            Confirm Details
                            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </FadeIn>
    )
}

interface Step3PasswordProps {
    password: string
    setPassword: (value: string) => void
    newPassword: string
    setNewPassword: (value: string) => void
    confirmPassword: string
    setConfirmPassword: (value: string) => void
    showPassword: boolean
    setShowPassword: (value: boolean) => void
    residentType: string
    setResidentType: (value: string) => void
    onBack: () => void
    onValidate: () => void
    loading: boolean
    error: string | null
    requiresReset: boolean
}

export function Step3Password({
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    residentType,
    setResidentType,
    onBack,
    onValidate,
    loading,
    error,
    requiresReset
}: Step3PasswordProps) {
    return (
        <FadeIn>
            <div className="glass p-10 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group max-w-2xl mx-auto">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Lock className="w-24 h-24 text-brand-cyan" />
                </div>
                
                <div className="relative space-y-8">
                    <div className="text-center space-y-4">
                        <ScaleIn delay={0.2}>
                            <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 mx-auto shadow-inner">
                                <Lock className="w-10 h-10 text-brand-cyan" />
                            </div>
                        </ScaleIn>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-foreground tracking-tight">
                                <TextRoll>
                                    {requiresReset ? "Security Reset" : "iTax Access"}
                                </TextRoll>
                            </h2>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                {requiresReset ? "Update Expired Credentials" : "Enter Portal Credentials"}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Current Password */}
                        <div className="space-y-3">
                            <Label htmlFor="password" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                {requiresReset ? "Expired Password" : "KRA iTax Password"}
                            </Label>
                            <div className="relative group/input">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-16 rounded-2xl border-border bg-background/50 backdrop-blur-sm text-xl font-black tracking-widest focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all pl-6"
                                    disabled={loading}
                                />
                                <button
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-brand-cyan transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {requiresReset && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-6 pt-2 border-t border-border mt-6"
                            >
                                <div className="space-y-3">
                                    <Label htmlFor="newPassword" className="text-[10px] font-black text-destructive uppercase tracking-widest ml-1">
                                        New iTax Password
                                    </Label>
                                    <Input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min 8 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="h-16 rounded-2xl border-destructive/30 bg-destructive/5 backdrop-blur-sm text-xl font-black tracking-widest focus:ring-red-100 focus:border-red-500 transition-all pl-6"
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="confirmPassword" className="text-[10px] font-black text-destructive uppercase tracking-widest ml-1">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="h-16 rounded-2xl border-destructive/30 bg-destructive/5 backdrop-blur-sm text-xl font-black tracking-widest focus:ring-red-100 focus:border-red-500 transition-all pl-6"
                                        disabled={loading}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Resident Type Selector */}
                        <div className="space-y-3">
                            <Label htmlFor="residentType" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                Residency Status
                            </Label>
                            <Select value={residentType} onValueChange={setResidentType}>
                                <SelectTrigger id="residentType" className="h-16 rounded-2xl border-border bg-background/50 backdrop-blur-sm text-sm font-black uppercase tracking-wider focus:ring-brand-cyan/20 focus:border-brand-cyan transition-all pl-6">
                                    <SelectValue placeholder="Select obligation type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-2xl">
                                    <SelectItem value="1" className="py-4 px-6 rounded-xl focus:bg-brand-cyan/5 focus:text-brand-cyan font-black text-xs uppercase tracking-widest">
                                        Resident Individual
                                    </SelectItem>
                                    <SelectItem value="2" className="py-4 px-6 rounded-xl focus:bg-brand-cyan/5 focus:text-brand-cyan font-black text-xs uppercase tracking-widest">
                                        Non-Resident Individual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-destructive/10 border border-destructive/30 p-5 rounded-3xl flex items-start gap-4 shadow-sm"
                                >
                                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-destructive leading-relaxed">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-4 pt-4">
                            <Button
                                onClick={onBack}
                                variant="outline"
                                className="flex-1 h-16 rounded-2xl border-border font-black uppercase text-xs tracking-widest hover:bg-secondary transition-all"
                                disabled={loading}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={onValidate}
                                disabled={
                                    loading ||
                                    !password ||
                                    (requiresReset && (!newPassword || newPassword !== confirmPassword))
                                }
                                className="flex-[2] h-16 bg-gradient-to-r from-brand-cyan to-brand-cyan-dark hover:from-brand-cyan hover:to-brand-cyan-dark text-black font-black text-lg rounded-2xl shadow-xl shadow-brand-cyan/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        {requiresReset ? "Update & File" : "Begin Filing"}
                                        <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </FadeIn>
    )
}
