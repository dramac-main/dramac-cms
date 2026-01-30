"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type"> {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounceMs?: number;
  loading?: boolean;
  showShortcut?: boolean;
  shortcutKey?: string;
  inputSize?: "sm" | "default" | "lg";
}

const sizeStyles = {
  sm: "h-8 text-xs pl-8 pr-8",
  default: "h-10 text-sm pl-10 pr-10",
  lg: "h-12 text-base pl-12 pr-12",
};

const iconSizeStyles = {
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
};

const iconPositionStyles = {
  sm: "left-2.5",
  default: "left-3",
  lg: "left-4",
};

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value: controlledValue,
      onChange,
      onSearch,
      debounceMs = 300,
      loading,
      showShortcut = false,
      shortcutKey = "K",
      inputSize = "default",
      placeholder = "Search...",
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState("");
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;
    
    const debouncedValue = useDebounce(value, debounceMs);

    // Trigger onSearch when debounced value changes
    React.useEffect(() => {
      if (onSearch && debouncedValue !== undefined) {
        onSearch(debouncedValue);
      }
    }, [debouncedValue, onSearch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
        onChange?.(newValue);
      }
    };

    const handleClear = () => {
      if (isControlled) {
        onChange?.("");
      } else {
        setInternalValue("");
        onChange?.("");
      }
    };

    const showClearButton = value && !disabled && !loading;

    return (
      <div className="relative">
        {/* Search Icon */}
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground",
          iconPositionStyles[inputSize]
        )}>
          <Search className={iconSizeStyles[inputSize]} />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex w-full rounded-md border border-input bg-background ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-search-cancel-button]:hidden",
            sizeStyles[inputSize],
            className
          )}
          {...props}
        />

        {/* Right Side Content */}
        <div className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5",
          inputSize === "sm" && "right-2.5",
          inputSize === "lg" && "right-4"
        )}>
          {loading && (
            <Loader2 className={cn("animate-spin text-muted-foreground", iconSizeStyles[inputSize])} />
          )}
          
          {showClearButton && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className={iconSizeStyles[inputSize]} />
              <span className="sr-only">Clear search</span>
            </button>
          )}
          
          {showShortcut && !value && !loading && (
            <kbd className={cn(
              "hidden sm:inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 font-mono font-medium text-muted-foreground",
              inputSize === "sm" ? "text-[10px]" : "text-xs"
            )}>
              <span className="text-xs">⌘</span>
              {shortcutKey}
            </kbd>
          )}
        </div>
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };
