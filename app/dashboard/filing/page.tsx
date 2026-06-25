"use client"

import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FilingComingSoon() {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <Clock className="w-10 h-10 text-primary" />
      </div>
      
      <h1 className="text-4xl font-headline font-bold text-on-surface">Tax Filing</h1>
      <p className="text-xl text-on-surface-variant max-w-2xl">
        This feature is currently under active development. You will soon be able to file your nil and full returns directly from this portal.
      </p>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg mt-8 max-w-md w-full">
        <CardHeader className="pb-4 border-b border-outline-variant">
          <CardTitle className="text-xl font-headline">Coming Soon</CardTitle>
          <CardDescription>We are working hard to bring you a seamless filing experience.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-on-surface font-medium">Simplified Nil Returns</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-on-surface font-medium">Step-by-step Income Declaration</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-on-surface font-medium">Automated Relief Calculations</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
