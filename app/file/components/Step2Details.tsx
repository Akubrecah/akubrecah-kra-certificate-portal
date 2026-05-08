// @ts-nocheck
"use client"

import { useEffect } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Building2, MapPin, FileText, CheckCircle2, ShieldCheck, Phone, Globe, Sparkles, ArrowRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { Step2Props } from "../lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { FadeIn } from "@/components/core/fade-in"
import { ScaleIn } from "@/components/core/scale-in"
import { TextRoll } from "@/components/core/text-roll"

const sessionService = new SessionManagementService()

export function Step2Details({ loading, manufacturerDetails, residentType, setResidentType, selectedObligations, setSelectedObligations, onBack, onNext }: Step2Props) {
    // Record step view in database and check for existing data
    useEffect(() => {
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId && manufacturerDetails) {
            try {
                // Record the view in the database
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'form_submit',
                        description: 'Viewed manufacturer details',
                        metadata: {
                            pin: manufacturerDetails.pin,
                            name: manufacturerDetails.name,
                            step: 2
                        }
                    }])
                    .then(() => console.log('[DB] Recorded step 2 view in database'))
                    .catch(error => console.error('[DB ERROR] Failed to record step 2 view:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error preparing step 2 record:', dbError);
            }
        }
    }, [manufacturerDetails]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-brand-cyan/20 border-t-brand-cyan animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-brand-cyan animate-pulse" />
                        </div>
                    </div>
                    <p className="text-lg text-foreground font-bold tracking-tight">Decrypting taxpayer records...</p>
                    <p className="text-sm text-muted-foreground">Securely connecting to KRA iTax services</p>
                </div>
            </div>
        )
    }

    if (!manufacturerDetails) {
        return (
            <div className="text-center py-12 px-4">
                <ScaleIn>
                    <div className="glass p-10 rounded-[2.5rem] border-destructive/30 bg-destructive/10 max-w-md mx-auto shadow-2xl">
                        <div className="w-16 h-16 bg-destructive/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck className="w-8 h-8 text-destructive" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">Records Missing</h3>
                        <p className="text-muted-foreground text-sm mb-8 font-medium">We couldn't retrieve your details from the secure vault. Please verify your PIN and try again.</p>
                        <Button 
                            onClick={onBack} 
                            className="w-full h-12 bg-destructive hover:bg-destructive/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-destructive/20"
                        >
                            Return to Verification
                        </Button>
                    </div>
                </ScaleIn>
            </div>
        )
    }

    const isIndividual = manufacturerDetails.pin?.startsWith('A')
    const isCompany = manufacturerDetails.pin?.startsWith('P')

    return (
        <div className="space-y-12 animate-fadeIn pb-16">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <ScaleIn delay={0.1}>
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#2E8B75]/20 to-[#2E8B75]/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 border border-[#2E8B75]/20 shadow-2xl backdrop-blur-3xl group">
                            {isIndividual ? <User className="w-12 h-12 text-[#2E8B75] group-hover:scale-110 transition-transform" /> : <Building2 className="w-12 h-12 text-[#2E8B75] group-hover:scale-110 transition-transform" />}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-background rounded-full flex items-center justify-center shadow-2xl border border-border">
                            <CheckCircle2 className="w-6 h-6 text-[#2E8B75]" />
                        </div>
                    </div>
                </ScaleIn>
                <h2 className="text-4xl font-black text-foreground tracking-tight">
                    Identity Records Verified
                </h2>
                <p className="text-muted-foreground text-base font-medium max-w-lg mx-auto opacity-80 leading-relaxed">
                    Taxpayer profile decrypted successfully. Please validate the core identity data below before initiating compliance filing.
                </p>
            </div>

            {/* Main Info Card */}
            <div className="glass p-10 rounded-[3rem] border-border shadow-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#2E8B75]/5 rounded-full -mr-40 -mt-40 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B91C1C]/5 rounded-full -ml-40 -mb-40 blur-[120px] pointer-events-none" />
                
                {/* Type Badge */}
                <div className="absolute top-8 right-8">
                    <Badge className="bg-[#2E8B75]/10 backdrop-blur-xl border border-[#2E8B75]/20 text-[#2E8B75] px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl">
                        {isIndividual ? "Individual Taxpayer" : "Corporate Body"}
                    </Badge>
                </div>

                <div className="space-y-12 relative z-10">
                    {/* Basic Information */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-6">
                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-[#2E8B75]" />
                                Master Identity Profile
                            </h3>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-12 px-6 text-xs bg-background/50 border-border text-foreground hover:border-[#B91C1C] hover:text-[#B91C1C] transition-all duration-500 font-black rounded-full shadow-xl group"
                                onClick={async () => {
                                    const loadingToast = toast.loading("Generating PIN certificate...");
                                    try {
                                        const res = await fetch('/api/generate-certificate', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                pin: manufacturerDetails.pin,
                                                name: manufacturerDetails.name,
                                                idNumber: manufacturerDetails.idNumber || '',
                                                email: manufacturerDetails.contactDetails?.email || '',
                                                mobileNumber: manufacturerDetails.contactDetails?.mobile || '',
                                                building: manufacturerDetails.physicalAddress?.building || '',
                                                street: manufacturerDetails.physicalAddress?.street || '',
                                                city: manufacturerDetails.postalAddress?.town || '',
                                                county: manufacturerDetails.physicalAddress?.county || '',
                                                district: manufacturerDetails.physicalAddress?.district || '',
                                                taxArea: manufacturerDetails.physicalAddress?.taxArea || '',
                                                station: manufacturerDetails.physicalAddress?.station || '',
                                                poBox: manufacturerDetails.postalAddress?.poBox || '',
                                                postalCode: manufacturerDetails.postalAddress?.postalCode || ''
                                            })
                                        });
                                        if (!res.ok) throw new Error("Failed to generate certificate");
                                        const blob = await res.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `KRA_Certificate_${manufacturerDetails.pin}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        toast.success("Certificate downloaded!", { id: loadingToast });
                                    } catch (err) {
                                        toast.error("Error downloading certificate", { id: loadingToast });
                                    }
                                }}
                            >
                                <FileText className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                Extract PIN Certificate
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4 p-8 bg-[#2E8B75]/5 rounded-[2.5rem] border border-[#2E8B75]/10 group/item relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/item:opacity-10 transition-opacity">
                                    <Globe className="w-20 h-20 text-[#2E8B75]" />
                                </div>
                                <span className="text-[10px] font-black text-[#2E8B75] uppercase tracking-widest block mb-3">Primary KRA PIN</span>
                                <p className="text-2xl font-mono font-black text-foreground group-hover/item:translate-x-1 transition-transform tracking-wider">{manufacturerDetails.pin}</p>
                            </div>
                            <div className="md:col-span-8 p-8 bg-[#2E8B75]/5 rounded-[2.5rem] border border-[#2E8B75]/10 group/item">
                                <span className="text-[10px] font-black text-[#2E8B75] uppercase tracking-widest block mb-3">Taxpayer Legal Alias</span>
                                <p className="text-2xl font-black text-foreground uppercase leading-tight tracking-tight">{manufacturerDetails.name}</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Contact Information */}
                        <section className="space-y-6">
                            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                                <Phone className="w-5 h-5 text-[#2E8B75]" />
                                Secure Channels
                            </h3>
                            <div className="space-y-4">
                                <div className="p-6 bg-card/40 border border-border rounded-[2rem] flex items-center gap-5 hover:border-[#2E8B75]/20 hover:bg-[#2E8B75]/5 transition-all group/card">
                                    <div className="w-14 h-14 rounded-2xl bg-[#2E8B75]/10 flex items-center justify-center shrink-0 border border-[#2E8B75]/20 group-hover/card:scale-110 transition-transform">
                                        <Mail className="w-6 h-6 text-[#2E8B75]" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Electronic Mail</span>
                                        <p className="text-base font-black text-foreground truncate">
                                            {manufacturerDetails.contactDetails?.email || 'NOT_REGISTERED'}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-6 bg-card/40 border border-border rounded-[2rem] flex items-center gap-5 hover:border-[#2E8B75]/20 hover:bg-[#2E8B75]/5 transition-all group/card">
                                    <div className="w-14 h-14 rounded-2xl bg-[#2E8B75]/10 flex items-center justify-center shrink-0 border border-[#2E8B75]/20 group-hover/card:scale-110 transition-transform">
                                        <Phone className="w-6 h-6 text-[#2E8B75]" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Mobile Telephony</span>
                                        <p className="text-base font-black text-foreground truncate">
                                            {manufacturerDetails.contactDetails?.mobile || 'NOT_REGISTERED'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Address Information */}
                        <section className="space-y-6">
                            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 px-2">
                                <MapPin className="w-5 h-5 text-[#2E8B75]" />
                                Domicile Coordinates
                            </h3>
                            <div className="p-6 bg-card/40 border border-border rounded-[2.5rem] h-full space-y-6">
                                {manufacturerDetails.postalAddress ? (
                                    <div className="pb-6 border-b border-border">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Registered P.O. Box</span>
                                        <p className="text-base font-black text-foreground leading-relaxed">
                                            {`BOX ${manufacturerDetails.postalAddress.poBox || ''} - ${manufacturerDetails.postalAddress.postalCode || ''}, ${manufacturerDetails.postalAddress.town || 'KENYA'}`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="pb-6 border-b border-border">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Registered P.O. Box</span>
                                        <p className="text-sm text-muted-foreground italic font-black">NO POSTAL RECORDS FOUND</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-2">Physical Descriptor</span>
                                    <p className="text-base font-black text-foreground leading-relaxed uppercase">
                                        {manufacturerDetails.physicalAddress?.descriptive || 'NO PHYSICAL RECORDS RETRIEVED'}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Obligations - Conditional for Companies */}
                    {isCompany && manufacturerDetails.obligationsData && (
                        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#2E8B75]" />
                                Registered Tax Obligations
                            </h3>
                            <div className="bg-card/50 rounded-3xl border border-border overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="p-4 text-left font-black text-muted-foreground uppercase tracking-widest text-[9px]">Select</th>
                                                <th className="p-4 text-left font-black text-muted-foreground uppercase tracking-widest text-[9px]">Obligation Name</th>
                                                <th className="p-4 text-left font-black text-muted-foreground uppercase tracking-widest text-[9px]">Status</th>
                                                <th className="p-4 text-left font-black text-muted-foreground uppercase tracking-widest text-[9px]">Effective From</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {manufacturerDetails.obligationsData.obligations?.map((obligation) => (
                                                <tr key={obligation.id} className="hover:bg-brand-cyan/5 transition-colors group/row">
                                                    <td className="p-4">
                                                        <Checkbox
                                                            id={`obligation-${obligation.id}`}
                                                            checked={selectedObligations?.includes(obligation.id) || false}
                                                            onCheckedChange={(checked) => {
                                                                if (setSelectedObligations) {
                                                                    if (checked) {
                                                                        setSelectedObligations([...(selectedObligations || []), obligation.id]);
                                                                    } else {
                                                                        setSelectedObligations((selectedObligations || []).filter(id => id !== obligation.id));
                                                                    }
                                                                }
                                                            }}
                                                            className="w-5 h-5 border-border data-[state=checked]:bg-brand-cyan data-[state=checked]:border-brand-cyan rounded-md transition-all"
                                                        />
                                                    </td>
                                                    <td className="p-4 font-black text-foreground uppercase tracking-tight">{obligation.name}</td>
                                                    <td className="p-4">
                                                        <Badge className="bg-[#2E8B75]/10 text-[#2E8B75] border-[#2E8B75]/20 px-3 py-1 rounded-lg text-[10px] font-bold">
                                                            {obligation.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-[10px] text-muted-foreground font-black font-mono">
                                                        {obligation.effectiveFrom}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Resident Type Selection - Individuals */}
            {isIndividual && setResidentType && (
                <FadeIn delay={0.2} className="glass p-8 rounded-[2.5rem] border-brand-cyan/10 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Sparkles className="w-16 h-16 text-brand-cyan" />
                    </div>
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#2E8B75]/20 to-[#2E8B75]/10 rounded-2xl flex items-center justify-center shrink-0 border border-[#2E8B75]/20 shadow-xl">
                                <Globe className="w-7 h-7 text-[#2E8B75]" />
                            </div>
                            <div>
                                <Label htmlFor="residentType" className="text-xl font-black text-foreground tracking-tight block">
                                    Tax Residency Status
                                </Label>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Action Required</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <Select value={residentType || "1"} onValueChange={setResidentType}>
                                <SelectTrigger id="residentType" className="h-20 text-lg font-black rounded-[1.5rem] border-border focus:ring-[#2E8B75]/20 focus:border-[#2E8B75] bg-background/40 backdrop-blur-md transition-all px-8">
                                    <SelectValue placeholder="Identify residency" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-background/95 backdrop-blur-xl">
                                    <SelectItem value="1" className="py-4 px-4 rounded-xl focus:bg-[#2E8B75]/10 focus:text-[#2E8B75] font-black transition-colors">
                                        Income Tax - Resident Individual
                                    </SelectItem>
                                    <SelectItem value="2" className="py-4 px-4 rounded-xl focus:bg-[#2E8B75]/10 focus:text-[#2E8B75] font-black transition-colors">
                                        Income Tax - Non-Resident Individual
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-start gap-4 p-6 bg-[#2E8B75]/5 rounded-3xl border border-[#2E8B75]/10">
                                <ShieldCheck className="w-5 h-5 text-[#2E8B75] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#2E8B75]/80 font-black leading-relaxed">
                                    Your selection determines the applicable personal relief, tax brackets, and compliance requirements under the Finance Act.
                                </p>
                            </div>
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    )
}

export default Step2Details;
