import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPurchaseWizard } from "@/components/email/email-purchase-wizard";

export const metadata: Metadata = {
  title: "Purchase Email | DRAMAC",
  description: "Purchase business email for your domain",
};

export default function PurchaseEmailPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/email">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Purchase Business Email</h1>
          <p className="text-muted-foreground">
            Add professional email to your domain
          </p>
        </div>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Business Email Features
          </CardTitle>
          <CardDescription>
            Powered by Titan - Professional email for your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Custom Email Address</p>
                <p className="text-sm text-muted-foreground">
                  yourname@yourdomain.com
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">10GB Storage</p>
                <p className="text-sm text-muted-foreground">
                  Per email account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Webmail Access</p>
                <p className="text-sm text-muted-foreground">
                  Access from any browser
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Mobile Apps</p>
                <p className="text-sm text-muted-foreground">
                  iOS and Android support
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Calendar & Contacts</p>
                <p className="text-sm text-muted-foreground">
                  Built-in productivity tools
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Anti-Spam Protection</p>
                <p className="text-sm text-muted-foreground">
                  Built-in spam filtering
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Wizard */}
      <EmailPurchaseWizard />
    </div>
  );
}
