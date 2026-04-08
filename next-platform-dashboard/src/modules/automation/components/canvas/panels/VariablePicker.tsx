"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Braces } from "lucide-react";
import {
  getEventVariables,
  type EventVariable,
} from "../../../lib/event-types";

interface VariablePickerProps {
  eventType: string | undefined;
  onInsert: (token: string) => void;
}

export function VariablePicker({ eventType, onInsert }: VariablePickerProps) {
  const [open, setOpen] = useState(false);
  const variables = eventType ? getEventVariables(eventType) : [];

  if (!variables.length) return null;

  function handleSelect(v: EventVariable) {
    onInsert(`{{trigger.${v.key}}}`);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          title="Insert variable"
        >
          <Braces className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        side="left"
        align="start"
      >
        <div className="px-3 py-2 border-b">
          <p className="text-xs font-medium">Trigger Variables</p>
        </div>
        <ScrollArea className="max-h-56">
          <div className="p-1">
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-left"
                onClick={() => handleSelect(v)}
              >
                <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
                  {`{{trigger.${v.key}}}`}
                </code>
                <span className="text-muted-foreground truncate ml-auto text-[10px]">
                  {v.label}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
