"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CheckoutSuccess() {
  const [amount, setAmount] = useState(15000);
  const [receiptDate, setReceiptDate] = useState("");

  useEffect(() => {
    setReceiptDate(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }));
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const type = searchParams.get("type") || "advance_tax";
      
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
      } else if (type === "filing") {
        setAmount(rates.nilFilingFee);
      } else {
        setAmount(15000);
      }
    }
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 mt-12 text-center">
      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto animate-bounce" />
      
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface animate-fade-in">Payment Successful</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Your transaction has been processed successfully.</p>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg text-left">
        <CardHeader className="border-b border-outline-variant pb-4">
          <CardTitle className="text-xl font-headline">Transaction Receipt</CardTitle>
          <CardDescription>TRX-2026-{Math.floor(100 + Math.random() * 900)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Date</span>
            <span className="font-medium text-on-surface">{receiptDate}</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Payment Method</span>
            <span className="font-medium text-on-surface">M-PESA</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Amount Paid</span>
            <span className="font-bold text-primary text-lg">
              KES {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row gap-4 border-t border-outline-variant pt-6">
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" /> Download Receipt
          </Button>
          <Button asChild className="w-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container">
            <Link href="/dashboard" className="gap-2">
              Return to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
