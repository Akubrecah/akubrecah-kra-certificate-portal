import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function FilingSuccess() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8 mt-12 text-center">
      <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
      
      <div>
        <h1 className="text-3xl font-headline font-bold text-on-surface">Return Filed Successfully</h1>
        <p className="text-on-surface-variant mt-2 text-lg">Your tax return has been received and processed.</p>
      </div>

      <Card className="bg-surface-container-lowest border-outline-variant shadow-soft rounded-lg text-left">
        <CardHeader className="border-b border-outline-variant pb-4">
          <CardTitle className="text-xl font-headline">Acknowledgment Receipt</CardTitle>
          <CardDescription>ACK-2026-089</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Date Filed</span>
            <span className="font-medium text-on-surface">Jan 15, 2026</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Return Type</span>
            <span className="font-medium text-on-surface">Nil Return - Resident Individual</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="text-on-surface-variant">Period</span>
            <span className="font-medium text-on-surface">2025</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row gap-4 border-t border-outline-variant pt-6">
          <Button variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" /> Download Acknowledgment
          </Button>
          <Button asChild className="w-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container">
            <Link href="/dashboard" className="gap-2">
              <Home className="h-4 w-4" /> Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
