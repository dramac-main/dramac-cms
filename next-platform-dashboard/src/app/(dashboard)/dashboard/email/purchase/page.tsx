import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Check, Shield, Smartphone, Globe, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPurchaseWizard } from "@/components/email/email-purchase-wizard";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Purchase Email | ${PLATFORM.name}`,
  description: "Purchase business email for your domain",
};

const EMAIL_FEATURES = [
  {
    icon: Mail,
    title: "Custom Email Address",
    description: "yourname@yourdomain.com",
  },
  {
    icon: Lock,
    title: "10GB Storage",
    description: "Per mailbox with anti-spam protection",
  },
  {
    icon: Globe,
    title: "Webmail Access",
    description: "Access from any browser, anywhere",
  },
  {
    icon: Smartphone,
    title: "Mobile Apps",
    description: "iOS and Android support",
  },
  {
    icon: Calendar,
    title: "Calendar & Contacts",
    description: "Built-in productivity tools",
  },
  {
    icon: Shield,
    title: "Security & Encryption",
    description: "End-to-end encrypted email",
  },
];

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
            Professional email powered by Titan — trusted by millions worldwide
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Everything included in every plan</CardTitle>
          <CardDescription>
            All the tools you need for professional business communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EMAIL_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Wizard */}
      <EmailPurchaseWizard />
    </div>
  );
}
