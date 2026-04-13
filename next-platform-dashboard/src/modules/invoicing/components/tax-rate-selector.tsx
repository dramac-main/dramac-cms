"use client";

import { useEffect, useState } from "react";
import type { TaxRate } from "../types";
import { getTaxRates } from "../actions/settings-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaxRateSelectorProps {
  siteId: string;
  value?: string | null;
  onChange: (taxRateId: string | null, rate: number) => void;
  disabled?: boolean;
}

export function TaxRateSelector({
  siteId,
  value,
  onChange,
  disabled,
}: TaxRateSelectorProps) {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTaxRates(siteId)
      .then((rates) => setTaxRates(rates.filter((r) => r.isActive !== false)))
      .catch(() => setTaxRates([]))
      .finally(() => setLoading(false));
  }, [siteId]);

  return (
    <Select
      value={value || "none"}
      onValueChange={(val) => {
        if (val === "none") {
          onChange(null, 0);
        } else {
          const rate = taxRates.find((r) => r.id === val);
          onChange(val, rate?.rate || 0);
        }
      }}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? "Loading…" : "No tax"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No tax</SelectItem>
        {taxRates.map((rate) => (
          <SelectItem key={rate.id} value={rate.id}>
            {rate.name} ({rate.rate}%)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
