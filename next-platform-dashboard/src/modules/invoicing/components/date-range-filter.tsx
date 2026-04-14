"use client";

/**
 * DateRangeFilter — Reusable date range picker with presets
 *
 * Phase INV-07: Financial Dashboard
 * Presets: This Month, Last Month, This Quarter, This Year, Custom
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";
import type { DateRange, DateRangePreset } from "../types/report-types";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function getPresetRange(preset: DateRangePreset): {
  start: string;
  end: string;
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case "this_month":
      return {
        start: new Date(year, month, 1).toISOString().split("T")[0],
        end: new Date(year, month + 1, 0).toISOString().split("T")[0],
      };
    case "last_month":
      return {
        start: new Date(year, month - 1, 1).toISOString().split("T")[0],
        end: new Date(year, month, 0).toISOString().split("T")[0],
      };
    case "this_quarter": {
      const qStart = Math.floor(month / 3) * 3;
      return {
        start: new Date(year, qStart, 1).toISOString().split("T")[0],
        end: new Date(year, qStart + 3, 0).toISOString().split("T")[0],
      };
    }
    case "this_year":
      return {
        start: new Date(year, 0, 1).toISOString().split("T")[0],
        end: new Date(year, 11, 31).toISOString().split("T")[0],
      };
    case "last_year":
      return {
        start: new Date(year - 1, 0, 1).toISOString().split("T")[0],
        end: new Date(year - 1, 11, 31).toISOString().split("T")[0],
      };
    case "custom":
    default:
      return {
        start: new Date(year, 0, 1).toISOString().split("T")[0],
        end: new Date(year, 11, 31).toISOString().split("T")[0],
      };
  }
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  last_year: "Last Year",
  custom: "Custom Range",
};

export function getDefaultDateRange(): DateRange {
  const range = getPresetRange("this_year");
  return { ...range, preset: "this_year" };
}

export function DateRangeFilter({
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.preset === "custom");

  const handlePresetChange = useCallback(
    (preset: string) => {
      const p = preset as DateRangePreset;
      if (p === "custom") {
        setShowCustom(true);
        onChange({ ...value, preset: "custom" });
      } else {
        setShowCustom(false);
        const range = getPresetRange(p);
        onChange({ ...range, preset: p });
      }
    },
    [onChange, value],
  );

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, start: e.target.value, preset: "custom" });
    },
    [onChange, value],
  );

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, end: e.target.value, preset: "custom" });
    },
    [onChange, value],
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value.preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRESET_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCustom && (
        <>
          <Input
            type="date"
            value={value.start}
            onChange={handleStartChange}
            className="w-[150px]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={value.end}
            onChange={handleEndChange}
            className="w-[150px]"
          />
        </>
      )}
    </div>
  );
}
