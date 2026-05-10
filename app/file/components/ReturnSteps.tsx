// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/supabaseClient'
import SessionManagementService from "@/src/sessionManagementService"
import { ArrowLeft, ArrowRight } from "lucide-react"
import {
    FilingStatus,
    ManufacturerDetails,
    FormData,
    ValidationStatus
} from "../lib/types"
import {
    validatePassword,
    resetPassword,
    resetPasswordAndEmail,
    validatePIN,
    extractManufacturerDetails,
    fileNilReturn,
    debouncedValidatePassword
} from '../lib/returnHelpers'

// Import step components
import Step1PINComponent from "./Step1PIN"
import Step2DetailsComponent from "./Step2Details"
import Step4FilingComponent from "./Step4Filing"

// Export the step components
export const Step1PIN = Step1PINComponent
export const Step2Details = Step2DetailsComponent
export const Step4Filing = Step4FilingComponent

// Initialize session service
const sessionService = new SessionManagementService()

// Re-export types from types.ts for convenience
export type {
    FilingStatus,
    ManufacturerDetails,
    FormData,
    ValidationStatus
}

export function ReturnSteps() {
    const router = useRouter()

    // State management
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({
        pin: "",
        manufacturerName: "",
        email: "",
        mobileNumber: "",
        password: "",
        fileType: "individual"
    })

    const [manufacturerDetails, setManufacturerDetails] = useState<ManufacturerDetails | null>(null)
    const [filingStatus, setFilingStatus] = useState<FilingStatus>({
        loggedIn: false,
        filing: false,
        extracting: false,
        completed: false
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [pinValidationStatus, setPinValidationStatus] = useState<ValidationStatus>("idle")
    const [passwordValidationStatus, setPasswordValidationStatus] = useState<ValidationStatus>("idle")
    const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
    const [receiptNumber, setReceiptNumber] = useState<string | null>(null)
    const [residentType, setResidentType] = useState<string>("1")
    const [selectedObligations, setSelectedObligations] = useState<string[]>([])

    // Initialize session on component mount
    useEffect(() => {
        const initializeSession = async () => {
            try {
                console.log('[APP] Initializing prospect session...');
                const sessionId = await sessionService.createProspectSession();
                console.log('[APP] Prospect session created with ID:', sessionId);

                // Record page view in analytics
                await supabase
                    .from('session_activities')
                    .insert([{
                        session_id: sessionId,
                        activity_type: 'user_action',
                        description: 'Viewed filing page',
                        metadata: {
                            page: 'file',
                            component: 'ReturnSteps'
                        }
                    }]);

                console.log('[DB] Recorded page view in database');
            } catch (error) {
                console.error('[APP ERROR] Error creating prospect session:', error);
            }
        };

        initializeSession();
    }, []);

    // Handler functions
    const handlePINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPin = e.target.value.toUpperCase();
        setFormData(prev => ({ ...prev, pin: newPin }));

        if (newPin.length === 11) {
            setPinValidationStatus("checking");

            try {
                // Record PIN validation attempt in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'PIN validation attempted',
                                metadata: {
                                    pin: newPin
                                }
                            }]);
                        console.log('[DB] Recorded PIN validation attempt');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording PIN validation attempt:', dbError);
                    }
                }

                // Validate PIN
                const { isValid, details, error: validationError } = await validatePIN(newPin);

                if (isValid) {
                    setPinValidationStatus("valid");
                    setError(null);

                    // Extract manufacturer details
                    const manufacturerInfo = extractManufacturerDetails(details);

                    // If it's a company PIN (starts with P), fetch obligations automatically
                    if (newPin.toUpperCase().startsWith('P')) {
                        console.log('[OBLIGATIONS] Company PIN detected, fetching obligations...');
                        try {
                            const obligationsResponse = await fetch('/api/company/check-obligations', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pin: newPin })
                            });

                            const obligationsData = await obligationsResponse.json();

                            if (obligationsResponse.ok && obligationsData.success) {
                                console.log('[OBLIGATIONS] Fetched obligations:', obligationsData.obligations);
                                manufacturerInfo.obligationsData = {
                                    taxpayerName: obligationsData.taxpayerName,
                                    pinStatus: obligationsData.pinStatus,
                                    itaxStatus: obligationsData.itaxStatus,
                                    obligations: obligationsData.obligations,
                                    timestamp: obligationsData.timestamp
                                };

                                // Don't auto-select - let user choose which obligations to file
                                setSelectedObligations([]);
                                console.log('[OBLIGATIONS] Obligations loaded, none selected by default');
                            } else {
                                console.error('[OBLIGATIONS] Failed to fetch obligations:', obligationsData.error);
                            }
                        } catch (obligationsError) {
                            console.error('[OBLIGATIONS] Error fetching obligations:', obligationsError);
                        }
                    }

                    setManufacturerDetails(manufacturerInfo);
                    setFormData(prev => ({
                        ...prev,
                        manufacturerName: manufacturerInfo.name,
                        email: manufacturerInfo.contactDetails?.email || '',
                        mobileNumber: manufacturerInfo.contactDetails?.mobile || ''
                    }));

                    // Record successful PIN validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'PIN validated successfully',
                                    metadata: {
                                        pin: newPin,
                                        name: manufacturerInfo.name
                                    }
                                }]);
                            console.log('[DB] Recorded successful PIN validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording successful PIN validation:', dbError);
                        }
                    }
                } else {
                    setPinValidationStatus("invalid");
                    setError(validationError || "Invalid PIN. Please check and try again.");

                    // Record failed PIN validation in database
                    if (currentSessionId) {
                        try {
                            await supabase
                                .from('session_activities')
                                .insert([{
                                    session_id: currentSessionId,
                                    activity_type: 'user_action',
                                    description: 'PIN validation failed',
                                    metadata: {
                                        pin: newPin,
                                        error: validationError || "Invalid PIN"
                                    }
                                }]);
                            console.log('[DB] Recorded failed PIN validation');
                        } catch (dbError) {
                            console.error('[DB ERROR] Error recording failed PIN validation:', dbError);
                        }
                    }
                }
            } catch (error) {
                setPinValidationStatus("invalid");
                setError("Error validating PIN. Please try again.");
                console.error('[APP ERROR] PIN validation error:', error);

                // Record PIN validation error in database
                const currentSessionId = sessionService.getData('currentSessionId');
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'error',
                                description: 'PIN validation error',
                                metadata: {
                                    pin: newPin,
                                    error: error.message || "Unknown error"
                                }
                            }]);
                        console.log('[DB] Recorded PIN validation error');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording PIN validation error:', dbError);
                    }
                }
            }
        } else {
            setPinValidationStatus("idle");
            setError(null);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setFormData(prev => ({ ...prev, password: newPassword }));

        // Reset validation status when password changes
        if (passwordValidationStatus === "valid" || passwordValidationStatus === "invalid") {
            setPasswordValidationStatus("idle");
            setPasswordError(null);
        }
    };

    const handlePasswordReset = async () => {
        setLoading(true);
        setError(null);

        try {
            // Record password reset attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password reset attempted',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);
                    console.log('[DB] Recorded password reset attempt');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password reset attempt:', dbError);
                }
            }

            // Reset password
            const { success, error: resetError } = await resetPassword(formData.pin);

            if (success) {
                setError("Password reset instructions sent to your registered email.");

                // Record successful password reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset successful',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);
                        console.log('[DB] Recorded successful password reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording successful password reset:', dbError);
                    }
                }
            } else {
                setError(resetError || "Failed to reset password. Please try again.");

                // Record failed password reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password reset failed',
                                metadata: {
                                    pin: formData.pin,
                                    error: resetError || "Failed to reset password"
                                }
                            }]);
                        console.log('[DB] Recorded failed password reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording failed password reset:', dbError);
                    }
                }
            }
        } catch (error) {
            setError("An error occurred while resetting password. Please try again.");
            console.error('[APP ERROR] Password reset error:', error);

            // Record password reset error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'error',
                            description: 'Password reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message || "Unknown error"
                            }
                        }]);
                    console.log('[DB] Recorded password reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password reset error:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordEmailReset = async () => {
        setLoading(true);
        setError(null);

        try {
            // Record password and email reset attempt in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'user_action',
                            description: 'Password and email reset attempted',
                            metadata: {
                                pin: formData.pin
                            }
                        }]);
                    console.log('[DB] Recorded password and email reset attempt');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password and email reset attempt:', dbError);
                }
            }

            // Reset password and email
            const { success, error: resetError } = await resetPasswordAndEmail(formData.pin);

            if (success) {
                setError("Password and email reset instructions sent to your registered mobile number.");

                // Record successful password and email reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset successful',
                                metadata: {
                                    pin: formData.pin
                                }
                            }]);
                        console.log('[DB] Recorded successful password and email reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording successful password and email reset:', dbError);
                    }
                }
            } else {
                setError(resetError || "Failed to reset password and email. Please try again.");

                // Record failed password and email reset in database
                if (currentSessionId) {
                    try {
                        await supabase
                            .from('session_activities')
                            .insert([{
                                session_id: currentSessionId,
                                activity_type: 'user_action',
                                description: 'Password and email reset failed',
                                metadata: {
                                    pin: formData.pin,
                                    error: resetError || "Failed to reset password and email"
                                }
                            }]);
                        console.log('[DB] Recorded failed password and email reset');
                    } catch (dbError) {
                        console.error('[DB ERROR] Error recording failed password and email reset:', dbError);
                    }
                }
            }
        } catch (error) {
            setError("An error occurred while resetting password and email. Please try again.");
            console.error('[APP ERROR] Password and email reset error:', error);

            // Record password and email reset error in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    await supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'error',
                            description: 'Password and email reset error',
                            metadata: {
                                pin: formData.pin,
                                error: error.message || "Unknown error"
                            }
                        }]);
                    console.log('[DB] Recorded password and email reset error');
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording password and email reset error:', dbError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = (type: string) => {
        console.log(`Downloading ${type} receipt...`);

        // Record receipt download in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: `Downloaded ${type} receipt`,
                        metadata: {
                            receipt_type: type,
                            pin: formData.pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded receipt download'))
                    .catch(error => console.error('[DB ERROR] Failed to record receipt download:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording receipt download:', dbError);
            }
        }
    };

    const handleEndSession = () => {
        console.log('Ending session...');

        // Record session end in database
        const currentSessionId = sessionService.getData('currentSessionId');
        if (currentSessionId) {
            try {
                supabase
                    .from('session_activities')
                    .insert([{
                        session_id: currentSessionId,
                        activity_type: 'user_action',
                        description: 'Ended session',
                        metadata: {
                            pin: formData.pin
                        }
                    }])
                    .then(() => console.log('[DB] Recorded session end'))
                    .catch(error => console.error('[DB ERROR] Failed to record session end:', error));
            } catch (dbError) {
                console.error('[DB ERROR] Error recording session end:', dbError);
            }
        }

        // Redirect to home page
        router.push('/');
    };

    const handleNextStep = () => {
        setCurrentStep(prev => {
            const newStep = Math.min(3, prev + 1);

            // If moving to step 3, set filing status to logged in
            if (newStep === 3) {
                setSessionStartTime(new Date());
                setFilingStatus({
                    loggedIn: true,
                    filing: true,
                    extracting: false,
                    completed: false
                });
            }

            // Record step change in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('sessions')
                        .update({
                            current_step: newStep,
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', currentSessionId)
                        .then(() => console.log(`[DB] Updated session to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to update session step:`, error));

                    supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'step_changed',
                            description: `Moved to step ${newStep}`,
                            metadata: {
                                previous_step: prev,
                                new_step: newStep,
                                timestamp: new Date().toISOString()
                            }
                        }])
                        .then(() => console.log(`[DB] Recorded navigation to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to record navigation:`, error));
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording step change:', dbError);
                }
            }

            return newStep;
        });
    };

    const handlePreviousStep = () => {
        setCurrentStep(prev => {
            const newStep = Math.max(1, prev - 1);

            // Record step change in database
            const currentSessionId = sessionService.getData('currentSessionId');
            if (currentSessionId) {
                try {
                    supabase
                        .from('sessions')
                        .update({
                            current_step: newStep,
                            last_activity: new Date().toISOString()
                        })
                        .eq('id', currentSessionId)
                        .then(() => console.log(`[DB] Updated session to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to update session step:`, error));

                    supabase
                        .from('session_activities')
                        .insert([{
                            session_id: currentSessionId,
                            activity_type: 'step_changed',
                            description: `Moved back to step ${newStep}`,
                            metadata: {
                                previous_step: prev,
                                new_step: newStep,
                                timestamp: new Date().toISOString()
                            }
                        }])
                        .then(() => console.log(`[DB] Recorded navigation to step ${newStep}`))
                        .catch(error => console.error(`[DB ERROR] Failed to record navigation:`, error));
                } catch (dbError) {
                    console.error('[DB ERROR] Error recording step change:', dbError);
                }
            }

            return newStep;
        });
    };

    // Render the current step
    return (
        <div className="space-y-6">
            {/* Current step content */}
            {currentStep === 1 && (
                <Step1PIN
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    passwordError={passwordError}
                    pinValidationStatus={pinValidationStatus}
                    passwordValidationStatus={passwordValidationStatus}
                    onPINChange={handlePINChange}
                    onPasswordChange={handlePasswordChange}
                    onPasswordReset={handlePasswordReset}
                    onPasswordEmailReset={handlePasswordEmailReset}
                    onPasswordValidate={async () => {
                        await validatePassword(
                            formData.pin,
                            formData.password,
                            setPasswordValidationStatus,
                            setPasswordError,
                            formData.company_name
                        );
                    }}
                    onNext={handleNextStep}
                    onManufacturerDetailsFound={setManufacturerDetails}
                />
            )}

            {currentStep === 2 && (
                <Step2Details
                    loading={loading}
                    manufacturerDetails={manufacturerDetails}
                    residentType={residentType}
                    setResidentType={setResidentType}
                    selectedObligations={selectedObligations}
                    setSelectedObligations={setSelectedObligations}
                    onBack={handlePreviousStep}
                    onNext={handleNextStep}
                />
            )}

            {currentStep === 3 && (
                <Step4Filing
                    pin={formData.pin}
                    password={formData.password}
                    error={error}
                    filingStatus={filingStatus}
                    sessionStartTime={sessionStartTime}
                    formData={formData}
                    onPasswordChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
                    onDownloadReceipt={handleDownloadReceipt}
                    onEndSession={handleEndSession}
                    onError={setError}
                />
            )}

            {/* Navigation buttons - Only show for steps 1-2, not for step 3 */}
            {currentStep < 3 && (
                <div className="flex items-center justify-between mt-8 p-1 bg-background/50 rounded-2xl border border-border backdrop-blur-md">
                    <div className="flex-1">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handlePreviousStep}
                                className="h-12 px-6 rounded-xl text-muted-foreground hover:text-foreground hover:bg-background transition-all duration-300 font-semibold group flex items-center gap-2"
                            >
                                <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-brand-cyan/10 group-hover:text-brand-cyan transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Back
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 flex justify-center">
                        <div className="flex gap-1.5">
                            {[1, 2].map((step) => (
                                <div 
                                    key={step}
                                    className={cn(
                                        "h-1.5 rounded-full transition-all duration-500",
                                        currentStep === step ? "w-8 bg-brand-cyan" : "w-1.5 bg-foreground/10"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                        {currentStep < 3 && currentStep > 1 && (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                className="h-12 px-8 rounded-xl bg-gradient-to-r from-brand-cyan to-blue-700 text-black font-bold shadow-lg shadow-brand-cyan/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-80 disabled:scale-100 disabled:shadow-none flex items-center gap-2 group"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}