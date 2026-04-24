import { notFound } from "next/navigation";
import { ArAgingReport } from "@/modules/invoicing/components/ar-aging-report";
import { CrossModuleReport } from "@/modules/invoicing/components/cross-module-report";
import { ExpenseReportView } from "@/modules/invoicing/components/expense-report";
import { PnlReport } from "@/modules/invoicing/components/pnl-report";
import { RevenueTrendsReport } from "@/modules/invoicing/components/revenue-trends-report";
import { TaxSummaryReport } from "@/modules/invoicing/components/tax-summary-report";
import { TopClientsReport } from "@/modules/invoicing/components/top-clients-report";

interface Props {
  params: Promise<{ report: string }>;
}

export default async function InvoicingReportPage({ params }: Props) {
  const { report } = await params;

  switch (report) {
    case "aging":
      return <ArAgingReport />;
    case "cross-module":
      return <CrossModuleReport />;
    case "expenses":
      return <ExpenseReportView />;
    case "pnl":
      return <PnlReport />;
    case "revenue":
      return <RevenueTrendsReport />;
    case "tax":
      return <TaxSummaryReport />;
    case "top-clients":
      return <TopClientsReport />;
    default:
      notFound();
  }
}
