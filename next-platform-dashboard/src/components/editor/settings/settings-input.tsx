"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingsInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url" | "color";
  className?: string;
}

export function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: SettingsInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}
