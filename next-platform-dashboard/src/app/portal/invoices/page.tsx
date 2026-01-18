"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Construction } from "lucide-react";

export default function PortalInvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <p className="text-muted-foreground">
          View your billing history and download invoices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The invoices feature is currently being developed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invoice History</h3>
            <p className="text-muted-foreground max-w-md">
              Soon you&apos;ll be able to view your complete billing history, 
              download invoices, and manage your payment information here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
