"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, DollarSign, ArrowRight } from "lucide-react";

interface SiteCRMTabProps {
  siteId: string;
}

export function SiteCRMTab({ siteId }: SiteCRMTabProps) {
  return (
    <div className="space-y-6">
      {/* CRM Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Relationship Management</CardTitle>
          <CardDescription>
            Manage contacts, companies, and deals for this site. Track your sales pipeline and grow your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/dashboard/${siteId}/crm`}>
            <Button size="lg" className="w-full sm:w-auto">
              Open CRM Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* CRM Features Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Contacts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Store and manage all your customer contacts in one place. Track communication history and notes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Companies</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Organize contacts by company. Track company details, relationships, and business opportunities.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">Deals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your sales pipeline. Track deal progress, values, and close dates through customizable stages.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              1
            </div>
            <div>
              <h4 className="font-medium mb-1">Open CRM Dashboard</h4>
              <p className="text-sm text-muted-foreground">
                Click the button above to access your CRM. It will automatically initialize with a default sales pipeline.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              2
            </div>
            <div>
              <h4 className="font-medium mb-1">Add Your First Contact</h4>
              <p className="text-sm text-muted-foreground">
                Start building your contact database. Add customer information, notes, and communication history.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              3
            </div>
            <div>
              <h4 className="font-medium mb-1">Create Deals</h4>
              <p className="text-sm text-muted-foreground">
                Track sales opportunities through your pipeline. Monitor deal progress from Lead to Won.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
              4
            </div>
            <div>
              <h4 className="font-medium mb-1">Customize Your Pipeline</h4>
              <p className="text-sm text-muted-foreground">
                Create custom pipelines and stages that match your sales process. Set probabilities and track metrics.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
