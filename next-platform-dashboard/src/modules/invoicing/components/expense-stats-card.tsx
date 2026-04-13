"use client";

import { useState, useEffect } from "react";
import {
  getExpenseStats,
  type ExpenseStats,
} from "../actions/expense-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceAmount } from "../lib/invoicing-utils";
import { DollarSign, Clock, CheckCircle } from "lucide-react";

interface ExpenseStatsCardProps {
  siteId: string;
}

export function ExpenseStatsCard({ siteId }: ExpenseStatsCardProps) {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpenseStats(siteId)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Expenses",
      value: formatInvoiceAmount(stats.totalAmount, "ZMW"),
      sub: `${stats.expenseCount} expense(s)`,
      icon: DollarSign,
    },
    {
      label: "Approved",
      value: formatInvoiceAmount(stats.totalApproved, "ZMW"),
      sub: "Approved & paid",
      icon: CheckCircle,
    },
    {
      label: "Pending",
      value: formatInvoiceAmount(stats.totalPending, "ZMW"),
      sub: "Awaiting approval",
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.sub}
                </p>
              </div>
              <card.icon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
