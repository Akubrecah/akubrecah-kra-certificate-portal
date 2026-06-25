"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CheckoutReview() {
  const router = useRouter();
  const [amount, setAmount] = useState(15000);
  const [description, setDescription] = useState("Payment for Advance Tax 2026");
  const [checkoutType, setCheckoutType] = useState("advance_tax");

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

          <div className="space-y-2">
            <Label htmlFor="phone">M-PESA Phone Number</Label>
            <Input id="phone" defaultValue="0712 345 678" className="border-outline-variant focus-visible:ring-primary" />
            <p className="text-sm text-on-surface-variant">A prompt will be sent to this number to authorize the payment.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-outline-variant pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Back</Button>
          <Button onClick={() => router.push(`/checkout/success?type=${checkoutType}`)} className="bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container">
            Pay KES {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
