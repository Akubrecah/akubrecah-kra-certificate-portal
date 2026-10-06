"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function CheckoutReview() {
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
        <h1 className="text-3xl font-headline font-bold text-on-surface">Review & Pay</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Confirm your details and authorize payment.</p>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg">
        <CardHeader className="border-b border-outline-variant pb-6">
          <CardTitle className="text-xl font-headline">Order Summary</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="bg-surface-container-low p-4 rounded-lg flex justify-between items-center border border-outline-variant">
            <span className="font-medium text-on-surface">Total Amount</span>
            <span className="text-2xl font-bold text-primary">
              KES {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-surface-container-low p-4 rounded-lg flex items-start gap-4 border border-outline-variant">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="text-primary w-5 h-5" />
            </div>
            <div>
              <Label htmlFor="phone">M-PESA Phone Number</Label>
              <Input id="phone" defaultValue="0712 345 678" className="border-outline-variant focus-visible:ring-primary w-full mt-1.5" />
            </div>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5">
            A prompt will be sent to this number to authorize the payment.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between items-center gap-3 border-t border-outline-variant pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-10 px-5 rounded-xl text-sm font-medium">Back</Button>
          <Button onClick={() => router.push(`/checkout/success?type=${checkoutType}`)} className="bg-primary text-on-primary hover:bg-primary/90 h-10 px-6 rounded-xl text-sm font-semibold shadow-sm">
            Pay KES {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
