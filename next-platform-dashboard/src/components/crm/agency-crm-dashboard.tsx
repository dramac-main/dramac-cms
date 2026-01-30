"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Globe,
  ArrowRight,
  BarChart3,
  Filter,
  Plus
} from "lucide-react";
import { toast } from "sonner";

interface Site {
  id: string;
  name: string;
  subdomain: string | null;
  custom_domain: string | null;
}

interface AgencyCRMDashboardProps {
  agencyId: string;
  sites: Site[];
}

interface CRMStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  pipelineValue: number;
  dealsWonThisMonth: number;
  conversionRate: number;
}

export function AgencyCRMDashboard({ agencyId, sites }: AgencyCRMDashboardProps) {
  const router = useRouter();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CRMStats>({
    totalContacts: 0,
    totalCompanies: 0,
    totalDeals: 0,
    pipelineValue: 0,
    dealsWonThisMonth: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, [selectedSiteId, agencyId]);

  async function loadStats() {
    try {
      setLoading(true);
      // TODO: Implement agency-level CRM stats API
      // For now, show placeholder
      await new Promise(resolve => setTimeout(resolve, 500));
      setStats({
        totalContacts: 0,
        totalCompanies: 0,
        totalDeals: 0,
        pipelineValue: 0,
        dealsWonThisMonth: 0,
        conversionRate: 0,
      });
    } catch (error) {
      console.error("Failed to load CRM stats:", error);
      toast.error("Failed to load CRM statistics");
    } finally {
      setLoading(false);
    }
  }

  const handleSiteChange = (value: string) => {
    if (value === "all") {
      setSelectedSiteId("all");
    } else {
      // Redirect to site-specific CRM
      router.push(`/dashboard/${value}/crm`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description={
          selectedSiteId === "all"
            ? "Customer Relationship Management across all your sites"
            : "Customer Relationship Management for selected site"
        }
      >
        <div className="flex items-center gap-2">
          <Select value={selectedSiteId} onValueChange={handleSiteChange}>
            <SelectTrigger className="w-[250px]">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>All Sites ({sites.length})</span>
                </div>
              </SelectItem>
              {sites.map((site) => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* No Sites Warning */}
      {sites.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Globe className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Sites Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Create your first site to start using the CRM module. CRM data is organized by site.
              </p>
              <Button asChild>
                <Link href="/dashboard/sites/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Site
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Only show if we have sites */}
      {sites.length > 0 && (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.totalContacts}</div>
                <p className="text-xs text-muted-foreground">
                  Across {selectedSiteId === "all" ? `${sites.length} sites` : "selected site"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">
                  Business accounts tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "—" : stats.totalDeals}</div>
                <p className="text-xs text-muted-foreground">
                  In sales pipeline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "—" : `$${stats.pipelineValue.toLocaleString()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total deal value
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Site Access */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle>Getting Started with CRM</CardTitle>
                <CardDescription>
                  The CRM module helps you track contacts, companies, and deals for each of your sites.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Choose a Site</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the site selector above or click on a site below to access its CRM dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Auto-Initialization</h4>
                    <p className="text-sm text-muted-foreground">
                      The CRM automatically initializes with a sales pipeline when you first access it.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Start Managing</h4>
                    <p className="text-sm text-muted-foreground">
                      Add contacts, create companies, and track deals through your pipeline.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Sites */}
            <Card>
              <CardHeader>
                <CardTitle>Your Sites</CardTitle>
                <CardDescription>
                  Click on a site to access its CRM dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sites.slice(0, 5).map((site) => (
                    <Link
                      key={site.id}
                      href={`/dashboard/sites/${site.id}/crm`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{site.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {site.custom_domain || site.subdomain || "No domain"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}

                  {sites.length > 5 && (
                    <Link href="/dashboard/sites">
                      <Button variant="outline" className="w-full mt-2">
                        View All Sites ({sites.length})
                      </Button>
                    </Link>
                  )}

                  {sites.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No sites created yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Contact Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Store customer details, track communication history, and manage contact relationships across your business.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Company Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organize contacts by company, track business opportunities, and monitor account relationships.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">Sales Pipeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visual Kanban board to move deals through stages, track values, and forecast revenue.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
