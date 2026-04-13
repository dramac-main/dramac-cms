"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RECURRING_FREQUENCY_LABELS } from "../lib/invoicing-constants";
import type { RecurringFrequency } from "../types/recurring-types";

interface FrequencySelectorProps {
  frequency: RecurringFrequency;
  customIntervalDays: number | null;
  onFrequencyChange: (frequency: RecurringFrequency) => void;
  onCustomIntervalChange: (days: number | null) => void;
}

export function FrequencySelector({
  frequency,
  customIntervalDays,
  onFrequencyChange,
  onCustomIntervalChange,
}: FrequencySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Frequency</Label>
        <Select
          value={frequency}
          onValueChange={(v) => onFrequencyChange(v as RecurringFrequency)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {(
              Object.entries(RECURRING_FREQUENCY_LABELS) as [
                RecurringFrequency,
                string,
              ][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {frequency === "custom" && (
        <div className="space-y-1.5">
          <Label>Custom Interval (days)</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={customIntervalDays || ""}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : null;
              onCustomIntervalChange(val);
            }}
            placeholder="e.g. 45"
          />
        </div>
      )}
    </div>
  );
}
