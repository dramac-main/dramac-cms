"use client";

/**
 * ReportHub — Reports landing page with card links to each report
 *
 * Phase INV-07 + INVFIX-08: Financial Dashboard + Reports Overhaul
 * Added: Cross-module report card, report categorization.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BarChart3,
  PieChart,
  CreditCard,
  Clock,
  Receipt,
  Users,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACCOUNTING_REPORTS = [
  {
    title: "Profit & Loss",
    description: "Income vs expenses breakdown with net profit margin",
    href: "reports/pnl",
    icon: BarChart3,
    color: "text-blue-600",
  },
  {
    title: "Accounts Receivable Aging",
    description: "Outstanding invoices grouped by days overdue",
    href: "reports/aging",
    icon: Clock,
    color: "text-yellow-600",
  },
  {
    title: "Tax Summary",
    description: "Tax collected vs tax paid with net liability",
    href: "reports/tax",
    icon: Receipt,
    color: "text-purple-600",
  },
  {
    title: "Expense Report",
    description: "Expenses by category, vendor, and time period",
    href: "reports/expenses",
    icon: CreditCard,
    color: "text-red-600",
  },
];

const INSIGHT_REPORTS = [
  {
    title: "Top Clients",
    description: "Clients ranked by revenue contribution",
    href: "reports/top-clients",
    icon: Users,
    color: "text-green-600",
  },
  {
    title: "Revenue Trends",
    description:
      "Revenue over time with invoiced, collected, and expense lines",
    href: "reports/revenue",
    icon: PieChart,
    color: "text-indigo-600",
  },
  {
    title: "Cross-Module Revenue",
    description:
      "Unified revenue from invoicing, e-commerce, and bookings with client activity",
    href: "reports/cross-module",
    icon: Globe,
    color: "text-cyan-600",
  },
];

export function ReportHub() {
  const params = useParams();
  const siteId = params?.siteId as string;
  const basePath = `/dashboard/sites/${siteId}/invoicing`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate and export detailed financial reports
        </p>
      </div>

      {/* Accounting Reports */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Accounting
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ACCOUNTING_REPORTS.map((report) => (
            <Link key={report.href} href={`${basePath}/${report.href}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Insight Reports */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-muted-foreground">
          Insights
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INSIGHT_REPORTS.map((report) => (
            <Link key={report.href} href={`${basePath}/${report.href}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <report.icon className={`h-5 w-5 ${report.color}`} />
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
