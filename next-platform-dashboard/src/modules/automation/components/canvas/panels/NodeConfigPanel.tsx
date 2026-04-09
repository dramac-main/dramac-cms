/**
 * NodeConfigPanel — Right sidebar for editing the selected node's step properties.
 *
 * Phase 4: Canvas config panel. Wraps the existing step config logic
 * for use with the ReactFlow canvas, adapting to the selected node context.
 */

"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Info, AlertCircle, Copy, Trash2, Braces } from "lucide-react";
import { toast } from "sonner";
import { ACTION_REGISTRY } from "../../../lib/action-types";
import { VariablePicker } from "./VariablePicker";
import type {
  WorkflowStep,
  WorkflowStepUpdate,
  ConditionConfig,
  ConditionRule,
  DelayConfig,
  LoopConfig,
} from "../../../types/automation-types";

// ============================================================================
// TYPES
// ============================================================================

interface NodeConfigPanelProps {
  step: WorkflowStep;
  eventType?: string;
  onUpdate: (stepId: string, updates: WorkflowStepUpdate) => void;
  onDelete: (stepId: string) => void;
  onDuplicate?: (step: WorkflowStep) => void;
  onClose: () => void;
}

// ============================================================================
// CONDITION CONFIG SUB-COMPONENT
// ============================================================================

function ConditionSection({
  config,
  onUpdate,
}: {
  config: ConditionConfig;
  onUpdate: (config: ConditionConfig) => void;
}) {
  const conditions = config.conditions || [];
  const operator = config.operator || "and";

  const addCondition = () => {
    onUpdate({
      ...config,
      conditions: [...conditions, { field: "", operator: "equals", value: "" }],
    });
  };

  const updateCondition = (index: number, updates: Partial<ConditionRule>) => {
    const next = [...conditions];
    next[index] = { ...next[index], ...updates } as ConditionRule;
    onUpdate({ ...config, conditions: next });
  };

  const removeCondition = (index: number) => {
    onUpdate({
      ...config,
      conditions: conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Conditions</h4>
        <Select
          value={operator}
          onValueChange={(v) =>
            onUpdate({ ...config, operator: v as "and" | "or" })
          }
        >
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {conditions.map((cond, index) => (
        <div key={index} className="flex gap-1.5 items-start">
          <Input
            placeholder="{{trigger.status}}"
            value={cond.field || ""}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className="flex-1 h-8 text-xs"
          />
          <Select
            value={cond.operator || "equals"}
            onValueChange={(v) =>
              updateCondition(index, {
                operator: v as ConditionRule["operator"],
              })
            }
          >
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">≠</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="greater_than">&gt;</SelectItem>
              <SelectItem value="less_than">&lt;</SelectItem>
              <SelectItem value="is_empty">empty</SelectItem>
              <SelectItem value="is_not_empty">not empty</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Value"
            value={(cond.value as string) || ""}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            className="flex-1 h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(index)}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addCondition}
        className="w-full text-xs"
      >
        + Add Condition
      </Button>
    </div>
  );
}

// ============================================================================
// DELAY CONFIG SUB-COMPONENT
// ============================================================================

function DelaySection({
  config,
  onUpdate,
}: {
  config: DelayConfig;
  onUpdate: (config: DelayConfig) => void;
}) {
  const delayType = config.type || "fixed";
  const parseValue = (val?: string) => {
    if (!val) return { num: "5", unit: "m" };
    const match = val.match(/^(\d+)([smhd])$/);
    return match ? { num: match[1], unit: match[2] } : { num: "5", unit: "m" };
  };
  const { num, unit } = parseValue(config.value);

  return (
    <div className="space-y-3 pt-3 border-t">
      <h4 className="text-sm font-medium">Delay Settings</h4>
      <div className="space-y-2">
        <Label className="text-xs">Type</Label>
        <Select
          value={delayType}
          onValueChange={(v) =>
            onUpdate({ ...config, type: v as DelayConfig["type"] })
          }
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="until">Until Date/Time</SelectItem>
            <SelectItem value="expression">Dynamic Expression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {delayType === "fixed" && (
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={num}
            onChange={(e) =>
              onUpdate({ ...config, value: `${e.target.value}${unit}` })
            }
            className="w-20 h-8 text-xs"
          />
          <Select
            value={unit}
            onValueChange={(u) => onUpdate({ ...config, value: `${num}${u}` })}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="s">Seconds</SelectItem>
              <SelectItem value="m">Minutes</SelectItem>
              <SelectItem value="h">Hours</SelectItem>
              <SelectItem value="d">Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {delayType === "until" && (
        <Input
          type="datetime-local"
          value={config.value || ""}
          onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          className="h-8 text-xs"
        />
      )}

      {delayType === "expression" && (
        <Input
          placeholder="{{trigger.scheduled_date - 1d}}"
          value={config.value || ""}
          onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          className="h-8 text-xs font-mono"
        />
      )}
    </div>
  );
}

// ============================================================================
// LOOP CONFIG SUB-COMPONENT
// ============================================================================

function LoopSection({
  config,
  onUpdate,
}: {
  config: LoopConfig;
  onUpdate: (config: LoopConfig) => void;
}) {
  return (
    <div className="space-y-3 pt-3 border-t">
      <h4 className="text-sm font-medium">Loop Settings</h4>
      <div className="space-y-2">
        <Label className="text-xs">Source Array</Label>
        <Input
          placeholder="{{trigger.items}}"
          value={config.source || ""}
          onChange={(e) => onUpdate({ ...config, source: e.target.value })}
          className="h-8 text-xs font-mono"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Item Variable Name</Label>
        <Input
          placeholder="item"
          value={config.itemVariable || ""}
          onChange={(e) =>
            onUpdate({ ...config, itemVariable: e.target.value })
          }
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Max Iterations</Label>
        <Input
          type="number"
          min={1}
          max={1000}
          value={config.maxIterations || 100}
          onChange={(e) =>
            onUpdate({ ...config, maxIterations: Number(e.target.value) })
          }
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN NODE CONFIG PANEL
// ============================================================================

export function NodeConfigPanel({
  step,
  eventType,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}: NodeConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(step.action_config || {});
  const [lastStepId, setLastStepId] = useState(step.id);

  // Sync local config when step changes
  if (step.id !== lastStepId) {
    setLastStepId(step.id);
    setLocalConfig(step.action_config || {});
  }

  const handleConfigChange = (key: string, value: unknown) => {
    const next = { ...localConfig, [key]: value };
    setLocalConfig(next);
    onUpdate(step.id, { action_config: next });
  };

  // Resolve action definition from registry
  const getActionDef = () => {
    if (!step.action_type) return null;
    const parts = step.action_type.split(".");
    if (parts.length < 2) return null;
    const [category, action] = parts;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registry = ACTION_REGISTRY as any;
    return registry[category]?.[action] ?? null;
  };
  const actionDef = getActionDef();

  return (
    <div className="h-full flex flex-col border-l bg-background w-80">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold truncate">
          {step.name || step.action_type || step.step_type}
        </h3>
        <div className="flex items-center gap-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDuplicate(step)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(step.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="settings">
          <TabsList className="w-full justify-start rounded-none border-b px-3 h-9">
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
            <TabsTrigger value="mapping" className="text-xs">
              Data
            </TabsTrigger>
            <TabsTrigger value="errors" className="text-xs">
              Errors
            </TabsTrigger>
          </TabsList>

          {/* ---- Settings ---- */}
          <TabsContent value="settings" className="p-3 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={step.name || ""}
                onChange={(e) => onUpdate(step.id, { name: e.target.value })}
                placeholder="Step name..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Textarea
                value={String(step.description || "")}
                onChange={(e) =>
                  onUpdate(step.id, { description: e.target.value })
                }
                placeholder="What does this step do?"
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Enabled</Label>
              <Switch
                checked={step.is_active}
                onCheckedChange={(checked) => {
                  onUpdate(step.id, { is_active: checked })
                  toast.success(
                    checked
                      ? `"${step.name || 'Step'}" enabled — will run during execution`
                      : `"${step.name || 'Step'}" disabled — will be skipped during execution`,
                  )
                }}
              />
            </div>

            {/* Action-specific inputs from ACTION_REGISTRY */}
            {actionDef && (
              <div className="space-y-3 pt-3 border-t">
                <h4 className="text-xs font-medium">{actionDef.name}</h4>
                <p className="text-[11px] text-muted-foreground">
                  {actionDef.description}
                </p>

                {Object.entries(
                  (actionDef.inputs || {}) as Record<
                    string,
                    {
                      type: string;
                      required?: boolean;
                      default?: unknown;
                      values?: readonly string[];
                      placeholder?: string;
                    }
                  >,
                ).map(([key, inputCfg]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      {key.replace(/_/g, " ")}
                      {inputCfg.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>

                    {inputCfg.type === "string" && (
                      <div className="flex items-center gap-1">
                        <Input
                          value={
                            ((localConfig as Record<string, unknown>)[
                              key
                            ] as string) || ""
                          }
                          onChange={(e) =>
                            handleConfigChange(key, e.target.value)
                          }
                          placeholder={
                            inputCfg.placeholder ||
                            (inputCfg.default as string) ||
                            ""
                          }
                          className="h-8 text-xs"
                        />
                        <VariablePicker
                          eventType={eventType}
                          onInsert={(token) => {
                            const cur =
                              ((localConfig as Record<string, unknown>)[
                                key
                              ] as string) || "";
                            handleConfigChange(key, cur + token);
                          }}
                        />
                      </div>
                    )}

                    {inputCfg.type === "number" && (
                      <Input
                        type="number"
                        value={
                          ((localConfig as Record<string, unknown>)[
                            key
                          ] as number) ??
                          (inputCfg.default as number) ??
                          ""
                        }
                        onChange={(e) =>
                          handleConfigChange(key, Number(e.target.value))
                        }
                        className="h-8 text-xs"
                      />
                    )}

                    {inputCfg.type === "enum" && (
                      <Select
                        value={
                          ((localConfig as Record<string, unknown>)[
                            key
                          ] as string) || ""
                        }
                        onValueChange={(v) => handleConfigChange(key, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={`Select...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {inputCfg.values?.map((v: string) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {inputCfg.type === "boolean" && (
                      <Switch
                        checked={
                          ((localConfig as Record<string, unknown>)[
                            key
                          ] as boolean) || false
                        }
                        onCheckedChange={(c) => handleConfigChange(key, c)}
                      />
                    )}

                    {(inputCfg.type === "object" ||
                      inputCfg.type === "array") && (
                      <Textarea
                        value={JSON.stringify(
                          (localConfig as Record<string, unknown>)[key] ||
                            (inputCfg.type === "array" ? [] : {}),
                          null,
                          2,
                        )}
                        onChange={(e) => {
                          try {
                            handleConfigChange(key, JSON.parse(e.target.value));
                          } catch {
                            /* invalid JSON */
                          }
                        }}
                        rows={3}
                        className="text-xs font-mono"
                      />
                    )}

                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-2.5 w-2.5" />
                      Use the <Braces className="inline h-2.5 w-2.5" /> button
                      to insert variables
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Condition config */}
            {step.step_type === "condition" && (
              <ConditionSection
                config={step.condition_config || {}}
                onUpdate={(cfg) => onUpdate(step.id, { condition_config: cfg })}
              />
            )}

            {/* Delay config */}
            {step.step_type === "delay" && (
              <DelaySection
                config={step.delay_config || {}}
                onUpdate={(cfg) => onUpdate(step.id, { delay_config: cfg })}
              />
            )}

            {/* Loop config */}
            {step.step_type === "loop" && (
              <LoopSection
                config={step.loop_config || {}}
                onUpdate={(cfg) => onUpdate(step.id, { loop_config: cfg })}
              />
            )}
          </TabsContent>

          {/* ---- Data Mapping ---- */}
          <TabsContent value="mapping" className="p-3 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Input Mapping</Label>
              <p className="text-[10px] text-muted-foreground">
                Map trigger/step data to this step&apos;s inputs
              </p>
              <Textarea
                value={JSON.stringify(step.input_mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdate(step.id, {
                      input_mapping: JSON.parse(e.target.value),
                    });
                  } catch {
                    /* invalid JSON */
                  }
                }}
                placeholder={'{"email": "{{trigger.email}}"}'}
                rows={5}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Output Key</Label>
              <Input
                value={step.output_key || ""}
                onChange={(e) =>
                  onUpdate(step.id, { output_key: e.target.value })
                }
                placeholder="step_result"
                className="h-8 text-xs"
              />
            </div>
          </TabsContent>

          {/* ---- Error Handling ---- */}
          <TabsContent value="errors" className="p-3 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">On Error</Label>
              <Select
                value={step.on_error || "fail"}
                onValueChange={(v) =>
                  onUpdate(step.id, {
                    on_error: v as WorkflowStep["on_error"],
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fail">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-destructive" /> Stop
                      Workflow
                    </span>
                  </SelectItem>
                  <SelectItem value="continue">Skip &amp; Continue</SelectItem>
                  <SelectItem value="retry">Retry</SelectItem>
                  <SelectItem value="branch">Branch to Step</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.on_error === "retry" && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Max Retries</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={step.max_retries || 3}
                    onChange={(e) =>
                      onUpdate(step.id, {
                        max_retries: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={step.retry_delay_seconds || 10}
                    onChange={(e) =>
                      onUpdate(step.id, {
                        retry_delay_seconds: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}

            {step.on_error === "branch" && (
              <div className="space-y-2">
                <Label className="text-xs">Error Branch Step ID</Label>
                <Input
                  value={step.error_branch_step_id || ""}
                  onChange={(e) =>
                    onUpdate(step.id, {
                      error_branch_step_id: e.target.value,
                    })
                  }
                  placeholder="step-id"
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
