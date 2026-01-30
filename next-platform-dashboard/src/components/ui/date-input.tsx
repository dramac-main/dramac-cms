"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format, isValid, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface DateInputProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  dateFormat?: string;
  className?: string;
}

const DateInput = React.forwardRef<HTMLButtonElement, DateInputProps>(
  (
    {
      value,
      onChange,
      placeholder = "Select date",
      disabled = false,
      error = false,
      clearable = true,
      minDate,
      maxDate,
      dateFormat: _dateFormat = "PPP", // "January 29, 2026"
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    // Sync input value with actual value
    React.useEffect(() => {
      if (value && isValid(value)) {
        setInputValue(format(value, "MM/dd/yyyy"));
      } else {
        setInputValue("");
      }
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Try to parse the input
      const parsed = parse(newValue, "MM/dd/yyyy", new Date());
      if (isValid(parsed)) {
        // Check bounds
        if (minDate && parsed < minDate) return;
        if (maxDate && parsed > maxDate) return;
        onChange?.(parsed);
      }
    };

    const handleSelectDate = (date: Date | undefined) => {
      if (date) {
        onChange?.(date);
        setOpen(false);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(null);
      setInputValue("");
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-10 px-3",
                !value && "text-muted-foreground",
                error && "border-danger focus-visible:ring-danger",
                className
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="flex-1 bg-transparent border-none outline-none p-0 text-sm placeholder:text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              />
            </Button>
          </PopoverTrigger>
          
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Clear date</span>
            </button>
          )}
        </div>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={handleSelectDate}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DateInput.displayName = "DateInput";

// Date Range Input
export interface DateRangeInputProps {
  value?: { from: Date | null; to: Date | null };
  onChange?: (range: { from: Date | null; to: Date | null }) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export function DateRangeInput({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  error = false,
  clearable = true,
  minDate,
  maxDate,
  className,
}: DateRangeInputProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    onChange?.({
      from: range?.from ?? null,
      to: range?.to ?? null,
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ from: null, to: null });
  };

  const displayValue = React.useMemo(() => {
    if (!value?.from) return null;
    if (!value.to) return format(value.from, "LLL dd, y");
    return `${format(value.from, "LLL dd, y")} - ${format(value.to, "LLL dd, y")}`;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !displayValue && "text-muted-foreground",
              error && "border-danger focus-visible:ring-danger",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">
              {displayValue || placeholder}
            </span>
          </Button>
        </PopoverTrigger>

        {clearable && displayValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Clear dates</span>
          </button>
        )}
      </div>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from ?? undefined}
          selected={{
            from: value?.from ?? undefined,
            to: value?.to ?? undefined,
          }}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export { DateInput };
