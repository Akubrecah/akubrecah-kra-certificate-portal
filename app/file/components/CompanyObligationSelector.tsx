'use client'

import React, { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, FileText, Trash2, Building2, ShieldCheck, Sparkles, ArrowRight, Zap } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Obligation {
    id: string
    name: string
    status: string
    effectiveFrom: string
    effectiveTo: string
}

export type ActionMode = 'file' | 'terminate'

const TERMINATION_REASONS = [
    'Business Closed',
    'Business Dormant',
    'Merged with Another Entity',
    'Obligation Not Applicable',
    'Duplicate Registration',
    'Other',
]

interface CompanyObligationSelectorProps {
    pin: string
    onObligationsSelected: (selectedIds: string[]) => void
    selectedObligations: string[]
    actionMode?: ActionMode
    onActionModeChange?: (mode: ActionMode) => void
    terminationReason?: string
    onTerminationReasonChange?: (reason: string) => void
}

export default function CompanyObligationSelector({
    pin,
    onObligationsSelected,
    selectedObligations,
    actionMode = 'file',
    onActionModeChange,
    terminationReason = '',
    onTerminationReasonChange,
}: CompanyObligationSelectorProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [obligations, setObligations] = useState<Obligation[]>([])
    const [taxpayerName, setTaxpayerName] = useState<string>('')
    const [pinStatus, setPinStatus] = useState<string>('')
    const [obligationsChecked, setObligationsChecked] = useState(false)

    const fetchObligations = async () => {
        if (!pin || !pin.toUpperCase().startsWith('P')) {
            setError('This feature is only available for company PINs (starting with P)')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/company/check-obligations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pin }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch obligations')
            }

            if (data.success) {
                setObligations(data.obligations || [])
                setTaxpayerName(data.taxpayerName || '')
                setPinStatus(data.pinStatus || '')
                setObligationsChecked(true)

                // Auto-select all active obligations by default
                if (data.obligations && data.obligations.length > 0) {
                    const allIds = data.obligations.map((obl: Obligation) => obl.id)
                    onObligationsSelected(allIds)
                }
            }
        } catch (err: any) {
            console.error('Error fetching obligations:', err)
            setError(err.message || 'Failed to fetch obligations')
            setObligations([])
        } finally {
            setLoading(false)
        }
    }

    const handleObligationToggle = (obligationId: string) => {
        const newSelected = selectedObligations.includes(obligationId)
            ? selectedObligations.filter(id => id !== obligationId)
            : [...selectedObligations, obligationId]

        onObligationsSelected(newSelected)
    }

    const handleSelectAll = () => {
        const allIds = obligations.map(obl => obl.id)
        onObligationsSelected(allIds)
    }

    const handleDeselectAll = () => {
        onObligationsSelected([])
    }

    return (
        <div className="space-y-6">
            {/* Check Obligations Action */}
            {!obligationsChecked && (
                <div className="glass p-8 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Building2 className="w-24 h-24 text-brand-cyan" />
                    </div>
                    
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20">
                                <Zap className="w-7 h-7 text-brand-cyan" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight block">
                                    Analyze Obligations
                                </h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Action Required</p>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            Before filing, we need to securely scan the iTax database to identify active tax obligations for this corporate entity.
                        </p>

                        <Button
                            onClick={fetchObligations}
                            disabled={loading || !pin || !pin.toUpperCase().startsWith('P')}
                            className="w-full h-16 bg-gradient-to-r from-brand-cyan to-blue-700 hover:from-brand-cyan hover:to-blue-800 text-black font-black text-lg rounded-2xl shadow-xl shadow-brand-cyan/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Scanning Database...
                                </>
                            ) : (
                                <>
                                    Fetch Active Obligations
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-destructive/10 border border-destructive/30 p-5 rounded-3xl flex items-start gap-4 shadow-sm"
                    >
                        <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-destructive uppercase tracking-widest">Scan Failed</p>
                            <p className="text-sm font-bold text-destructive leading-relaxed">{error}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Obligations Display */}
            {obligationsChecked && !loading && (
                <div className="glass p-8 rounded-[2.5rem] border-border shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck className="w-24 h-24 text-brand-cyan" />
                    </div>
                    
                    <div className="relative space-y-8">
                        {/* Company Header */}
                        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-6">
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight truncate max-w-[300px]">
                                    {taxpayerName || pin}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full animate-pulse",
                                        pinStatus?.toLowerCase() === 'active' ? "bg-green-500" : "bg-yellow-500"
                                    )} />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                        PIN Status: {pinStatus || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchObligations}
                                disabled={loading}
                                className="h-10 px-4 rounded-xl border-border text-muted-foreground font-bold hover:text-brand-cyan hover:border-brand-cyan transition-all"
                            >
                                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                                Rescan
                            </Button>
                        </div>

                        {/* Obligations List */}
                        {obligations.length > 0 ? (
                            <div className="space-y-6">
                                {/* Action Mode Selector */}
                                {onActionModeChange && (
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-secondary/50 rounded-2xl border border-border">
                                        <button
                                            onClick={() => onActionModeChange('file')}
                                            className={cn(
                                                "h-12 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all",
                                                actionMode === 'file' ? "bg-background text-brand-cyan shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <FileText className="h-4 w-4" />
                                            File Nil
                                        </button>
                                        <button
                                            onClick={() => onActionModeChange('terminate')}
                                            className={cn(
                                                "h-12 rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all",
                                                actionMode === 'terminate' ? "bg-background text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Terminate
                                        </button>
                                    </div>
                                )}

                                {/* Termination Reason (only in terminate mode) */}
                                <AnimatePresence>
                                    {actionMode === 'terminate' && onTerminationReasonChange && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-3"
                                        >
                                            <Label className="text-[10px] font-black text-destructive uppercase tracking-widest">
                                                Termination Reason Required
                                            </Label>
                                            <Select value={terminationReason} onValueChange={onTerminationReasonChange}>
                                                <SelectTrigger className="h-14 rounded-2xl border-destructive/30 focus:ring-red-100 bg-destructive/10 text-sm font-bold">
                                                    <SelectValue placeholder="Select termination basis..." />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-border shadow-2xl">
                                                    {TERMINATION_REASONS.map(reason => (
                                                        <SelectItem key={reason} value={reason} className="py-3 px-4 rounded-xl focus:bg-destructive/10 focus:text-destructive font-bold">
                                                            {reason}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                            {actionMode === 'terminate'
                                                ? 'Obligations to Terminate'
                                                : 'Obligations to File'}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className="text-[10px] font-black uppercase text-brand-cyan hover:bg-brand-cyan/10 px-2"
                                            >
                                                All
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleDeselectAll}
                                                className="text-[10px] font-black uppercase text-muted-foreground hover:bg-secondary px-2"
                                            >
                                                None
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {obligations.map((obligation) => (
                                            <div
                                                key={obligation.id}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group/item",
                                                    selectedObligations.includes(obligation.id) 
                                                        ? (actionMode === 'terminate' ? "bg-destructive/10 border-destructive/30 shadow-sm" : "bg-brand-cyan/5 border-brand-cyan/20 shadow-sm")
                                                        : "bg-background/50 border-border hover:border-border"
                                                )}
                                                onClick={() => handleObligationToggle(obligation.id)}
                                            >
                                                <Checkbox
                                                    id={`obligation-${obligation.id}`}
                                                    checked={selectedObligations.includes(obligation.id)}
                                                    onCheckedChange={() => handleObligationToggle(obligation.id)}
                                                    className={cn(
                                                        "w-6 h-6 border-border rounded-lg shrink-0",
                                                        actionMode === 'terminate' 
                                                            ? "data-[state=checked]:bg-destructive data-[state=checked]:border-red-500" 
                                                            : "data-[state=checked]:bg-brand-cyan data-[state=checked]:border-brand-cyan"
                                                    )}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-foreground uppercase truncate">
                                                        {obligation.name}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <Badge className="bg-background border-border text-[9px] font-black text-muted-foreground uppercase tracking-tighter shadow-sm px-2">
                                                            {obligation.status}
                                                        </Badge>
                                                        <p className="text-[10px] text-muted-foreground font-bold font-mono">
                                                            EFF: {obligation.effectiveFrom}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedObligations.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className={cn(
                                                "p-6 rounded-3xl border flex items-center gap-4 relative overflow-hidden",
                                                actionMode === 'terminate' ? "bg-destructive/10 border-destructive/30" : "bg-brand-cyan/5 border-brand-cyan/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                                actionMode === 'terminate' ? "bg-destructive text-white" : "bg-brand-cyan text-black"
                                            )}>
                                                {actionMode === 'terminate' ? <Trash2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-sm font-black",
                                                    actionMode === 'terminate' ? "text-destructive" : "text-brand-cyan"
                                                )}>
                                                    {selectedObligations.length} Obligation{selectedObligations.length > 1 ? 's' : ''} Selected
                                                </p>
                                                <p className={cn(
                                                    "text-xs font-bold opacity-70",
                                                    actionMode === 'terminate' ? "text-destructive" : "text-brand-cyan/70"
                                                )}>
                                                    {actionMode === 'terminate'
                                                        ? 'Ready for secure termination'
                                                        : `Total Processing Fee: KES ${selectedObligations.length * 50}`}
                                                </p>
                                            </div>
                                            {actionMode === 'terminate' && !terminationReason && (
                                                <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[1px] flex items-center justify-center">
                                                    <p className="text-[10px] font-black text-destructive bg-background px-3 py-1.5 rounded-full shadow-lg border border-destructive/30 uppercase tracking-widest">
                                                        Select Reason Above
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-foreground">No Obligations Found</p>
                                    <p className="text-sm text-muted-foreground font-medium max-w-[240px] mx-auto">
                                        This PIN doesn't appear to have any active corporate tax obligations.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
