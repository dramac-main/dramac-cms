"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface TextareaWithCounterProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  showCount?: boolean;
  countType?: "characters" | "words";
  warningThreshold?: number; // Percentage (e.g., 90 for 90%)
  error?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const TextareaWithCounter = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(
  (
    {
      className,
      maxLength,
      showCount = true,
      countType = "characters",
      warningThreshold = 90,
      error,
      autoResize = false,
      minRows = 3,
      maxRows = 10,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue?.toString() || "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value?.toString() || "" : internalValue;
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Calculate counts
    const charCount = currentValue.length;
    const wordCount = countWords(currentValue);
    const currentCount = countType === "characters" ? charCount : wordCount;
    
    // Calculate warning state
    const isNearLimit = maxLength
      ? (charCount / maxLength) * 100 >= warningThreshold
      : false;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    // Auto-resize logic
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const minHeight = minRows * lineHeight;
        const maxHeight = maxRows * lineHeight;

        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
      }
    }, [currentValue, autoResize, minRows, maxRows]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      
      onChange?.(e);
    };

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    return (
      <div className="relative">
        <textarea
          ref={mergedRef}
          value={currentValue}
          onChange={handleChange}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "resize-y",
            autoResize && "resize-none overflow-hidden",
            (error || isOverLimit) && "border-danger focus-visible:ring-danger",
            isNearLimit && !isOverLimit && "border-warning focus-visible:ring-warning",
            showCount && "pb-7",
            className
          )}
          {...props}
        />

        {/* Counter */}
        {showCount && (
          <div className={cn(
            "absolute bottom-2 right-3 flex items-center gap-1.5 text-xs",
            isOverLimit ? "text-danger" : isNearLimit ? "text-warning" : "text-muted-foreground"
          )}>
            {isOverLimit && (
              <AlertCircle className="h-3 w-3" />
            )}
            <span className="tabular-nums">
              {currentCount.toLocaleString()}
              {maxLength && (
                <>
                  <span className="mx-0.5">/</span>
                  {maxLength.toLocaleString()}
                </>
              )}
              {countType === "words" && (
                <span className="ml-1">
                  {currentCount === 1 ? "word" : "words"}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  }
);
TextareaWithCounter.displayName = "TextareaWithCounter";

export { TextareaWithCounter };
