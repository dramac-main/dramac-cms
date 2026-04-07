/**
 * WorkflowSettingsPanel — Right sidebar for editing workflow-level metadata.
 *
 * Phase 4: Canvas workflow settings. Shows when no node is selected
 * and the user clicks a "settings" button, or via keyboard shortcut.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Settings, Palette, Shield } from "lucide-react";
import type { Workflow, WorkflowUpdate } from "../../../types/automation-types";

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowSettingsPanelProps {
  workflow: Workflow;
  onUpdate: (updates: WorkflowUpdate) => void;
  onClose: () => void;
}

// ============================================================================
// COLOR OPTIONS
// ============================================================================

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
];

const CATEGORY_OPTIONS = [
  "communication",
  "crm",
  "ecommerce",
  "booking",
  "marketing",
  "operations",
  "custom",
];

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkflowSettingsPanel({
  workflow,
  onUpdate,
  onClose,
}: WorkflowSettingsPanelProps) {
  return (
    <div className="h-full flex flex-col border-l bg-background w-80">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Workflow Settings
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-5">
          {/* ---- General ---- */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              General
            </h4>

            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={workflow.name || ""}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="Workflow name"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={workflow.description || ""}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Describe what this workflow does..."
                rows={3}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Select
                value={workflow.category || "custom"}
                onValueChange={(v) => onUpdate({ category: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tags</Label>
              <Input
                value={(workflow.tags || []).join(", ")}
                onChange={(e) =>
                  onUpdate({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="tag1, tag2, tag3"
                className="h-8 text-xs"
              />
            </div>
          </section>

          {/* ---- Appearance ---- */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Palette className="h-3 w-3" /> Appearance
            </h4>

            <div className="space-y-2">
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onUpdate({ color: c.value })}
                    className={`h-6 w-6 rounded-full ${c.class} ${
                      workflow.color === c.value
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "opacity-60 hover:opacity-100"
                    } transition-all`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <Input
                value={workflow.icon || ""}
                onChange={(e) => onUpdate({ icon: e.target.value })}
                placeholder="Icon name (e.g. zap, mail)"
                className="h-8 text-xs"
              />
            </div>
          </section>

          {/* ---- Execution ---- */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" /> Execution
            </h4>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Active</Label>
                <p className="text-[10px] text-muted-foreground">
                  Workflow processes events when active
                </p>
              </div>
              <Switch
                checked={workflow.is_active}
                onCheckedChange={(checked) => onUpdate({ is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Run Once</Label>
                <p className="text-[10px] text-muted-foreground">
                  Only execute once per unique trigger
                </p>
              </div>
              <Switch
                checked={workflow.run_once}
                onCheckedChange={(checked) => onUpdate({ run_once: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Max Runs/Hour</Label>
              <Input
                type="number"
                min={0}
                max={10000}
                value={workflow.max_executions_per_hour || 100}
                onChange={(e) =>
                  onUpdate({
                    max_executions_per_hour: Number(e.target.value),
                  })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Timeout (seconds)</Label>
              <Input
                type="number"
                min={10}
                max={3600}
                value={workflow.timeout_seconds || 300}
                onChange={(e) =>
                  onUpdate({ timeout_seconds: Number(e.target.value) })
                }
                className="h-8 text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Retry on Failure</Label>
                <p className="text-[10px] text-muted-foreground">
                  Auto-retry the workflow on error
                </p>
              </div>
              <Switch
                checked={workflow.retry_on_failure}
                onCheckedChange={(checked) =>
                  onUpdate({ retry_on_failure: checked })
                }
              />
            </div>

            {workflow.retry_on_failure && (
              <div className="space-y-2">
                <Label className="text-xs">Max Retries</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={workflow.max_retries || 3}
                  onChange={(e) =>
                    onUpdate({ max_retries: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
              </div>
            )}
          </section>

          {/* ---- Stats (read-only) ---- */}
          {workflow.total_runs > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stats
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Total Runs</div>
                  <div className="font-medium">{workflow.total_runs}</div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Successful</div>
                  <div className="font-medium text-green-500">
                    {workflow.successful_runs}
                  </div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Failed</div>
                  <div className="font-medium text-destructive">
                    {workflow.failed_runs}
                  </div>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-muted-foreground">Last Run</div>
                  <div className="font-medium truncate">
                    {workflow.last_run_at
                      ? new Date(workflow.last_run_at).toLocaleDateString()
                      : "Never"}
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
