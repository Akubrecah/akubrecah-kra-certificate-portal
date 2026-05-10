// @ts-nocheck
import Link from 'next/link'
import Image from 'next/image'
import { PageBackground } from "@/components/ui/page-background"
import { ArrowLeft, CheckCircle, FileText, FilePlusIcon, KeyIcon, MailIcon, Shield, ActivityIcon, AlertCircle, ArrowRight, Clock, CreditCard } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { notFound } from 'next/navigation'
import ServiceSidebar from '@/components/service-sidebar'

// Define the service data
const serviceData = {
    "register-kra-pin": {
        title: "Register KRA PIN",
        icon: "file-plus",
        description: "Get your Kenya Revenue Authority Personal Identification Number quickly and easily with our streamlined process.",
        longDescription: "A KRA PIN is essential for every Kenyan citizen who wants to file tax returns, register a business, or access government services. Our simplified registration process eliminates the usual bureaucracy and paperwork, allowing you to obtain your PIN in minutes rather than days.",
        requirements: [
            "National ID or Passport",
            "Valid email address",
            "Mobile phone number",
            "Residential address details"
        ],
        steps: [
            "Upload your National ID or Passport",
            "AI extracts your information automatically",
            "Review and complete your personal details",
            "Provide contact and address information",
            "Submit and receive your KRA PIN"
        ],
        faq: [
            {
                question: "How long does it take to get my KRA PIN?",
                answer: "With our automated system, you can complete the registration process in minutes. Your PIN will be generated immediately upon successful submission."
            },
            {
                question: "What documents do I need?",
                answer: "You need a valid National ID or Passport, a mobile phone number, and an email address. Our AI will extract information from your ID automatically."
            },
            {
                question: "Is my information secure?",
                answer: "Yes, we use bank-grade encryption to protect your data. Your information is transmitted securely to KRA's official portal."
            }
        ],
        price: "Ksh 30",
        callToAction: "Register KRA PIN Now"
    },
    "renew-kra-password": {
        title: "Renew KRA Password",
        icon: "key",
        description: "Reset your KRA password securely without the usual hassle and delays.",
        longDescription: "Many Kenyans struggle with accessing their KRA accounts due to forgotten passwords and a cumbersome reset process. Our service simplifies password renewal, providing you with secure access to your account in minutes, not days.",
        requirements: [
            "Existing KRA PIN",
            "National ID or Passport",
            "Registered phone number"
        ],
        steps: [
            "Enter your KRA PIN and ID number",
            "Complete identity verification",
            "Create a new strong password",
            "Receive confirmation of password change",
            "Log in to your KRA account with your new password"
        ],
        faq: [
            {
                question: "How quickly can I reset my KRA password?",
                answer: "Our system processes password reset requests instantly, allowing you to regain access to your account within minutes."
            },
            {
                question: "What if I don't remember my KRA PIN?",
                answer: "We offer a PIN recovery service as well. You can use our 'Recover KRA PIN' option first, then proceed with the password reset."
            },
            {
                question: "Is the new password sent to my email?",
                answer: "No, for security reasons, you create your own new password directly on our platform. We never send passwords via email."
            }
        ],
        price: "Ksh 30",
        callToAction: "Reset KRA Password Now"
    },
    "change-kra-email": {
        title: "Change KRA Email",
        icon: "mail",
        description: "Update your registered email address with KRA in minutes without complications.",
        longDescription: "Keeping your contact information updated with KRA is essential for timely notifications and secure access to your tax account. Our service streamlines the email change process, ensuring your KRA communications are directed to your current email address.",
        requirements: [
            "Your KRA PIN",
            "Current registered email access",
            "New email address",
            "Valid ID number"
        ],
        steps: [
            "Enter your KRA credentials",
            "Specify your new email address",
            "Verify both old and new email addresses",
            "Receive confirmation of email update"
        ],
        faq: [
            {
                question: "Will I lose access to my KRA account during the email change?",
                answer: "No, your account access remains uninterrupted throughout the email change process."
            },
            {
                question: "How long does it take to update my email on KRA?",
                answer: "With our service, the email update is processed and confirmed within 30 minutes."
            },
            {
                question: "What if I no longer have access to my old email?",
                answer: "We offer an alternative verification process if you've lost access to your previously registered email. Contact our support team for assistance."
            }
        ],
        price: "Ksh 30",
        callToAction: "Update KRA Email Now"
    },
    "register-nssf": {
        title: "Register NSSF",
        icon: "shield",
        description: "Complete your National Social Security Fund registration quickly and without complications.",
        longDescription: "NSSF registration is a crucial step for securing your future through government-backed social security benefits. Our streamlined process helps you register with NSSF efficiently, ensuring compliance with Kenyan regulations while saving you time and effort.",
        requirements: [
            "National ID or Passport",
            "KRA PIN",
            "Valid phone number",
        ],
        steps: [
            "Complete the NSSF registration form",
            "Receive your NSSF membership number"
        ],
        faq: [
            {
                question: "Is NSSF registration mandatory in Kenya?",
                answer: "Yes, NSSF registration is mandatory for all employed Kenyans and voluntary for self-employed individuals."
            },
            {
                question: "How long does NSSF registration take?",
                answer: "With our service, you can complete your NSSF registration and receive your membership number within 24 hours."
            },
            {
                question: "Can I track my NSSF registration status?",
                answer: "Yes, our platform provides real-time updates on your registration progress and notifications when your membership is confirmed."
            }
        ],
        price: "Ksh 30",
        callToAction: "Register for NSSF Now"
    },
    "register-shif": {
        title: "Register for SHIF",
        icon: "heart-pulse",
        description: "Secure Your Health Coverage Today",
        longDescription: "Access affordable healthcare without the stress. The Social Health Insurance Fund (SHIF) gives you access to essential healthcare services across Kenya, including outpatient, inpatient, and maternity care. Don't wait until you need care—get covered today.",
        requirements: [
            "National ID or Passport",
            "KRA PIN",
            "Recent digital photo",
            "Valid phone number and email"
        ],
        steps: [
            "Fill in your SHIF registration form",
            "Upload your identification documents",
            "Complete payment and receive confirmation"
        ],
        faq: [
            {
                question: "When does my coverage begin?",
                answer: "Your coverage becomes active within 48 hours after successful registration and payment confirmation."
            },
            {
                question: "Can I add dependents?",
                answer: "Yes. You can include your spouse and children as dependents during or after registration."
            },
            {
                question: "What does SHIF cover?",
                answer: "A broad range of services including outpatient, inpatient, maternity, and chronic care."
            }
        ],
        price: "Ksh 30",
        callToAction: "Register for SHIF Now"
    },
    "file-nil-returns": {
        title: "File Nil Returns",
        icon: "file-text",
        description: "Effortless KRA Nil Returns in Just 30 Seconds",
        longDescription: "Akubrecah Entertainment makes tax compliance simple for students and unemployed youth. No stress, no confusion—just quick, lightning-fast filing using our simple, automated system.",
        requirements: [
            "KRA PIN",
            "KRA iTax password",
            "Valid phone number",
            "Email address"
        ],
        steps: [
            "Log in to your Akubrecah Entertainment account",
            "Provide your KRA credentials",
            "Confirm your contact details",
            "Complete payment and receive filing confirmation"
        ],
        faq: [
            {
                question: "What is a nil return?",
                answer: "A nil return is a tax filing that indicates you had no taxable income during the reporting period. Even with zero income, filing is mandatory to maintain tax compliance."
            },
            {
                question: "How quickly can I file my nil returns?",
                answer: "With our automated system, you can complete your nil returns filing in as little as 30 seconds."
            },
            {
                question: "Will I receive a filing confirmation?",
                answer: "Yes, you'll receive an official KRA acknowledgment receipt immediately after successful filing, which you can download and save for your records."
            }
        ],
        price: "Ksh 30",
    },
    "custom-filing": {
        title: "Custom Tax Filing",
        icon: "file-text",
        description: "Effortless Custom Tax Services in Just 5 Minutes",
        longDescription: "Akubrecah Entertainment makes specialized tax compliance simple. This is your duplicated template ready for a new service description.",
        requirements: [
            "KRA PIN",
            "KRA iTax password",
            "Supporting documents"
        ],
        steps: [
            "Log in to your account",
            "Upload required documents",
            "Confirm details",
            "Complete payment and receive confirmation"
        ],
        faq: [
            {
                question: "What is this service for?",
                answer: "This is a placeholder for your new custom service. You can edit these details in the serviceData object."
            }
        ],
        price: "Ksh 100",
        callToAction: "Start Custom Filing"
    }
};

export default async function ServicePage({ params }) {
    const { slug } = await params;
    const service = serviceData[slug];

    if (!service) {
        return notFound();
    }

    // Services for the left sidebar
    const sidebarServices = [
        { title: "Register KRA PIN", icon: "file-plus", slug: "register-kra-pin" },
        { title: "File Nil Returns", icon: "file-text", slug: "file-nil-returns" },
        { title: "Renew KRA Password", icon: "key", slug: "renew-kra-password" },
        { title: "Change KRA Email", icon: "mail", slug: "change-kra-email" },
        { title: "Register NSSF", icon: "shield", slug: "register-nssf" },
        { title: "Register SHIF", icon: "heart-pulse", slug: "register-shif" }
    ];

    return (
        <PageBackground>
            {/* <ServiceSidebar /> */}

            <div className="container mx-auto py-6 px-4 md:py-1 max-w-6xl">
                <Link href="/services" className="inline-flex items-center text-primary hover:underline mb-4 md:mb-8 text-sm">
                    <ArrowLeft className="mr-1 h-3 w-3 md:h-4 md:w-4" /> Back to all services
                </Link>

                <div className="grid gap-6 md:grid-cols-3 md:gap-12">
                    <div className="md:col-span-2 space-y-8">
                        <div className="relative overflow-hidden rounded-3xl border border-brand-cyan/20 bg-card/50 p-6 md:p-10 backdrop-blur-xl">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-brand-cyan/5 blur-3xl" />
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 text-brand-cyan shadow-inner">
                                        {service.icon === "key" && <KeyIcon className="h-6 w-6 md:h-8 md:w-8" />}
                                        {service.icon === "mail" && <MailIcon className="h-6 w-6 md:h-8 md:w-8" />}
                                        {service.icon === "file-plus" && <FilePlusIcon className="h-6 w-6 md:h-8 md:w-8" />}
                                        {service.icon === "shield" && <Shield className="h-6 w-6 md:h-8 md:w-8" />}
                                        {service.icon === "heart-pulse" && <ActivityIcon className="h-6 w-6 md:h-8 md:w-8" />}
                                        {service.icon === "file-text" && <FileText className="h-6 w-6 md:h-8 md:w-8" />}
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-heading tracking-tighter text-foreground">{service.title}</h1>
                                </div>

                                <p className="text-lg md:text-2xl font-medium text-muted-foreground mb-4 leading-tight">{service.description}</p>
                                <p className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-2xl">{service.longDescription}</p>
                            </div>
                        </div>

                        <div className="py-4">
                            <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-8 flex items-center gap-2">
                                <span className="h-8 w-1 bg-brand-green rounded-full" />
                                How It Works
                            </h2>
                            <div className="relative space-y-8 pl-4">
                                <div className="absolute left-[21px] top-2 bottom-2 w-0.5 bg-muted md:left-[25px]" />
                                {service.steps.map((step, index) => (
                                    <div key={index} className="relative flex items-start gap-4 group">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border-2 border-brand-green text-brand-green font-heading text-sm transition-all group-hover:bg-brand-green group-hover:text-white md:h-12 md:w-12">
                                            {index + 1}
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-base md:text-lg font-medium text-foreground">{step}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8">
                            <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-8 flex items-center gap-2">
                                <span className="h-8 w-1 bg-brand-cyan rounded-full" />
                                Frequently Asked Questions
                            </h2>
                            <div className="grid gap-4">
                                {service.faq.map((item, index) => (
                                    <div key={index} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-brand-cyan/20 hover:shadow-lg hover:shadow-brand-red/5">
                                        <h3 className="font-heading text-lg text-foreground mb-2 group-hover:text-brand-red transition-colors">{item.question}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-12">
                            <h2 className="text-2xl md:text-3xl font-heading text-foreground mb-8 flex items-center gap-2">
                                <span className="h-8 w-1 bg-brand-cyan rounded-full" />
                                Why Akubrecah?
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-border bg-card p-6 hover:border-brand-cyan/20 transition-all">
                                    <h3 className="font-heading text-lg text-brand-cyan mb-2">Fast & Reliable</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">Our automated AI systems process your requests in real-time, cutting down wait times from days to minutes.</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-6 hover:border-brand-cyan/20 transition-all">
                                    <h3 className="font-heading text-lg text-brand-cyan mb-2">Secure Processing</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">We use state-of-the-art encryption and blockchain-verified records to keep your sensitive data safe.</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-6 hover:border-brand-cyan/20 transition-all">
                                    <h3 className="font-heading text-lg text-brand-cyan mb-2">24/7 Support</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">Tax compliance doesn't sleep, and neither do we. Our team is always ready to assist you.</p>
                                </div>
                                <div className="rounded-2xl border border-border bg-card p-6 hover:border-brand-cyan/20 transition-all">
                                    <h3 className="font-heading text-lg text-brand-cyan mb-2">Youth-Centric</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">Specifically designed for students and young freelancers, with prices that respect your budget.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-24 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                            <div className="bg-brand-cyan px-6 py-4">
                                <h3 className="text-lg font-heading text-white">Service Overview</h3>
                            </div>

                            <div className="p-6 space-y-8">
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Requirements</h4>
                                    <ul className="space-y-3">
                                        {service.requirements.map((req, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-2 border-t">
                                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Processing Time</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <Clock className="h-3 w-3 mr-1" /> Standard Processing
                                        </span>
                                        <span className="text-xs md:text-sm font-medium">5 minutes</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <Clock className="h-3 w-3 mr-1" /> Express Processing
                                        </span>
                                        <span className="text-xs md:text-sm font-medium text-brand-cyan">1 minute</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <h4 className="text-xs md:text-sm font-medium text-muted-foreground mb-2">Service Fee</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs md:text-sm flex items-center">
                                            <CreditCard className="h-3 w-3 mr-1" /> One-time payment
                                        </span>
                                        <p className="text-lg md:text-2xl font-bold text-foreground">{service.price}</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button size="lg" className="w-full rounded-xl text-sm bg-brand-cyan hover:bg-brand-cyan/90 text-black border-none" asChild>
                                        <Link href={slug === 'register-kra-pin' ? '/kra-registration' : `/checkout/${slug}`}>
                                            {service.callToAction} <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                                        </Link>
                                    </Button>
                                    <p className="text-[10px] md:text-xs text-center text-muted-foreground mt-2">
                                        Secure payment • Instant processing
                                    </p>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                        <FileText className="h-3 w-3" />
                                        <span>Need help? <Link href="/contact" className="text-brand-cyan hover:underline">Contact Support</Link></span>
                                    </div>

                                    <div className="bg-brand-cyan/5 rounded-lg p-2">
                                        <p className="text-xs font-medium mb-1">Trusted by Kenyans</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="h-5 w-5 rounded-full bg-muted border border-background" />
                                                ))}
                                            </div>
                                            <p className="text-[10px] md:text-xs text-muted-foreground">Join 10,000+ satisfied customers</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-16 border-t pt-12">
                    <h2 className="text-3xl font-heading text-foreground mb-10 text-center">Other Services You Might Need</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {sidebarServices
                            .filter(s => s.slug !== slug)
                            .slice(0, 4)
                            .map((relatedService, index) => (
                                <Link href={`/services/${relatedService.slug}`} key={index} className="group">
                                    <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all hover:border-brand-cyan/20 hover:shadow-xl hover:-translate-y-1">
                                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-cyan/10 text-brand-cyan group-hover:bg-brand-cyan group-hover:text-black transition-colors">
                                            {relatedService.icon === "key" && <KeyIcon className="h-5 w-5" />}
                                            {relatedService.icon === "mail" && <MailIcon className="h-5 w-5" />}
                                            {relatedService.icon === "file-plus" && <FilePlusIcon className="h-5 w-5" />}
                                            {relatedService.icon === "shield" && <Shield className="h-5 w-5" />}
                                            {relatedService.icon === "heart-pulse" && <ActivityIcon className="h-5 w-5" />}
                                            {relatedService.icon === "file-text" && <FileText className="h-5 w-5" />}
                                        </div>
                                        <h3 className="font-heading text-lg text-foreground mb-2">{relatedService.title}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            Learn more <ArrowRight className="h-3 w-3" />
                                        </p>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>

            </div>
        </PageBackground>
    );
}