"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users } from "lucide-react";

interface RevenueCalculatorProps {
  wholesalePriceCents: number;
  clientPriceCents: number;
  clientCount?: number;
}

export function RevenueCalculator({ 
  wholesalePriceCents, 
  clientPriceCents, 
  clientCount = 10 
}: RevenueCalculatorProps) {
  const calculations = useMemo(() => {
    const wholesaleMonthly = wholesalePriceCents / 100;
    const clientMonthly = clientPriceCents / 100;
    const profitPerClient = clientMonthly - wholesaleMonthly;
    
    return {
      wholesaleMonthly,
      clientMonthly,
      profitPerClient,
      monthlyRevenue: clientMonthly * clientCount,
      monthlyProfit: profitPerClient * clientCount,
      yearlyRevenue: clientMonthly * clientCount * 12,
      yearlyProfit: profitPerClient * clientCount * 12,
      profitMargin: wholesaleMonthly > 0 
        ? ((profitPerClient / wholesaleMonthly) * 100).toFixed(1) 
        : '100',
    };
  }, [wholesalePriceCents, clientPriceCents, clientCount]);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Revenue Calculator ({clientCount} Clients)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Revenue</p>
              <p className="text-lg font-semibold">
                ${calculations.monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly Revenue</p>
              <p className="text-lg font-semibold">
                ${calculations.yearlyRevenue.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Profit</p>
              <p className="text-lg font-semibold text-green-600">
                ${calculations.monthlyProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Yearly Profit</p>
              <p className="text-lg font-semibold text-green-600">
                ${calculations.yearlyProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-primary/20">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profit Margin</span>
            <span className="font-semibold text-green-600">
              {calculations.profitMargin}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Profit per Client</span>
            <span className="font-semibold">
              ${calculations.profitPerClient.toFixed(2)}/mo
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
