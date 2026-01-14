"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const presetColors = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

interface SettingsColorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SettingsColor({
  label,
  value,
  onChange,
  className,
}: SettingsColorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start h-9"
          >
            <div
              className="h-4 w-4 rounded border mr-2"
              style={{ backgroundColor: value || "#ffffff" }}
            />
            {value || "Select color"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "h-8 w-8 rounded border-2 transition-all",
                    value === color
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onChange(color);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="h-9"
              />
              <Input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 w-12 p-1 cursor-pointer"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
