/**
 * Plan Comparison Table
 *
 * Phase BIL-02: Pricing Page Redesign
 *
 * Full-width feature comparison table grouped by category.
 * Shows all 3 tiers side by side with feature differences.
 */

"use client";

import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM } from "@/lib/constants/platform";

// ============================================================================
// Types
// ============================================================================

type FeatureValue = boolean | string | number;

interface ComparisonRow {
  label: string;
  starter: FeatureValue;
  growth: FeatureValue;
  agency: FeatureValue;
}

interface ComparisonGroup {
  name: string;
  rows: ComparisonRow[];
}

// ============================================================================
// Data
// ============================================================================

const COMPARISON_DATA: ComparisonGroup[] = [
  {
    name: "Scale",
    rows: [
      { label: "Websites", starter: "5", growth: "15", agency: "30" },
      { label: "Team members", starter: "3", growth: "8", agency: "20" },
      { label: "Client sites", starter: "5", growth: "15", agency: "30" },
    ],
  },
  {
    name: "Modules",
    rows: [
      { label: "CRM", starter: true, growth: true, agency: true },
      { label: "Booking", starter: true, growth: true, agency: true },
      { label: "E-Commerce", starter: true, growth: true, agency: true },
      { label: "Live Chat", starter: true, growth: true, agency: true },
      { label: "Social Media", starter: true, growth: true, agency: true },
      { label: "Automation", starter: true, growth: true, agency: true },
      { label: "Marketing", starter: true, growth: true, agency: true },
    ],
  },
  {
    name: "Metered Resources",
    rows: [
      {
        label: "AI actions/mo",
        starter: "1,000",
        growth: "3,000",
        agency: "15,000",
      },
      {
        label: "Email sends/mo",
        starter: "2,000",
        growth: "10,000",
        agency: "40,000",
      },
      {
        label: "Automation runs/mo",
        starter: "2,000",
        growth: "15,000",
        agency: "75,000",
      },
      {
        label: "File storage",
        starter: "5 GB",
        growth: "20 GB",
        agency: "75 GB",
      },
    ],
  },
  {
    name: "AI Features",
    rows: [
      {
        label: "Chiko AI assistant",
        starter: true,
        growth: true,
        agency: true,
      },
      {
        label: "AI website designer",
        starter: true,
        growth: true,
        agency: true,
      },
      { label: "AI content writer", starter: true, growth: true, agency: true },
      {
        label: "AI marketing intelligence",
        starter: true,
        growth: true,
        agency: true,
      },
    ],
  },
  {
    name: "Platform",
    rows: [
      { label: "Custom domains", starter: true, growth: true, agency: true },
      { label: `${PLATFORM.name} Studio`, starter: true, growth: true, agency: true },
      { label: "Client portal", starter: true, growth: true, agency: true },
      { label: "Free trial", starter: false, growth: "14 days", agency: false },
      { label: "API access", starter: true, growth: true, agency: true },
    ],
  },
  {
    name: "Support",
    rows: [
      { label: "Community support", starter: true, growth: true, agency: true },
      {
        label: "Priority email support",
        starter: false,
        growth: true,
        agency: true,
      },
      {
        label: "Priority + chat support",
        starter: false,
        growth: false,
        agency: true,
      },
    ],
  },
  {
    name: "Branding",
    rows: [
      {
        label: "White-label dashboard",
        starter: false,
        growth: false,
        agency: true,
      },
      {
        label: "Custom dashboard domain",
        starter: false,
        growth: false,
        agency: true,
      },
      {
        label: `Remove ${PLATFORM.name} branding`,
        starter: false,
        growth: false,
        agency: true,
      },
    ],
  },
];

// ============================================================================
// Component
// ============================================================================

function CellValue({ value }: { value: FeatureValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-green-500 mx-auto" />
    ) : (
      <Minus className="w-5 h-5 text-muted-foreground/40 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function PlanComparisonTable() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2">
            <th className="text-left py-4 px-4 w-[40%]" />
            <th className="text-center py-4 px-4 w-[20%]">
              <span className="text-lg font-bold">Starter</span>
            </th>
            <th className="text-center py-4 px-4 w-[20%] bg-primary/5 rounded-t-lg">
              <span className="text-lg font-bold text-primary">Growth</span>
            </th>
            <th className="text-center py-4 px-4 w-[20%]">
              <span className="text-lg font-bold">Agency</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((group) => (
            <>
              <tr key={`group-${group.name}`} className="border-b bg-muted/50">
                <td
                  colSpan={4}
                  className="py-3 px-4 font-semibold text-sm uppercase tracking-wide text-muted-foreground"
                >
                  {group.name}
                </td>
              </tr>
              {group.rows.map((row) => (
                <tr
                  key={`row-${row.label}`}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-sm">{row.label}</td>
                  <td className="py-3 px-4 text-center">
                    <CellValue value={row.starter} />
                  </td>
                  <td className={cn("py-3 px-4 text-center bg-primary/5")}>
                    <CellValue value={row.growth} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CellValue value={row.agency} />
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
