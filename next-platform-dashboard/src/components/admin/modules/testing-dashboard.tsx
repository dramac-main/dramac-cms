"use client";

import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FlaskConical,
  Globe,
  Users,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Clock,
  ArrowRight,
  Settings,
  History,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TestSite } from "@/lib/modules/test-site-manager";
import type { BetaEnrollment, BetaTier } from "@/lib/modules/beta-program";
import type { TestRun, TestStatus } from "@/lib/modules/module-testing";

interface TestSiteStats {
  totalTestSites: number;
  activeTestSites: number;
  expiredTestSites: number;
  sitesWithBetaModules: number;
}

interface BetaStats {
  totalEnrollments: number;
  activeEnrollments: number;
  enrollmentsByTier: Record<BetaTier, number>;
  modulesWithBetaTesters: number;
}

interface TestStats {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  runsToday: number;
  passRate: number;
}

interface Props {
  testSites: TestSite[];
  testSiteStats: TestSiteStats;
  betaEnrollments: BetaEnrollment[];
  betaStats: BetaStats;
  recentTestRuns: TestRun[];
  testStats: TestStats;
}

function getStatusIcon(status: TestStatus) {
  switch (status) {
    case "passed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "error":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "running":
      return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusBadge(status: TestStatus) {
  const variants: Record<TestStatus, "default" | "destructive" | "secondary" | "outline"> = {
    passed: "default",
    failed: "destructive",
    error: "destructive",
    running: "secondary",
    pending: "outline",
  };

  return (
    <Badge variant={variants[status]} className="capitalize">
      {status}
    </Badge>
  );
}

function getBetaTierBadge(tier: BetaTier) {
  const styles: Record<BetaTier, string> = {
    internal: "border-red-500 text-red-500 bg-red-50 dark:bg-red-950",
    alpha: "border-orange-500 text-orange-500 bg-orange-50 dark:bg-orange-950",
    early_access: "border-yellow-500 text-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    standard: "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950",
  };

  const labels: Record<BetaTier, string> = {
    internal: "Internal",
    alpha: "Alpha",
    early_access: "Early Access",
    standard: "Standard",
  };

  return (
    <Badge variant="outline" className={styles[tier]}>
      {labels[tier]}
    </Badge>
  );
}

export function TestingDashboard({
  testSites,
  testSiteStats,
  betaEnrollments,
  betaStats,
  recentTestRuns,
  testStats,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8" />
            Module Testing
          </h1>
          <p className="text-muted-foreground">
            Manage test sites, beta programs, and run module tests
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/modules/testing/sites">
            <Button variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              Manage Test Sites
            </Button>
          </Link>
          <Link href="/admin/modules/testing/beta">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Beta Program
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Test Sites</p>
                <p className="text-2xl font-bold">{testSiteStats.activeTestSites}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {testSiteStats.sitesWithBetaModules} with beta modules
                </p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Beta Agencies</p>
                <p className="text-2xl font-bold">{betaStats.activeEnrollments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {betaStats.enrollmentsByTier.internal + betaStats.enrollmentsByTier.alpha} early
                  access
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tests Today</p>
                <p className="text-2xl font-bold">{testStats.runsToday}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {testStats.totalRuns} total runs
                </p>
              </div>
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
                <p className="text-2xl font-bold">{testStats.passRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {testStats.passedRuns} passed, {testStats.failedRuns} failed
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sites">Test Sites</TabsTrigger>
          <TabsTrigger value="beta">Beta Program</TabsTrigger>
          <TabsTrigger value="history">Test History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Test Runs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Test Runs</CardTitle>
                  <CardDescription>Latest module test results</CardDescription>
                </div>
                <Link href="/admin/modules/testing?tab=history">
                  <Button variant="ghost" size="sm">
                    View all <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentTestRuns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No test runs yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTestRuns.slice(0, 5).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(run.status)}
                          <div>
                            <p className="font-medium text-sm">
                              {run.moduleName || "Unknown Module"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {run.testType} test •{" "}
                              {formatDistanceToNow(new Date(run.startedAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(run.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common testing tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/modules/testing/sites" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Site
                  </Button>
                </Link>
                <Link href="/admin/modules/testing/beta" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Enroll Agency in Beta
                  </Button>
                </Link>
                <Link href="/admin/modules/studio" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Open Module Studio
                  </Button>
                </Link>
                <Link href="/admin/modules" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Module Management
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Test Summary by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Beta Program Distribution</CardTitle>
              <CardDescription>Agencies enrolled by tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-red-500">
                    {betaStats.enrollmentsByTier.internal}
                  </p>
                  <p className="text-sm text-muted-foreground">Internal</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">
                    {betaStats.enrollmentsByTier.alpha}
                  </p>
                  <p className="text-sm text-muted-foreground">Alpha</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-yellow-500">
                    {betaStats.enrollmentsByTier.early_access}
                  </p>
                  <p className="text-sm text-muted-foreground">Early Access</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">
                    {betaStats.enrollmentsByTier.standard}
                  </p>
                  <p className="text-sm text-muted-foreground">Standard</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Sites Tab */}
        <TabsContent value="sites" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Test Sites</CardTitle>
                <CardDescription>
                  Sites designated for testing pre-release modules
                </CardDescription>
              </div>
              <Link href="/admin/modules/testing/sites">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Site
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {testSites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test sites configured</p>
                  <p className="text-sm mt-1">
                    Designate sites to test pre-release modules
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Site</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testSites.map((site) => (
                      <TableRow key={site.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{site.siteName}</p>
                            <p className="text-sm text-muted-foreground">
                              {site.siteSlug}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{site.agencyName}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {site.testFeatures.slice(0, 2).map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature.replace("_", " ")}
                              </Badge>
                            ))}
                            {site.testFeatures.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{site.testFeatures.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={site.isActive ? "default" : "secondary"}>
                            {site.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(site.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/modules/testing/sites?edit=${site.siteId}`}>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beta Program Tab */}
        <TabsContent value="beta" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Beta Enrollments</CardTitle>
                <CardDescription>
                  Agencies enrolled in the beta testing program
                </CardDescription>
              </div>
              <Link href="/admin/modules/testing/beta">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll Agency
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {betaEnrollments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No agencies enrolled in beta</p>
                  <p className="text-sm mt-1">
                    Enroll agencies to give them access to testing modules
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agency</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Modules</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {betaEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <p className="font-medium">{enrollment.agencyName}</p>
                        </TableCell>
                        <TableCell>{getBetaTierBadge(enrollment.betaTier)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {enrollment.acceptedModules.length} modules
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(enrollment.enrolledAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/modules/testing/beta?edit=${enrollment.agencyId}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                Test execution history across all modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTestRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test history yet</p>
                  <p className="text-sm mt-1">
                    Run tests on modules to see results here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Run At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTestRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{run.moduleName || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">
                              v{run.moduleVersion}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {run.testType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {run.summary ? (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-500">
                                {run.summary.passed} passed
                              </span>
                              {run.summary.failed > 0 && (
                                <span className="text-red-500">
                                  {run.summary.failed} failed
                                </span>
                              )}
                              {run.summary.warnings > 0 && (
                                <span className="text-yellow-500">
                                  {run.summary.warnings} warnings
                                </span>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {run.summary ? `${run.summary.duration}ms` : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDistanceToNow(new Date(run.startedAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
