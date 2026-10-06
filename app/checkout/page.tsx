"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function CheckoutPaymentMethod() {
  const router = useRouter();
  const { user } = useUser();
  const [amount, setAmount] = useState(15000);
  const [description, setDescription] = useState("Payment for Advance Tax 2026");
  const [checkoutType, setCheckoutType] = useState("advance_tax");

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || "";
  const userRole = user?.publicMetadata?.role as string | undefined;
  const configPublicAdminEmail = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "poweldayck@gmail.com").toLowerCase();
  const isAdmin = (
    userEmail === "poweldayck@gmail.com" ||
    userEmail === configPublicAdminEmail ||
    userRole === "Super Admin" ||
    userRole === "Admin"
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const type = searchParams.get("type") || "advance_tax";
      setCheckoutType(type);
      
      const savedConfig = localStorage.getItem("admin_global_config");
      let rates = { nilFilingFee: 100, retrievalFee: 150 };
      if (savedConfig) {
        try {
          rates = JSON.parse(savedConfig);
        } catch (e) {
          console.error(e);
        }
      }

      if (type === "retrieval") {
        setAmount(rates.retrievalFee);
        setDescription("Payment for KRA Pin & Certificate Retrieval");
      } else if (type === "filing") {
        setAmount(rates.nilFilingFee);
        setDescription("Payment for NIL Tax Returns Filing");
      } else {
        setAmount(15000);
        setDescription("Payment for Advance Tax 2026");
      }
    }
  }, []);

  const handleContinue = () => {
    router.push(`/checkout/review?type=${checkoutType}`);
  };

  if (isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-6 mt-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Admin Privileges Active</h1>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">
          Your administrator account has full unrestricted access across the entire platform. No payment, checkout, or subscription is required.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/">
            <Button className="bg-primary text-on-primary">Go to KRA Portal</Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline">Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 mt-12">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold text-on-surface">Payment Options</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Select a payment method to complete your transaction.</p>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
        <CardHeader className="border-b border-outline-variant pb-6 text-center">
          <CardTitle className="text-xl font-headline">Amount Due ({description})</CardTitle>
          <CardDescription className="text-3xl font-bold text-on-surface mt-2">
            KES {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative flex items-center gap-3">
            <div className="bg-primary-container text-on-primary-container rounded-full p-2">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-lg text-on-surface">M-PESA</p>
              <p className="text-sm text-on-surface-variant">Pay via M-PESA Express</p>
            </div>
            <input type="radio" name="paymentMethod" value="mpesa" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 opacity-0" defaultChecked />
          </div>

          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative flex items-center gap-3">
            <div className="bg-surface-container text-on-surface-variant rounded-full p-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-lg text-on-surface">Credit / Debit Card</p>
              <p className="text-sm text-on-surface-variant">Visa or Mastercard</p>
            </div>
            <input type="radio" name="paymentMethod" value="card" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 opacity-0" />
          </div>

          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative flex items-center gap-3">
            <div className="bg-surface-container text-on-surface-variant rounded-full p-2">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-lg text-on-surface">Bank Transfer</p>
              <p className="text-sm text-on-surface-variant">EFT or RTGS</p>
            </div>
            <input type="radio" name="paymentMethod" value="bank" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5 opacity-0" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-3 border-t border-outline-variant pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-10 px-5 rounded-xl text-sm font-medium">Cancel</Button>
          <Button onClick={handleContinue} className="bg-primary text-on-primary hover:bg-primary/90 h-10 px-6 rounded-xl text-sm font-semibold shadow-sm">
            Continue to Review
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}