import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Welcome! | DRAMAC",
  description: "Your subscription is now active",
};

export default function BillingSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Welcome to DRAMAC Pro!</h1>
          <p className="text-muted-foreground mb-6">
            Your subscription is now active. You have full access to all features.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sites/new">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Site
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            A receipt has been sent to your email address.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
