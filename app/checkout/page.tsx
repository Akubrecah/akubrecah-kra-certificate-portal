"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Building } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CheckoutPaymentMethod() {
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

  const handleContinue = () => {
    router.push(`/checkout/review?type=${checkoutType}`);
  };

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
          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative">
            <div className="flex items-center gap-4">
              <div className="bg-primary-container text-on-primary-container p-3 rounded-full">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-lg text-on-surface">M-PESA</p>
                <p className="text-sm text-on-surface-variant">Pay via M-PESA Express</p>
              </div>
            </div>
            <input type="radio" name="paymentMethod" value="mpesa" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5" defaultChecked />
          </div>

          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative">
            <div className="flex items-center gap-4">
              <div className="bg-surface-container text-on-surface-variant p-3 rounded-full">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-lg text-on-surface">Credit / Debit Card</p>
                <p className="text-sm text-on-surface-variant">Visa or Mastercard</p>
              </div>
            </div>
            <input type="radio" name="paymentMethod" value="card" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5" />
          </div>

          <div className="border border-outline-variant rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-surface-container transition-colors relative">
            <div className="flex items-center gap-4">
              <div className="bg-surface-container text-on-surface-variant p-3 rounded-full">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-lg text-on-surface">Bank Transfer</p>
                <p className="text-sm text-on-surface-variant">EFT or RTGS</p>
              </div>
            </div>
            <input type="radio" name="paymentMethod" value="bank" className="absolute top-1/2 -translate-y-1/2 right-6 w-5 h-5" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-outline-variant pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleContinue} className="bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container">
            Continue to Review
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
