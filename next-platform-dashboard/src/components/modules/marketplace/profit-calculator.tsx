"use client";

import { useState } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfitCalculatorProps {
  wholesalePrice: number; // in cents
  suggestedRetail: number; // in cents
}

export function ProfitCalculator({ wholesalePrice, suggestedRetail }: ProfitCalculatorProps) {
  const [markup, setMarkup] = useState(100); // 100% markup default
  const [numClients, setNumClients] = useState(10);

  const wholesale = wholesalePrice / 100;
  const retailPrice = wholesale + (wholesale * markup / 100);
  const profit = retailPrice - wholesale;
  
  const monthlyRevenue = retailPrice * numClients;
  const monthlyProfit = profit * numClients;
  const yearlyProfit = monthlyProfit * 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Profit Calculator
        </CardTitle>
        <CardDescription>
          See how much you can earn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Markup Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Markup Percentage</Label>
            <span className="font-medium">{markup}%</span>
          </div>
          <Slider
            value={[markup]}
            onValueChange={(value) => setMarkup(value[0])}
            min={0}
            max={300}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>150%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Number of Clients */}
        <div className="space-y-2">
          <Label>Number of Clients</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={numClients}
            onChange={(e) => setNumClients(parseInt(e.target.value) || 1)}
          />
        </div>

        {/* Price Breakdown */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Your Cost (wholesale)</span>
            <span>${wholesale.toFixed(2)}/mo</span>
          </div>
          <div className="flex justify-between">
            <span>Your Price to Clients</span>
            <span className="font-medium">${retailPrice.toFixed(2)}/mo</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Profit per Client</span>
            <span className="font-medium">${profit.toFixed(2)}/mo</span>
          </div>
        </div>

        {/* Projections */}
        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            With {numClients} Clients
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Monthly Profit</p>
              <p className="text-lg font-bold text-green-600">
                ${monthlyProfit.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Yearly Profit</p>
              <p className="text-lg font-bold text-green-600">
                ${yearlyProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
