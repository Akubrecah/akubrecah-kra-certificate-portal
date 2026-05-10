// @ts-nocheck
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, ArrowDown, AlertCircle, Eye, EyeOff, LogIn, FileText, FileDown, ShieldCheck, Key, ArrowRight, Zap, Sparkles, Clock, User } from 'lucide-react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { FilingStatus } from "../lib/types"
import { CertificatePortal } from "./CertificatePortal"

interface Step4Props {
    pin: string
    password: string
    error: string | null
    filingStatus: FilingStatus
    sessionStartTime: Date | null
    formData: any
    onPasswordChange: (value: string) => void
    onDownloadReceipt: (receiptType: string) => void
    onEndSession: () => void
    onError?: (error: string) => void
    setFilingStatus: (status: FilingStatus) => void
}

const sessionService = new SessionManagementService()

export function Step4Filing({
    pin,
    password,
    error,
    filingStatus,
    sessionStartTime,
    formData,
    onPasswordChange,
    onDownloadReceipt,
    onEndSession,
    onError,
    setFilingStatus
}: Step4Props) {
    const [currentStep, setCurrentStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [localError, setLocalError] = useState<string | null>(null)
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null)
    const [hasPaidExtra, setHasPaidExtra] = useState(false)

    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Viewed filing page',
                        metadata: {
                            step: 4,
                            pin: pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded step 4 view in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 4 view:', error));

                // Update session step
                supabase
                    .from('sessions')
                    .update({
                        current_step: 4,
                        last_activity: new Date().toISOString()
                    })
                    .eq('id', currentSessionId)
                    .then(() => console.log('[DB] Updated session to step 4'))
                    .catch(error => console.error('[DB ERROR] Failed to update session step:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 4 record:', dbError);
            }
        }
    }, [pin]);

    useEffect(() => {
        let timer: NodeJS.Timeout

        if (filingStatus.filing && !filingStatus.completed) {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1)
            }, 1000)
        }

        return () => {
            if (timer) clearInterval(timer)
        }
    }, [filingStatus.filing, filingStatus.completed])

    const handleFileReturns = useCallback(async (retryWithPayment = false) => {
        setLoading(true);
        setLocalError(null);

        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                await supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Filing initiated',
                        metadata: { pin: pin, start_time: new Date().toISOString() }
                    }]);
            } catch (error) {
                console.error('[DB ERROR] Failed to record filing initiation:', error);
            }
        }

        try {
            const isIndividual = pin.startsWith('A');
            const apiEndpoint = isIndividual ? '/api/individual' : '/api/company';

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kra_pin: pin,
                    kra_password: password,
                    name: formData?.manufacturerName || '',
                    email: formData?.email || '',
                    session_id: currentSessionId || '',
                    return_id: sessionService.getData('currentReturnId') || '',
                    company_name: formData?.manufacturerName || '',
                    hasPaidExtra: retryWithPayment || hasPaidExtra
                }),
            });

            const data = await response.json();
            console.log('[FILING] API response:', data);

            if (data.requiresPayment) {
                console.log('[FILING] Payment/Employment income detected:', data.reason);

                if (typeof window !== 'undefined') {
                    const paymentData = {
                        requiresPayment: true,
                        reason: data.reason || 'employment_income',
                        periodFrom: data.periodFrom,
                        periodTo: data.periodTo,
                        pendingYears: data.pendingYears,
                        extraCharge: data.extraCharge,
                        refundAmount: data.refundAmount || 30,
                        message: data.message
                    }
                    console.log('[FILING] Storing in sessionStorage:', paymentData)
                    window.sessionStorage.setItem('employmentIncomeInfo', JSON.stringify(paymentData))
                }
                setLoading(false);
                return;
            }

            if (data.success) {
                console.log('[FILING] Filing successful:', data);
                if (data.receipt_number) setReceiptNumber(data.receipt_number);

                setFilingStatus({
                    loggedIn: true,
                    filing: true,
                    extracting: false,
                    completed: false
                });
            } else {
                let errorMessage = data.error || data.message || (data.status && data.status !== 'Valid' ? `Status: ${data.status}` : 'Unable to complete filing process');
                setLocalError(errorMessage);
                if (onError) onError(errorMessage);

                if (currentSessionId) {
                    await supabase.from('session_activities').insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Filing failed',
                        metadata: { pin: pin, error: errorMessage, raw_error: data.error }
                    }]);
                }
            }
        } catch (error) {
            const errorMessage = 'An error occurred while filing returns: ' + error.message;
            setLocalError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [pin, password, formData, hasPaidExtra, onError, setFilingStatus]);

    useEffect(() => {
        const handleRetry = () => {
            console.log('Retrying filing with payment flag...');
            setHasPaidExtra(true);
            handleFileReturns(true);
        };

        window.addEventListener('retryFilingWithPayment', handleRetry);
        return () => window.removeEventListener('retryFilingWithPayment', handleRetry);
    }, [handleFileReturns]);

    useEffect(() => {
        if (filingStatus.loggedIn && !filingStatus.completed) {
            const steps = [0, 1, 2, 3]
            let currentIndex = 0

            const currentSessionId = sessionService.getData('currentSessionId');

            const interval = setInterval(() => {
                if (currentIndex < steps.length) {
                    setCurrentStep(steps[currentIndex])

                    if (currentSessionId) {
                        try {
                            let stepDescription = '';
                            switch (currentIndex) {
                                case 0: stepDescription = 'Logging in to KRA'; break;
                                case 1: stepDescription = 'Filing tax return'; break;
                                case 2: stepDescription = 'Extracting receipt'; break;
                                case 3:
                                    stepDescription = 'Filing completed';
                                    setFilingStatus(prev => ({ ...prev, completed: true }));
                                    break;
                            }

                            supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'form_submit',
                                    description: stepDescription,
                                    metadata: { step: 4, filing_step: currentIndex, pin: pin }
                                }])
                                .then(() => console.log(`[DB] Recorded filing step ${currentIndex}`))
                                .catch(error => console.error(`[DB ERROR] Failed to record step ${currentIndex}:`, error));
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording filing step:', dbError);
                        }
                    }
                    currentIndex++
                } else {
                    clearInterval(interval)
                }
            }, 1500)

            return () => clearInterval(interval)
        }
    }, [filingStatus.loggedIn, filingStatus.completed, pin, setFilingStatus]);

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onPasswordChange(e.target.value)
    }

    const handleDownloadReceipt = (type: string) => {
        onDownloadReceipt(type);
    };

    if (filingStatus.completed) {
        return (
            <CertificatePortal 
                pin={pin}
                name={formData?.manufacturerName || "Taxpayer"}
                receiptNumber={receiptNumber}
                onDownload={handleDownloadReceipt}
                onEndSession={onEndSession}
            />
        )
    }

    if (filingStatus.loggedIn) {
        const visualizationSteps = [
            { label: 'Portal Authentication', icon: <LogIn className="w-5 h-5" /> },
            { label: 'Return Synchronization', icon: <FileText className="w-5 h-5" /> },
            { label: 'Receipt Generation', icon: <FileDown className="w-5 h-5" /> },
            { label: 'Audit Verification', icon: <CheckCircle className="w-5 h-5" /> }
        ]
        return (
            <div className="space-y-8 animate-fadeIn pb-12">
                <div className="glass p-10 rounded-[3rem] border border-border shadow-3xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B75]/5 to-transparent pointer-events-none" />
                    
                    <div className="relative space-y-10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-[#2E8B75]/10 border border-[#2E8B75]/20">
                                    <Zap className="w-7 h-7 text-[#2E8B75]" />
                                </div>
                                Filing Engine Active
                            </h3>
                            <div className="flex items-center gap-3 bg-muted/30 px-6 py-3 rounded-2xl border border-border">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                                <span className="text-lg font-mono font-black text-foreground">{elapsedTime}s</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {visualizationSteps.map((s, index) => {
                                const isActive = index === currentStep;
                                const isCompleted = index < currentStep;
                                return (
                                    <div 
                                        key={index} 
                                        className={cn(
                                            "flex items-center gap-5 p-6 rounded-[2rem] border transition-all duration-700",
                                            isActive ? "bg-[#2E8B75]/10 border-[#2E8B75]/30 shadow-2xl shadow-[#2E8B75]/5 scale-[1.02]" : 
                                            isCompleted ? "bg-[#2E8B75]/5 border-[#2E8B75]/20 text-[#2E8B75]" : 
                                            "bg-muted/30 border-border text-muted-foreground opacity-90"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                            isActive ? "bg-[#B91C1C] text-white shadow-2xl shadow-[#B91C1C]/20 animate-pulse" : 
                                            isCompleted ? "bg-[#2E8B75] text-white" : 
                                            "bg-muted text-muted-foreground"
                                        )}>
                                            {isCompleted ? <CheckCircle className="w-7 h-7" /> : s.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90 mb-1">Process 0{index + 1}</p>
                                            <p className="text-base font-black truncate">{s.label}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="space-y-6">
                            <div className="h-5 bg-muted/30 rounded-full overflow-hidden border border-border backdrop-blur-md p-1">
                                <motion.div 
                                    className="h-full bg-gradient-to-r from-[#2E8B75] via-[#2E8B75]/80 to-[#B91C1C] rounded-full relative"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${Math.min(100, (currentStep + 1) * 25)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:32px_32px] animate-shimmer opacity-20" />
                                </motion.div>
                            </div>
                            
                            <div className="flex items-center justify-center gap-4 p-6 bg-background/40 backdrop-blur-md rounded-[1.5rem] border border-border">
                                {currentStep < 3 ? <Loader2 className="w-5 h-5 animate-spin text-[#2E8B75]" /> : <Sparkles className="w-5 h-5 text-[#2E8B75]" />}
                                <p className="text-sm font-black text-muted-foreground uppercase tracking-tight">
                                    {currentStep === 0 && "Establishing secure handshake with KRA iTax Portal..."}
                                    {currentStep === 1 && "Injecting return data into official KRA tax ledger..."}
                                    {currentStep === 2 && "Synchronizing records and preparing acknowledgment..."}
                                    {currentStep === 3 && "Process complete. Generating secure download link..."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-16">
            <div className="glass p-10 rounded-[3rem] border border-border shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <ShieldCheck className="w-32 h-32 text-[#2E8B75]" />
                </div>
                
                <div className="relative space-y-10">
                    <div>
                        <h3 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-[#2E8B75]/10 border border-[#2E8B75]/20">
                                <Key className="w-7 h-7 text-[#2E8B75]" />
                            </div>
                            Filing Credentials
                        </h3>
                        <p className="text-base text-muted-foreground font-medium mt-3 opacity-80">Enter your iTax Portal password to authorize the KRA Nil Return synchronization.</p>
                    </div>

                    <AnimatePresence>
                        {(error || localError) && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#B91C1C]/5 border border-[#B91C1C]/20 p-6 rounded-[2rem] flex items-start gap-5 shadow-2xl shadow-[#B91C1C]/5"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-[#B91C1C]/10 flex items-center justify-center shrink-0 border border-[#B91C1C]/20">
                                    <AlertCircle className="h-6 w-6 text-[#B91C1C]" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-[#B91C1C] uppercase tracking-[0.2em]">Security Alert</p>
                                    <p className="text-sm font-black text-[#B91C1C] leading-relaxed uppercase tracking-tight">{error || localError}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="space-y-8">
                        <div className="grid gap-4">
                            <Label htmlFor="pin" className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                                <User className="w-5 h-5 text-[#2E8B75]" />
                                Taxpayer Identification
                            </Label>
                            <Input 
                                id="pin" 
                                value={pin} 
                                disabled 
                                className="h-20 rounded-[1.5rem] bg-muted/20 border-border text-xl font-mono font-black text-muted-foreground/60 px-8 cursor-not-allowed shadow-inner" 
                            />
                        </div>

                        <div className="grid gap-4">
                            <Label htmlFor="password" className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                                <Key className="w-5 h-5 text-[#2E8B75]" />
                                iTax Access Key
                            </Label>
                            <div className="relative group">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={handlePasswordChange} 
                                    placeholder="••••••••••••" 
                                    required 
                                    className="h-20 rounded-[1.5rem] border-border focus:border-[#2E8B75] focus:ring-[#2E8B75]/20 px-8 text-xl tracking-[0.3em] font-black transition-all bg-background/40 backdrop-blur-md text-foreground shadow-2xl"
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-2xl hover:bg-[#2E8B75]/10 text-muted-foreground hover:text-[#2E8B75] transition-all" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                </Button>
                            </div>
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-2 h-2 rounded-full bg-[#2E8B75] animate-pulse shadow-[0_0_8px_#2E8B75]" />
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-90">End-to-End Encryption Armed</p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button 
                                type="button" 
                                onClick={() => handleFileReturns(false)} 
                                disabled={loading || !password} 
                                className="w-full h-20 bg-[#B91C1C] hover:bg-[#B91C1C]/90 text-white font-black text-xl rounded-full shadow-2xl shadow-[#B91C1C]/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 border-0 group"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-7 h-7 animate-spin" />
                                        AUTHORIZING...
                                    </>
                                ) : (
                                    <>
                                        Authorize & Sync Returns
                                        <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-[#2E8B75]/5 border border-[#2E8B75]/10 flex items-start gap-5 shadow-2xl shadow-[#2E8B75]/5">
                <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shrink-0 shadow-2xl border border-[#2E8B75]/10 group">
                    <ShieldCheck className="w-7 h-7 text-[#2E8B75] group-hover:scale-110 transition-transform" />
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-black text-[#2E8B75] uppercase tracking-[0.2em]">Compliance Protocol</p>
                    <p className="text-xs text-[#2E8B75]/70 font-black leading-relaxed uppercase tracking-tight opacity-80">
                        By authorizing, you confirm zero income for the current tax cycle. Our secure agent will finalize your submission directly with the KRA iTax vault.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Step4Filing;
