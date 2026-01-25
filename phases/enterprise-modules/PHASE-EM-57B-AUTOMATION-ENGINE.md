# Phase EM-57B: Automation Engine - Visual Builder & Advanced Features

> **Priority**: 🔴 CRITICAL (Platform Game-Changer)
> **Estimated Time**: 2-3 weeks
> **Prerequisites**: EM-57A (Core Infrastructure)
> **Status**: 📋 READY TO IMPLEMENT
> **Module Type**: System
> **Phase Split**: This is Part B of 2 (Visual Builder & Advanced Features)

---

## ⚠️ CRITICAL IMPLEMENTATION NOTES

Before implementing, ensure the following:

### Required Dependencies (add to package.json)

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "recharts": "^2.15.0"
  }
}
```

### Platform Patterns to Follow

1. **Components**: All components use `"use client"` directive at the top
2. **Server Actions**: Import from `@/modules/automation/actions/workflow-actions`
3. **UI Components**: Use shadcn/ui from `@/components/ui/*`
4. **Toast Notifications**: Use `toast` from `sonner`
5. **Module Pattern**: Follow `src/modules/automation/` structure like CRM/Booking/Ecommerce

### File Location Convention

```
src/modules/automation/           # NOT src/components/automation/
├── actions/                      # Server actions
├── components/                   # UI components  
│   └── workflow-builder/         # Builder components
├── context/                      # React contexts
├── hooks/                        # Custom hooks
├── lib/                          # Utilities & registries
├── types/                        # TypeScript types
└── index.ts                      # Module exports
```

---

## 📋 Document Overview

This is **Part B** of the Automation Engine specification. It covers:

| Part A (EM-57A) | Part B (This Document) |
|-----------------|------------------------|
| ✅ Database Schema | ✅ Visual Workflow Builder UI |
| ✅ Event Bus System | ✅ Advanced Action Library |
| ✅ Execution Engine | ✅ Workflow Templates |
| ✅ Core Triggers | ✅ External Tool Integrations |
| ✅ Core Actions | ✅ Analytics Dashboard |
| ✅ Server Actions | ✅ AI-Powered Suggestions |
| ✅ Background Workers | ✅ Marketplace Templates |

---

## 🎨 Visual Workflow Builder

### Builder Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     VISUAL WORKFLOW BUILDER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  TRIGGER PANEL   │  │           WORKFLOW CANVAS                │ │
│  │                  │  │                                          │ │
│  │  📩 Event        │  │    ┌─────┐                               │ │
│  │  ⏰ Schedule     │  │    │Start│                               │ │
│  │  🌐 Webhook      │  │    └──┬──┘                               │ │
│  │  👆 Manual       │  │       │                                  │ │
│  │                  │  │       ▼                                  │ │
│  ├──────────────────┤  │  ┌─────────┐                            │ │
│  │  ACTION PALETTE  │  │  │ Step 1  │                            │ │
│  │                  │  │  └────┬────┘                            │ │
│  │  📧 Email        │  │       │                                  │ │
│  │  💬 Slack        │  │       ▼                                  │ │
│  │  📱 SMS          │  │  ┌─────────┐   ┌─────────┐              │ │
│  │  👤 CRM          │  │  │Condition├───┤ Branch  │              │ │
│  │  🗄️ Data         │  │  └────┬────┘   └─────────┘              │ │
│  │  🌐 Webhook      │  │       │                                  │ │
│  │  ⏱️ Delay        │  │       ▼                                  │ │
│  │  🔀 Condition    │  │  ┌─────────┐                            │ │
│  │  🔁 Loop         │  │  │ Step 2  │                            │ │
│  │                  │  │  └────┬────┘                            │ │
│  └──────────────────┘  │       │                                  │ │
│                        │       ▼                                  │ │
│  ┌──────────────────┐  │    ┌─────┐                               │ │
│  │  STEP CONFIG     │  │    │ End │                               │ │
│  │  (Right Panel)   │  │    └─────┘                               │ │
│  │                  │  │                                          │ │
│  │  Configure the   │  └──────────────────────────────────────────┘ │
│  │  selected step   │                                               │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Main Builder Component

```tsx
// src/modules/automation/components/workflow-builder/workflow-builder.tsx

"use client";

import { useState, useCallback, useRef } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

import { TriggerPanel } from "./trigger-panel";
import { ActionPalette } from "./action-palette";
import { WorkflowCanvas } from "./workflow-canvas";
import { StepConfigPanel } from "./step-config-panel";
import { useWorkflowBuilder } from "../../hooks/use-workflow-builder";
import type { WorkflowStep, WorkflowTrigger } from "../../types/automation";

interface WorkflowBuilderProps {
  workflowId?: string;
  siteId: string;
  onSave?: (workflow: any) => void;
}

export function WorkflowBuilder({ workflowId, siteId, onSave }: WorkflowBuilderProps) {
  const {
    workflow,
    steps,
    selectedStep,
    isDirty,
    isLoading,
    setTrigger,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    selectStep,
    saveWorkflow,
  } = useWorkflowBuilder(workflowId, siteId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dropping from palette onto canvas
    if (active.data.current?.type === "palette-item" && over.id === "canvas") {
      const actionType = active.data.current.actionType;
      addStep({
        step_type: "action",
        action_type: actionType,
        name: active.data.current.name,
      });
    }

    // Check if reordering steps
    if (active.data.current?.type === "step" && over.data.current?.type === "step") {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      if (oldIndex !== newIndex) {
        reorderSteps(oldIndex, newIndex);
      }
    }
  }, [steps, addStep, reorderSteps]);

  const handleSave = async () => {
    try {
      await saveWorkflow();
      toast.success("Workflow saved successfully");
      onSave?.(workflow);
    } catch (error) {
      toast.error("Failed to save workflow");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={workflow?.name || "Untitled Workflow"}
              onChange={(e) => {
                /* Update workflow name */
              }}
              className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2"
            />
            {isDirty && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Test Run
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty}>
              Save Workflow
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Trigger & Actions */}
          <div className="w-64 border-r flex flex-col overflow-y-auto">
            <TriggerPanel
              trigger={workflow?.trigger_config}
              onTriggerChange={setTrigger}
            />
            <ActionPalette />
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-muted/30" ref={canvasRef}>
            <WorkflowCanvas
              steps={steps}
              selectedStepId={selectedStep?.id}
              onStepClick={selectStep}
              onStepDelete={deleteStep}
            />
          </div>

          {/* Right Sidebar - Step Config */}
          {selectedStep && (
            <div className="w-80 border-l overflow-y-auto">
              <StepConfigPanel
                step={selectedStep}
                onUpdate={updateStep}
                onClose={() => selectStep(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && (
          <Card className="p-3 shadow-lg opacity-80">
            <span className="text-sm">Dragging...</span>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

### Trigger Panel Component

```tsx
// src/modules/automation/components/workflow-builder/trigger-panel.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EVENT_REGISTRY } from "../../lib/event-types";

interface TriggerPanelProps {
  trigger?: {
    type: string;
    config: Record<string, unknown>;
  };
  onTriggerChange: (trigger: { type: string; config: Record<string, unknown> }) => void;
}

const TRIGGER_TYPES = [
  { id: "event", name: "Platform Event", icon: "📩", description: "Triggered by module events" },
  { id: "schedule", name: "Schedule", icon: "⏰", description: "Run on a schedule" },
  { id: "webhook", name: "Incoming Webhook", icon: "🌐", description: "Triggered by HTTP request" },
  { id: "manual", name: "Manual", icon: "👆", description: "Triggered manually" },
];

export function TriggerPanel({ trigger, onTriggerChange }: TriggerPanelProps) {
  const [selectedType, setSelectedType] = useState(trigger?.type || "event");

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    onTriggerChange({ type, config: {} });
  };

  return (
    <div className="p-4 border-b">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        ⚡ Trigger
      </h3>

      <Tabs value={selectedType} onValueChange={handleTypeChange}>
        <TabsList className="grid grid-cols-2 gap-1">
          {TRIGGER_TYPES.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs">
              {t.icon} {t.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Event Trigger Config */}
        <TabsContent value="event" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select
              value={trigger?.config?.event_type as string}
              onValueChange={(value) =>
                onTriggerChange({
                  type: "event",
                  config: { ...trigger?.config, event_type: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event..." />
              </SelectTrigger>
              <SelectContent>
                {/* CRM Events */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  CRM
                </div>
                {Object.entries(EVENT_REGISTRY.crm.contact).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Contact {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.crm.deal).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Deal {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Booking Events */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                  Booking
                </div>
                {Object.entries(EVENT_REGISTRY.booking.appointment).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Appointment {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Form Events */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                  Forms
                </div>
                {Object.entries(EVENT_REGISTRY.form.submission).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Form {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}

                {/* Accounting Events */}
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2">
                  Accounting
                </div>
                {Object.entries(EVENT_REGISTRY.accounting.invoice).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Invoice {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
                {Object.entries(EVENT_REGISTRY.accounting.payment).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    Payment {key.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Filter */}
          <div className="space-y-2">
            <Label>Filter (Optional)</Label>
            <div className="text-xs text-muted-foreground">
              Only trigger when conditions are met
            </div>
            {/* Filter builder UI would go here */}
          </div>
        </TabsContent>

        {/* Schedule Trigger Config */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select
              value={trigger?.config?.schedule_type as string || "daily"}
              onValueChange={(value) =>
                onTriggerChange({
                  type: "schedule",
                  config: { ...trigger?.config, schedule_type: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Every Hour</SelectItem>
                <SelectItem value="daily">Every Day</SelectItem>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
                <SelectItem value="custom">Custom (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {trigger?.config?.schedule_type === "daily" && (
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={trigger?.config?.time as string || "09:00"}
                onChange={(e) =>
                  onTriggerChange({
                    type: "schedule",
                    config: { ...trigger?.config, time: e.target.value },
                  })
                }
              />
            </div>
          )}

          {trigger?.config?.schedule_type === "custom" && (
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                placeholder="0 9 * * 1-5"
                value={trigger?.config?.cron as string || ""}
                onChange={(e) =>
                  onTriggerChange({
                    type: "schedule",
                    config: { ...trigger?.config, cron: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Example: 0 9 * * 1-5 (9am weekdays)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={trigger?.config?.timezone as string || "America/New_York"}
              onValueChange={(value) =>
                onTriggerChange({
                  type: "schedule",
                  config: { ...trigger?.config, timezone: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Webhook Trigger Config */}
        <TabsContent value="webhook" className="mt-4 space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <Label className="text-xs text-muted-foreground">Webhook URL</Label>
            <code className="block text-xs mt-1 break-all">
              {`${process.env.NEXT_PUBLIC_APP_URL}/api/automation/webhook/${trigger?.config?.endpoint_path || "..."}`}
            </code>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            Copy URL
          </Button>
          <p className="text-xs text-muted-foreground">
            Send a POST request to this URL to trigger the workflow
          </p>
        </TabsContent>

        {/* Manual Trigger */}
        <TabsContent value="manual" className="mt-4">
          <div className="p-4 border border-dashed rounded-md text-center">
            <p className="text-sm text-muted-foreground">
              This workflow can only be triggered manually via the dashboard or API.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Action Palette Component

```tsx
// src/modules/automation/components/workflow-builder/action-palette.tsx

"use client";

import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const ACTION_CATEGORIES = [
  {
    name: "CRM",
    icon: "👤",
    actions: [
      { id: "crm.create_contact", name: "Create Contact", icon: "➕" },
      { id: "crm.update_contact", name: "Update Contact", icon: "✏️" },
      { id: "crm.add_tag", name: "Add Tag", icon: "🏷️" },
      { id: "crm.create_deal", name: "Create Deal", icon: "💰" },
      { id: "crm.move_deal_stage", name: "Move Deal Stage", icon: "➡️" },
      { id: "crm.create_task", name: "Create Task", icon: "✅" },
      { id: "crm.log_activity", name: "Log Activity", icon: "📝" },
    ],
  },
  {
    name: "Communication",
    icon: "📧",
    actions: [
      { id: "email.send", name: "Send Email", icon: "📧" },
      { id: "email.send_template", name: "Send Template Email", icon: "📨" },
      { id: "notification.send_sms", name: "Send SMS", icon: "📱" },
      { id: "notification.send_slack", name: "Send to Slack", icon: "💬" },
      { id: "notification.send_discord", name: "Send to Discord", icon: "🎮" },
      { id: "notification.in_app", name: "In-App Notification", icon: "🔔" },
    ],
  },
  {
    name: "Data",
    icon: "🗄️",
    actions: [
      { id: "data.lookup", name: "Lookup Record", icon: "🔍" },
      { id: "data.create", name: "Create Record", icon: "➕" },
      { id: "data.update", name: "Update Record", icon: "✏️" },
      { id: "data.delete", name: "Delete Record", icon: "🗑️" },
    ],
  },
  {
    name: "Flow Control",
    icon: "🔀",
    actions: [
      { id: "flow.delay", name: "Delay", icon: "⏱️" },
      { id: "flow.condition", name: "Condition (If/Else)", icon: "🔀" },
      { id: "flow.loop", name: "Loop", icon: "🔁" },
      { id: "flow.stop", name: "Stop Workflow", icon: "🛑" },
    ],
  },
  {
    name: "Transform",
    icon: "🔄",
    actions: [
      { id: "transform.map", name: "Map Data", icon: "🔄" },
      { id: "transform.filter", name: "Filter Array", icon: "🔍" },
      { id: "transform.aggregate", name: "Aggregate", icon: "📊" },
      { id: "transform.format_date", name: "Format Date", icon: "📅" },
      { id: "transform.template", name: "Render Template", icon: "📝" },
    ],
  },
  {
    name: "External",
    icon: "🌐",
    actions: [
      { id: "webhook.send", name: "HTTP Request", icon: "🌐" },
      { id: "integration.google_sheets", name: "Google Sheets", icon: "📊" },
      { id: "integration.airtable", name: "Airtable", icon: "📋" },
      { id: "integration.paddle", name: "Paddle", icon: "💳" },
    ],
  },
  {
    name: "AI",
    icon: "🤖",
    actions: [
      { id: "ai.generate_text", name: "Generate Text", icon: "✨" },
      { id: "ai.summarize", name: "Summarize", icon: "📝" },
      { id: "ai.classify", name: "Classify", icon: "🏷️" },
      { id: "ai.extract", name: "Extract Data", icon: "🔍" },
    ],
  },
];

function DraggableAction({ action }: { action: { id: string; name: string; icon: string } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    data: {
      type: "palette-item",
      actionType: action.id,
      name: action.name,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-2 rounded-md cursor-grab
        hover:bg-muted transition-colors
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <span className="text-lg">{action.icon}</span>
      <span className="text-sm">{action.name}</span>
    </div>
  );
}

export function ActionPalette() {
  const [search, setSearch] = useState("");

  const filteredCategories = ACTION_CATEGORIES.map((cat) => ({
    ...cat,
    actions: cat.actions.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.actions.length > 0);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">🧩 Actions</h3>
        <Input
          placeholder="Search actions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8"
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.name}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                {category.icon} {category.name}
              </h4>
              <div className="space-y-1">
                {category.actions.map((action) => (
                  <DraggableAction key={action.id} action={action} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
```

### Workflow Canvas Component

```tsx
// src/modules/automation/components/workflow-builder/workflow-canvas.tsx

"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, ChevronDown, Play } from "lucide-react";
import type { WorkflowStep } from "../../types/automation";

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  selectedStepId?: string;
  onStepClick: (step: WorkflowStep | null) => void;
  onStepDelete: (stepId: string) => void;
}

function SortableStep({
  step,
  isSelected,
  onClick,
  onDelete,
}: {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.id,
    data: { type: "step", step },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getStepIcon = () => {
    switch (step.step_type) {
      case "action":
        return step.action_type?.startsWith("crm") ? "👤" :
               step.action_type?.startsWith("email") ? "📧" :
               step.action_type?.startsWith("notification") ? "🔔" :
               step.action_type?.startsWith("webhook") ? "🌐" :
               step.action_type?.startsWith("data") ? "🗄️" :
               step.action_type?.startsWith("transform") ? "🔄" :
               step.action_type?.startsWith("ai") ? "🤖" : "⚡";
      case "condition":
        return "🔀";
      case "delay":
        return "⏱️";
      case "loop":
        return "🔁";
      case "stop":
        return "🛑";
      default:
        return "⚡";
    }
  };

  const getStepColor = () => {
    switch (step.step_type) {
      case "condition":
        return "border-l-yellow-500";
      case "delay":
        return "border-l-blue-500";
      case "loop":
        return "border-l-purple-500";
      case "stop":
        return "border-l-red-500";
      default:
        return "border-l-primary";
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Connector Line */}
      <div className="absolute left-1/2 -top-4 w-0.5 h-4 bg-border" />

      <Card
        className={`
          p-3 cursor-pointer transition-all border-l-4 ${getStepColor()}
          ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}
        `}
        onClick={onClick}
      >
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-primary"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Icon */}
          <div className="text-xl">{getStepIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {step.name || step.action_type?.split(".").pop()?.replace(/_/g, " ") || "Untitled Step"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {step.description || step.action_type}
            </div>
          </div>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function WorkflowCanvas({
  steps,
  selectedStepId,
  onStepClick,
  onStepDelete,
}: WorkflowCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-full p-8 flex flex-col items-center
        ${isOver ? "bg-primary/5" : ""}
      `}
    >
      {/* Start Node */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg">
          <Play className="h-6 w-6" />
        </div>
        <div className="text-xs font-medium mt-2">Start</div>
        {steps.length > 0 && (
          <div className="w-0.5 h-4 bg-border mt-2" />
        )}
      </div>

      {/* Steps */}
      {steps.length > 0 ? (
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 w-full max-w-md">
            {steps.map((step) => (
              <SortableStep
                key={step.id}
                step={step}
                isSelected={step.id === selectedStepId}
                onClick={() => onStepClick(step)}
                onDelete={() => onStepDelete(step.id)}
              />
            ))}
          </div>
        </SortableContext>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <p>Drag actions here to build your workflow</p>
        </div>
      )}

      {/* End Node */}
      {steps.length > 0 && (
        <div className="flex flex-col items-center mt-4">
          <div className="w-0.5 h-4 bg-border mb-2" />
          <div className="w-10 h-10 rounded-full bg-muted border-2 flex items-center justify-center">
            <ChevronDown className="h-5 w-5" />
          </div>
          <div className="text-xs font-medium mt-2 text-muted-foreground">End</div>
        </div>
      )}
    </div>
  );
}
```

### Step Configuration Panel

```tsx
// src/modules/automation/components/workflow-builder/step-config-panel.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Info } from "lucide-react";
import { ACTION_REGISTRY } from "../../lib/action-types";
import type { WorkflowStep } from "../../types/automation";

interface StepConfigPanelProps {
  step: WorkflowStep;
  onUpdate: (stepId: string, updates: Partial<WorkflowStep>) => void;
  onClose: () => void;
}

export function StepConfigPanel({ step, onUpdate, onClose }: StepConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(step.action_config || {});

  useEffect(() => {
    setLocalConfig(step.action_config || {});
  }, [step.id]);

  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onUpdate(step.id, { action_config: newConfig });
  };

  // Get action definition from registry
  const getActionDef = () => {
    if (!step.action_type) return null;
    const [category, action] = step.action_type.split(".");
    return (ACTION_REGISTRY as any)[category]?.[action];
  };

  const actionDef = getActionDef();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Configure Step</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="settings">
          <TabsList className="w-full justify-start rounded-none border-b px-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="mapping">Data Mapping</TabsTrigger>
            <TabsTrigger value="errors">Error Handling</TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4">
            {/* Step Name */}
            <div className="space-y-2">
              <Label>Step Name</Label>
              <Input
                value={step.name || ""}
                onChange={(e) => onUpdate(step.id, { name: e.target.value })}
                placeholder="Give this step a name..."
              />
            </div>

            {/* Step Description */}
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                value={step.description || ""}
                onChange={(e) => onUpdate(step.id, { description: e.target.value })}
                placeholder="What does this step do?"
                rows={2}
              />
            </div>

            {/* Action-specific config */}
            {actionDef && (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  {actionDef.icon} {actionDef.name}
                </h4>
                <p className="text-xs text-muted-foreground">{actionDef.description}</p>

                {/* Render inputs based on action definition */}
                {Object.entries(actionDef.inputs || {}).map(([key, config]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {key.replace(/_/g, " ")}
                      {config.required && <span className="text-red-500">*</span>}
                    </Label>

                    {config.type === "string" && (
                      <Input
                        value={(localConfig as any)[key] || ""}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        placeholder={config.default || `Enter ${key}...`}
                      />
                    )}

                    {config.type === "number" && (
                      <Input
                        type="number"
                        value={(localConfig as any)[key] || config.default || ""}
                        onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                      />
                    )}

                    {config.type === "enum" && (
                      <Select
                        value={(localConfig as any)[key] || ""}
                        onValueChange={(value) => handleConfigChange(key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${key}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {config.values?.map((v: string) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {config.type === "boolean" && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={(localConfig as any)[key] || false}
                          onCheckedChange={(checked) => handleConfigChange(key, checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {(localConfig as any)[key] ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    )}

                    {config.type === "object" && (
                      <Textarea
                        value={JSON.stringify((localConfig as any)[key] || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            handleConfigChange(key, JSON.parse(e.target.value));
                          } catch {
                            // Invalid JSON, ignore
                          }
                        }}
                        placeholder="{}"
                        rows={4}
                        className="font-mono text-xs"
                      />
                    )}

                    {/* Variable hint */}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Use {"{{trigger.field}}"} for dynamic values
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Condition step config */}
            {step.step_type === "condition" && (
              <ConditionConfig
                config={step.condition_config || {}}
                onUpdate={(config) => onUpdate(step.id, { condition_config: config })}
              />
            )}

            {/* Delay step config */}
            {step.step_type === "delay" && (
              <DelayConfig
                config={step.delay_config || {}}
                onUpdate={(config) => onUpdate(step.id, { delay_config: config })}
              />
            )}
          </TabsContent>

          {/* Data Mapping Tab */}
          <TabsContent value="mapping" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Input Mapping</Label>
              <p className="text-xs text-muted-foreground">
                Map data from trigger or previous steps to this step's inputs
              </p>
              <Textarea
                value={JSON.stringify(step.input_mapping || {}, null, 2)}
                onChange={(e) => {
                  try {
                    onUpdate(step.id, { input_mapping: JSON.parse(e.target.value) });
                  } catch {
                    // Invalid JSON
                  }
                }}
                placeholder='{"email": "{{trigger.email}}"}'
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label>Output Key</Label>
              <p className="text-xs text-muted-foreground">
                Store this step's output for use in later steps
              </p>
              <Input
                value={step.output_key || ""}
                onChange={(e) => onUpdate(step.id, { output_key: e.target.value })}
                placeholder="step_1_result"
              />
            </div>
          </TabsContent>

          {/* Error Handling Tab */}
          <TabsContent value="errors" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>On Error</Label>
              <Select
                value={step.on_error || "fail"}
                onValueChange={(value) => onUpdate(step.id, { on_error: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fail">Stop workflow</SelectItem>
                  <SelectItem value="continue">Continue to next step</SelectItem>
                  <SelectItem value="retry">Retry step</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {step.on_error === "retry" && (
              <>
                <div className="space-y-2">
                  <Label>Max Retries</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={step.max_retries || 3}
                    onChange={(e) => onUpdate(step.id, { max_retries: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Retry Delay (seconds)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={step.retry_delay_seconds || 60}
                    onChange={(e) =>
                      onUpdate(step.id, { retry_delay_seconds: Number(e.target.value) })
                    }
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Condition configuration component
function ConditionConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Record<string, unknown>) => void;
}) {
  const conditions = (config.conditions as any[]) || [];
  const operator = (config.operator as string) || "and";

  const addCondition = () => {
    onUpdate({
      ...config,
      conditions: [...conditions, { field: "", operator: "equals", value: "" }],
    });
  };

  const updateCondition = (index: number, updates: Record<string, unknown>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate({ ...config, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    onUpdate({
      ...config,
      conditions: conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Conditions</h4>
        <Select
          value={operator}
          onValueChange={(value) => onUpdate({ ...config, operator: value })}
        >
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {conditions.map((cond, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Input
            placeholder="Field ({{trigger.status}})"
            value={cond.field || ""}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className="flex-1"
          />
          <Select
            value={cond.operator || "equals"}
            onValueChange={(value) => updateCondition(index, { operator: value })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equals">equals</SelectItem>
              <SelectItem value="not_equals">not equals</SelectItem>
              <SelectItem value="contains">contains</SelectItem>
              <SelectItem value="not_contains">not contains</SelectItem>
              <SelectItem value="greater_than">{">"}</SelectItem>
              <SelectItem value="less_than">{"<"}</SelectItem>
              <SelectItem value="is_empty">is empty</SelectItem>
              <SelectItem value="is_not_empty">is not empty</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Value"
            value={cond.value || ""}
            onChange={(e) => updateCondition(index, { value: e.target.value })}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCondition(index)}
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addCondition} className="w-full">
        + Add Condition
      </Button>
    </div>
  );
}

// Delay configuration component
function DelayConfig({
  config,
  onUpdate,
}: {
  config: Record<string, unknown>;
  onUpdate: (config: Record<string, unknown>) => void;
}) {
  const delayType = (config.type as string) || "fixed";

  return (
    <div className="space-y-4 pt-4 border-t">
      <h4 className="font-medium">Delay Settings</h4>

      <div className="space-y-2">
        <Label>Delay Type</Label>
        <Select
          value={delayType}
          onValueChange={(value) => onUpdate({ ...config, type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="until">Until Date/Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {delayType === "fixed" && (
        <div className="space-y-2">
          <Label>Duration</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              value={(config.value as string)?.replace(/[^0-9]/g, "") || "5"}
              onChange={(e) => {
                const unit = (config.value as string)?.replace(/[0-9]/g, "") || "m";
                onUpdate({ ...config, value: `${e.target.value}${unit}` });
              }}
              className="w-20"
            />
            <Select
              value={(config.value as string)?.replace(/[0-9]/g, "") || "m"}
              onValueChange={(unit) => {
                const num = (config.value as string)?.replace(/[^0-9]/g, "") || "5";
                onUpdate({ ...config, value: `${num}${unit}` });
              }}
            >
              <SelectTrigger className="w-32">
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
        </div>
      )}

      {delayType === "until" && (
        <div className="space-y-2">
          <Label>Wait Until</Label>
          <Input
            type="datetime-local"
            value={(config.value as string) || ""}
            onChange={(e) => onUpdate({ ...config, value: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Or use a variable: {"{{trigger.appointment_date}}"}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 📚 Workflow Templates

### Template Data Structure

```typescript
// src/modules/automation/lib/templates.ts

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  industry?: string;
  icon: string;
  complexity: 'simple' | 'intermediate' | 'advanced';
  estimatedSetupTime: string;
  tags: string[];
  
  // The actual workflow definition
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  steps: Array<{
    step_type: string;
    action_type?: string;
    action_config?: Record<string, unknown>;
    condition_config?: Record<string, unknown>;
    delay_config?: Record<string, unknown>;
    name: string;
    description?: string;
  }>;
  
  // Required connections
  requiredConnections?: string[];
  
  // Variables that need to be configured
  configVariables?: Array<{
    key: string;
    label: string;
    type: 'string' | 'number' | 'select';
    options?: string[];
    defaultValue?: unknown;
    required: boolean;
  }>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // =========================================================
  // LEAD MANAGEMENT
  // =========================================================
  {
    id: 'lead-welcome-sequence',
    name: 'New Lead Welcome Sequence',
    description: 'Automatically welcome new leads with a personalized email and create follow-up tasks',
    category: 'Lead Management',
    icon: '👋',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['lead', 'email', 'crm', 'onboarding'],
    trigger: {
      type: 'event',
      config: {
        event_type: 'crm.contact.created',
        filter: { lead_source: { $ne: null } },
      },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'welcome_lead',
          variables: {
            first_name: '{{trigger.first_name}}',
            company: '{{trigger.company}}',
          },
        },
        name: 'Send Welcome Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1d' },
        name: 'Wait 1 Day',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Follow up with {{trigger.first_name}}',
          description: 'Initial follow-up call for new lead',
          due_date: '{{now_plus_1d}}',
          contact_id: '{{trigger.id}}',
        },
        name: 'Create Follow-up Task',
      },
    ],
    configVariables: [
      {
        key: 'welcome_template',
        label: 'Welcome Email Template',
        type: 'select',
        options: ['welcome_lead', 'welcome_premium', 'welcome_referral'],
        required: true,
      },
    ],
  },

  {
    id: 'lead-scoring-automation',
    name: 'Automatic Lead Scoring',
    description: 'Score leads based on their activities and engagement',
    category: 'Lead Management',
    icon: '📊',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['lead', 'scoring', 'crm'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.activity.logged' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'data.lookup',
        action_config: {
          module: 'crm',
          table: 'contacts',
          field: 'id',
          value: '{{trigger.contact_id}}',
        },
        name: 'Get Contact Details',
      },
      {
        step_type: 'action',
        action_type: 'transform.map',
        action_config: {
          source: '{{steps.Get Contact Details.record}}',
          mapping: {
            current_score: '{{source.lead_score}}',
            activity_points: '{{trigger.type === "email_open" ? 5 : trigger.type === "meeting" ? 20 : 10}}',
          },
        },
        name: 'Calculate Score',
      },
      {
        step_type: 'action',
        action_type: 'crm.update_contact',
        action_config: {
          contact_id: '{{trigger.contact_id}}',
          fields: {
            lead_score: '{{steps.Calculate Score.result.current_score + steps.Calculate Score.result.activity_points}}',
          },
        },
        name: 'Update Lead Score',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{steps.Update Lead Score.contact.lead_score}}', operator: 'greater_than', value: 100 },
          ],
        },
        name: 'Check Hot Lead Threshold',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#sales',
          message: '🔥 Hot Lead Alert! {{trigger.contact_name}} just hit a lead score of {{steps.Update Lead Score.contact.lead_score}}',
        },
        name: 'Alert Sales Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  // =========================================================
  // APPOINTMENT / BOOKING
  // =========================================================
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder Sequence',
    description: 'Send SMS and email reminders before appointments',
    category: 'Booking',
    industry: 'Healthcare',
    icon: '📅',
    complexity: 'intermediate',
    estimatedSetupTime: '10 minutes',
    tags: ['booking', 'reminder', 'sms', 'email'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.confirmed' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'appointment_confirmation',
          variables: {
            name: '{{trigger.customer_name}}',
            date: '{{trigger.appointment_date}}',
            time: '{{trigger.appointment_time}}',
            service: '{{trigger.service_name}}',
          },
        },
        name: 'Send Confirmation Email',
      },
      {
        step_type: 'delay',
        delay_config: {
          type: 'until',
          value: '{{trigger.appointment_date - 1d}}',
        },
        name: 'Wait Until Day Before',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Reminder: Your appointment is tomorrow at {{trigger.appointment_time}}. Reply CONFIRM to confirm or CANCEL to cancel.',
        },
        name: 'Send SMS Reminder',
      },
      {
        step_type: 'delay',
        delay_config: {
          type: 'until',
          value: '{{trigger.appointment_date - 2h}}',
        },
        name: 'Wait Until 2 Hours Before',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Your appointment starts in 2 hours! We look forward to seeing you.',
        },
        name: 'Send Final Reminder',
      },
    ],
    requiredConnections: ['twilio'],
    configVariables: [
      {
        key: 'first_reminder_days',
        label: 'First Reminder (days before)',
        type: 'number',
        defaultValue: 1,
        required: true,
      },
      {
        key: 'final_reminder_hours',
        label: 'Final Reminder (hours before)',
        type: 'number',
        defaultValue: 2,
        required: true,
      },
    ],
  },

  {
    id: 'no-show-followup',
    name: 'No-Show Follow-up',
    description: 'Automatically reach out to customers who miss appointments',
    category: 'Booking',
    icon: '😔',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['booking', 'no-show', 'follow-up'],
    trigger: {
      type: 'event',
      config: { event_type: 'booking.appointment.no_show' },
    },
    steps: [
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1h' },
        name: 'Wait 1 Hour',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'missed_appointment',
          variables: {
            name: '{{trigger.customer_name}}',
            reschedule_link: '{{trigger.reschedule_url}}',
          },
        },
        name: 'Send Reschedule Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_id: '{{trigger.customer_id}}',
          type: 'note',
          description: 'Customer no-showed for appointment on {{trigger.appointment_date}}. Reschedule email sent.',
        },
        name: 'Log to CRM',
      },
    ],
  },

  // =========================================================
  // E-COMMERCE
  // =========================================================
  {
    id: 'abandoned-cart-recovery',
    name: 'Abandoned Cart Recovery',
    description: 'Win back customers who abandoned their shopping cart',
    category: 'E-Commerce',
    icon: '🛒',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['ecommerce', 'cart', 'recovery', 'email'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.cart.abandoned' },
    },
    steps: [
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1h' },
        name: 'Wait 1 Hour',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'abandoned_cart_1',
          variables: {
            name: '{{trigger.customer_name}}',
            cart_items: '{{trigger.cart_items}}',
            cart_total: '{{trigger.cart_total}}',
            checkout_url: '{{trigger.checkout_url}}',
          },
        },
        name: 'Send First Reminder',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '1d' },
        name: 'Wait 1 Day',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.recovered}}', operator: 'equals', value: false },
          ],
        },
        name: 'Check If Still Abandoned',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'abandoned_cart_2_discount',
          variables: {
            name: '{{trigger.customer_name}}',
            discount_code: 'COMEBACK10',
            checkout_url: '{{trigger.checkout_url}}',
          },
        },
        name: 'Send Discount Offer',
      },
    ],
  },

  {
    id: 'order-fulfillment-updates',
    name: 'Order Status Updates',
    description: 'Keep customers informed about their order status',
    category: 'E-Commerce',
    icon: '📦',
    complexity: 'simple',
    estimatedSetupTime: '10 minutes',
    tags: ['ecommerce', 'order', 'shipping', 'notifications'],
    trigger: {
      type: 'event',
      config: { event_type: 'ecommerce.order.shipped' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.customer_email}}',
          template_id: 'order_shipped',
          variables: {
            order_number: '{{trigger.order_number}}',
            tracking_number: '{{trigger.tracking_number}}',
            tracking_url: '{{trigger.tracking_url}}',
            estimated_delivery: '{{trigger.estimated_delivery}}',
          },
        },
        name: 'Send Shipping Email',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_sms',
        action_config: {
          to: '{{trigger.customer_phone}}',
          body: 'Your order #{{trigger.order_number}} has shipped! Track it here: {{trigger.tracking_url}}',
        },
        name: 'Send SMS Notification',
      },
    ],
    requiredConnections: ['twilio'],
  },

  // =========================================================
  // CUSTOMER SUCCESS
  // =========================================================
  {
    id: 'customer-onboarding',
    name: 'Customer Onboarding Sequence',
    description: 'Guide new customers through product adoption',
    category: 'Customer Success',
    industry: 'B2B SaaS',
    icon: '🚀',
    complexity: 'advanced',
    estimatedSetupTime: '30 minutes',
    tags: ['onboarding', 'saas', 'engagement', 'drip'],
    trigger: {
      type: 'event',
      config: { event_type: 'accounting.client.created' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_welcome',
          variables: {
            name: '{{trigger.name}}',
            login_url: '{{trigger.login_url}}',
          },
        },
        name: 'Day 0: Welcome Email',
      },
      {
        step_type: 'action',
        action_type: 'crm.create_task',
        action_config: {
          title: 'Welcome call with {{trigger.name}}',
          due_date: '{{now_plus_1d}}',
        },
        name: 'Create Welcome Call Task',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '3d' },
        name: 'Wait 3 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_tips_1',
        },
        name: 'Day 3: Tips Email',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '4d' },
        name: 'Wait 4 Days',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.email}}',
          template_id: 'onboarding_check_in',
        },
        name: 'Day 7: Check-in Email',
      },
      {
        step_type: 'action',
        action_type: 'notification.in_app',
        action_config: {
          user_id: '{{trigger.user_id}}',
          title: 'Complete your profile',
          message: 'Get the most out of our platform by completing your profile settings.',
          link: '/settings/profile',
        },
        name: 'In-App Profile Nudge',
      },
    ],
  },

  // =========================================================
  // PAYMENTS & INVOICING
  // =========================================================
  {
    id: 'payment-overdue-reminders',
    name: 'Payment Overdue Reminders',
    description: 'Automated payment reminder sequence for overdue invoices',
    category: 'Payments',
    icon: '💰',
    complexity: 'intermediate',
    estimatedSetupTime: '15 minutes',
    tags: ['invoice', 'payment', 'reminder', 'accounting'],
    trigger: {
      type: 'event',
      config: { event_type: 'accounting.invoice.overdue' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.client_email}}',
          template_id: 'payment_reminder_1',
          variables: {
            client_name: '{{trigger.client_name}}',
            invoice_number: '{{trigger.invoice_number}}',
            amount_due: '{{trigger.amount_due}}',
            due_date: '{{trigger.due_date}}',
            payment_link: '{{trigger.payment_link}}',
          },
        },
        name: 'Send First Reminder',
      },
      {
        step_type: 'delay',
        delay_config: { type: 'fixed', value: '7d' },
        name: 'Wait 7 Days',
      },
      {
        step_type: 'condition',
        condition_config: {
          operator: 'and',
          conditions: [
            { field: '{{trigger.status}}', operator: 'not_equals', value: 'paid' },
          ],
        },
        name: 'Check Still Unpaid',
      },
      {
        step_type: 'action',
        action_type: 'email.send_template',
        action_config: {
          to: '{{trigger.client_email}}',
          template_id: 'payment_reminder_2_urgent',
          variables: {
            days_overdue: '{{trigger.days_overdue}}',
          },
        },
        name: 'Send Urgent Reminder',
      },
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#finance',
          message: '⚠️ Invoice #{{trigger.invoice_number}} for {{trigger.client_name}} is 14+ days overdue (${{trigger.amount_due}})',
        },
        name: 'Alert Finance Team',
      },
    ],
    requiredConnections: ['slack'],
  },

  // =========================================================
  // TEAM NOTIFICATIONS
  // =========================================================
  {
    id: 'deal-closed-celebration',
    name: 'Deal Closed Celebration',
    description: 'Celebrate won deals with the team',
    category: 'Team',
    icon: '🎉',
    complexity: 'simple',
    estimatedSetupTime: '5 minutes',
    tags: ['crm', 'deals', 'celebration', 'slack'],
    trigger: {
      type: 'event',
      config: { event_type: 'crm.deal.won' },
    },
    steps: [
      {
        step_type: 'action',
        action_type: 'notification.send_slack',
        action_config: {
          channel: '#wins',
          message: '🎉 *DEAL WON!*\n\n*{{trigger.deal_title}}*\nValue: ${{trigger.deal_value}}\nOwner: {{trigger.owner_name}}\nCompany: {{trigger.company_name}}\n\nGreat work, team! 🚀',
        },
        name: 'Post to Slack',
      },
      {
        step_type: 'action',
        action_type: 'crm.log_activity',
        action_config: {
          contact_id: '{{trigger.contact_id}}',
          type: 'note',
          description: '🎉 Deal won! Value: ${{trigger.deal_value}}',
        },
        name: 'Log Win to Contact',
      },
    ],
    requiredConnections: ['slack'],
  },
];

// Helper to get templates by category
export function getTemplatesByCategory(category?: string): WorkflowTemplate[] {
  if (!category) return WORKFLOW_TEMPLATES;
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

// Helper to get templates by industry
export function getTemplatesByIndustry(industry: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.industry === industry);
}

// Get unique categories
export function getTemplateCategories(): string[] {
  return [...new Set(WORKFLOW_TEMPLATES.map(t => t.category))];
}

// Search templates
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.includes(lowerQuery))
  );
}
```

### Template Gallery Component

```tsx
// src/modules/automation/components/template-gallery.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Clock, Zap, ArrowRight } from "lucide-react";
import { 
  WORKFLOW_TEMPLATES, 
  getTemplateCategories, 
  searchTemplates,
  type WorkflowTemplate 
} from "../lib/templates";
import { createWorkflowFromTemplate } from "../actions/workflow-actions";

interface TemplateGalleryProps {
  siteId: string;
  onWorkflowCreated?: (workflowId: string) => void;
}

export function TemplateGallery({ siteId, onWorkflowCreated }: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const categories = getTemplateCategories();
  
  const filteredTemplates = search 
    ? searchTemplates(search)
    : selectedCategory === "all"
      ? WORKFLOW_TEMPLATES
      : WORKFLOW_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    setIsCreating(true);
    try {
      const result = await createWorkflowFromTemplate(siteId, template);
      if (result.success && result.workflow) {
        toast.success("Workflow created from template!");
        onWorkflowCreated?.(result.workflow.id);
      } else {
        toast.error(result.error || "Failed to create workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
      setSelectedTemplate(null);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "simple": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Templates</h2>
          <p className="text-muted-foreground">
            Start with a pre-built automation and customize it to your needs
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="text-3xl">{template.icon}</div>
                <Badge className={getComplexityColor(template.complexity)}>
                  {template.complexity}
                </Badge>
              </div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  {template.steps.length} steps
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {template.estimatedSetupTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3">
                {template.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your search.</p>
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        {selectedTemplate && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedTemplate.icon}</span>
                <div>
                  <DialogTitle>{selectedTemplate.name}</DialogTitle>
                  <DialogDescription>{selectedTemplate.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Trigger Info */}
              <div>
                <h4 className="font-medium mb-2">Trigger</h4>
                <div className="p-3 bg-muted rounded-md text-sm">
                  <code>{selectedTemplate.trigger.config.event_type || selectedTemplate.trigger.type}</code>
                </div>
              </div>

              {/* Steps Preview */}
              <div>
                <h4 className="font-medium mb-2">Workflow Steps</h4>
                <div className="space-y-2">
                  {selectedTemplate.steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border rounded-md">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {step.step_type === "action" ? step.action_type : step.step_type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Connections */}
              {selectedTemplate.requiredConnections && selectedTemplate.requiredConnections.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Required Connections</h4>
                  <div className="flex gap-2">
                    {selectedTemplate.requiredConnections.map((conn) => (
                      <Badge key={conn} variant="outline">
                        {conn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUseTemplate(selectedTemplate)}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Use This Template"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
```

---

## 📊 Analytics Dashboard

```tsx
// src/modules/automation/components/analytics-dashboard.tsx

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { Activity, CheckCircle, XCircle, Clock, Zap, TrendingUp } from "lucide-react";

interface AnalyticsDashboardProps {
  siteId: string;
  dateRange?: { from: Date; to: Date };
}

// Mock data - in production, fetch from API
const mockStats = {
  totalExecutions: 1247,
  successRate: 94.3,
  avgDuration: 2.4,
  activeWorkflows: 12,
  executionsByDay: [
    { date: "Mon", executions: 145, successful: 138, failed: 7 },
    { date: "Tue", executions: 187, successful: 175, failed: 12 },
    { date: "Wed", executions: 203, successful: 195, failed: 8 },
    { date: "Thu", executions: 178, successful: 169, failed: 9 },
    { date: "Fri", executions: 192, successful: 183, failed: 9 },
    { date: "Sat", executions: 156, successful: 148, failed: 8 },
    { date: "Sun", executions: 186, successful: 177, failed: 9 },
  ],
  topWorkflows: [
    { name: "Lead Welcome Sequence", executions: 342, successRate: 98 },
    { name: "Appointment Reminders", executions: 287, successRate: 96 },
    { name: "Abandoned Cart Recovery", executions: 234, successRate: 91 },
    { name: "Payment Reminders", executions: 198, successRate: 95 },
    { name: "Deal Closed Notification", executions: 186, successRate: 99 },
  ],
  executionsByStatus: [
    { name: "Completed", value: 1175, color: "#22c55e" },
    { name: "Failed", value: 42, color: "#ef4444" },
    { name: "Running", value: 18, color: "#3b82f6" },
    { name: "Paused", value: 12, color: "#f59e0b" },
  ],
  actionBreakdown: [
    { action: "Send Email", count: 523 },
    { action: "Create Contact", count: 312 },
    { action: "Update Record", count: 245 },
    { action: "Send SMS", count: 189 },
    { action: "Send Slack", count: 156 },
    { action: "HTTP Request", count: 98 },
  ],
};

export function AnalyticsDashboard({ siteId, dateRange }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(mockStats.totalExecutions * mockStats.successRate / 100)} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.avgDuration}s</div>
            <p className="text-xs text-muted-foreground">
              Average execution time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeWorkflows}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Executions Over Time</CardTitle>
            <CardDescription>Daily workflow executions this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockStats.executionsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successful" name="Successful" fill="#22c55e" stackId="a" />
                <Bar dataKey="failed" name="Failed" fill="#ef4444" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Execution Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Execution Status</CardTitle>
            <CardDescription>Breakdown by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockStats.executionsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockStats.executionsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Top Workflows</CardTitle>
            <CardDescription>Most active workflows this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.topWorkflows.map((workflow, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{workflow.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {workflow.executions} executions
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    workflow.successRate >= 95 ? "text-green-600" : 
                    workflow.successRate >= 90 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {workflow.successRate}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Executed</CardTitle>
            <CardDescription>Most used actions this week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockStats.actionBreakdown} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="action" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Failures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Recent Failures
          </CardTitle>
          <CardDescription>Workflows that failed in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be populated from real data */}
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Abandoned Cart Recovery</div>
                  <div className="text-xs text-muted-foreground">
                    Failed at step: Send Discount Email
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-red-600">SMTP connection refused</div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔌 External Integrations

### Integration Connection Components

```tsx
// src/modules/automation/components/connections/connection-setup.tsx

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createConnection, testConnection } from "../../actions/workflow-actions";

const AVAILABLE_INTEGRATIONS = [
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    description: "Send messages to Slack channels",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/..." },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    icon: "🎮",
    description: "Send messages to Discord channels",
    fields: [
      { key: "webhook_url", label: "Webhook URL", type: "text", placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    id: "twilio",
    name: "Twilio (SMS)",
    icon: "📱",
    description: "Send SMS messages",
    fields: [
      { key: "account_sid", label: "Account SID", type: "text", placeholder: "AC..." },
      { key: "auth_token", label: "Auth Token", type: "password", placeholder: "Your auth token" },
      { key: "from_number", label: "From Number", type: "text", placeholder: "+1234567890" },
    ],
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    icon: "📧",
    description: "Send emails via SendGrid",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "SG...." },
    ],
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    icon: "🐵",
    description: "Add subscribers to Mailchimp lists",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "xxx-us1" },
      { key: "server_prefix", label: "Server Prefix", type: "text", placeholder: "us1" },
    ],
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    icon: "📊",
    description: "Add rows to Google Sheets",
    oauth: true,
  },
  {
    id: "airtable",
    name: "Airtable",
    icon: "📋",
    description: "Create records in Airtable",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "pat..." },
      { key: "base_id", label: "Base ID", type: "text", placeholder: "app..." },
    ],
  },
  {
    id: "paddle",
    name: "Paddle",
    icon: "💳",
    description: "Billing & subscription management (Zambia-compatible)",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "pdl_live_..." },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: "🤖",
    description: "Generate text with GPT models",
    fields: [
      { key: "api_key", label: "API Key", type: "password", placeholder: "sk-..." },
    ],
  },
];

interface ConnectionSetupProps {
  siteId: string;
  existingConnections: Array<{ service_type: string; name: string }>;
  onConnectionCreated?: () => void;
}

export function ConnectionSetup({ siteId, existingConnections, onConnectionCreated }: ConnectionSetupProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionName, setConnectionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === selectedIntegration);

  const handleSave = async () => {
    if (!integration || !connectionName) return;

    setIsSaving(true);
    try {
      const result = await createConnection(siteId, {
        service_type: integration.id,
        name: connectionName,
        credentials,
      });

      if (result.success) {
        toast.success("Connection saved successfully");
        setSelectedIntegration(null);
        setCredentials({});
        setConnectionName("");
        onConnectionCreated?.();
      } else {
        toast.error(result.error || "Failed to save connection");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    // Test would require the connection to be saved first
    // Or implement a test endpoint that takes credentials directly
    setIsTesting(true);
    try {
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Connection test successful!");
    } catch {
      toast.error("Connection test failed");
    } finally {
      setIsTesting(false);
    }
  };

  const isConnected = (serviceType: string) => 
    existingConnections.some(c => c.service_type === serviceType);

  return (
    <div className="space-y-6">
      {!selectedIntegration ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_INTEGRATIONS.map((int) => (
              <Card 
                key={int.id}
                className={`cursor-pointer transition-all ${
                  isConnected(int.id) ? "border-green-500" : "hover:border-primary"
                }`}
                onClick={() => !int.oauth && setSelectedIntegration(int.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{int.icon}</span>
                    {isConnected(int.id) && (
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    )}
                  </div>
                  <CardTitle className="text-lg">{int.name}</CardTitle>
                  <CardDescription>{int.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {int.oauth ? (
                    <Button variant="outline" size="sm" className="w-full">
                      Connect with OAuth
                    </Button>
                  ) : (
                    <Button 
                      variant={isConnected(int.id) ? "outline" : "default"} 
                      size="sm" 
                      className="w-full"
                    >
                      {isConnected(int.id) ? "Manage" : "Set Up"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{integration?.icon}</span>
              <div>
                <CardTitle>Set Up {integration?.name}</CardTitle>
                <CardDescription>{integration?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Connection Name</Label>
              <Input
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
                placeholder={`My ${integration?.name} Connection`}
              />
            </div>

            {integration?.fields?.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  value={credentials[field.key] || ""}
                  onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedIntegration(null);
                  setCredentials({});
                  setConnectionName("");
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || !connectionName}
              >
                {isSaving ? "Saving..." : "Save Connection"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 🤖 AI-Powered Features

### AI Action Implementations

```typescript
// src/modules/automation/services/ai-actions.ts

/**
 * AI-Powered Actions for Automation Engine
 * 
 * These actions use OpenAI (or other LLM providers) to add
 * intelligence to workflows.
 */

import { OpenAI } from 'openai';

const getOpenAIClient = (apiKey: string) => {
  return new OpenAI({ apiKey });
};

export interface AIActionResult {
  status: 'completed' | 'failed';
  output?: unknown;
  error?: string;
}

/**
 * Generate text using GPT
 */
export async function generateText(
  config: {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  },
  apiKey: string
): Promise<AIActionResult> {
  try {
    const client = getOpenAIClient(apiKey);
    
    const response = await client.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: config.prompt }],
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
    });

    return {
      status: 'completed',
      output: {
        text: response.choices[0]?.message?.content || '',
        usage: response.usage,
      },
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate text',
    };
  }
}

/**
 * Summarize text
 */
export async function summarizeText(
  config: {
    text: string;
    maxLength?: number;
    style?: 'bullet' | 'paragraph' | 'tldr';
  },
  apiKey: string
): Promise<AIActionResult> {
  const stylePrompts = {
    bullet: 'Summarize the following text as bullet points:',
    paragraph: 'Summarize the following text in a concise paragraph:',
    tldr: 'Provide a TL;DR (very brief summary) of the following text:',
  };

  const prompt = `${stylePrompts[config.style || 'paragraph']}

${config.text}

${config.maxLength ? `Keep the summary under ${config.maxLength} words.` : ''}`;

  return generateText({ prompt }, apiKey);
}

/**
 * Classify text into categories
 */
export async function classifyText(
  config: {
    text: string;
    categories: string[];
    allowMultiple?: boolean;
  },
  apiKey: string
): Promise<AIActionResult> {
  const prompt = `Classify the following text into ${config.allowMultiple ? 'one or more of' : 'exactly one of'} these categories: ${config.categories.join(', ')}

Text: ${config.text}

Respond with only the category name(s), nothing else.${config.allowMultiple ? ' Separate multiple categories with commas.' : ''}`;

  try {
    const result = await generateText({ prompt, temperature: 0.3 }, apiKey);
    
    if (result.status === 'completed' && result.output) {
      const output = result.output as { text: string };
      const categories = output.text.split(',').map((c: string) => c.trim());
      
      return {
        status: 'completed',
        output: {
          categories: config.allowMultiple ? categories : [categories[0]],
          raw_response: output.text,
        },
      };
    }
    
    return result;
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to classify text',
    };
  }
}

/**
 * Extract structured data from text
 */
export async function extractData(
  config: {
    text: string;
    fields: Array<{
      name: string;
      description: string;
      type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'boolean';
    }>;
  },
  apiKey: string
): Promise<AIActionResult> {
  const fieldDescriptions = config.fields
    .map(f => `- ${f.name} (${f.type}): ${f.description}`)
    .join('\n');

  const prompt = `Extract the following information from the text below. Return a JSON object with the field names as keys.

Fields to extract:
${fieldDescriptions}

Text:
${config.text}

Respond with ONLY valid JSON, no explanation.`;

  try {
    const result = await generateText({ prompt, temperature: 0.1 }, apiKey);
    
    if (result.status === 'completed' && result.output) {
      const output = result.output as { text: string };
      try {
        const extracted = JSON.parse(output.text);
        return {
          status: 'completed',
          output: {
            extracted,
            raw_response: output.text,
          },
        };
      } catch {
        return {
          status: 'failed',
          error: 'Failed to parse extracted data as JSON',
        };
      }
    }
    
    return result;
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to extract data',
    };
  }
}

/**
 * Analyze sentiment
 */
export async function analyzeSentiment(
  config: { text: string },
  apiKey: string
): Promise<AIActionResult> {
  const prompt = `Analyze the sentiment of the following text and respond with a JSON object containing:
- sentiment: "positive", "negative", or "neutral"
- score: a number from -1 (very negative) to 1 (very positive)
- confidence: a number from 0 to 1
- keywords: array of emotional keywords found

Text: ${config.text}

Respond with ONLY valid JSON.`;

  try {
    const result = await generateText({ prompt, temperature: 0.1 }, apiKey);
    
    if (result.status === 'completed' && result.output) {
      const output = result.output as { text: string };
      try {
        const analysis = JSON.parse(output.text);
        return {
          status: 'completed',
          output: analysis,
        };
      } catch {
        return {
          status: 'failed',
          error: 'Failed to parse sentiment analysis',
        };
      }
    }
    
    return result;
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to analyze sentiment',
    };
  }
}

/**
 * Generate personalized email
 */
export async function generatePersonalizedEmail(
  config: {
    recipient_name: string;
    recipient_context?: string;
    purpose: string;
    tone?: 'professional' | 'friendly' | 'casual';
    key_points?: string[];
  },
  apiKey: string
): Promise<AIActionResult> {
  const prompt = `Write a ${config.tone || 'professional'} email for the following purpose:

Purpose: ${config.purpose}
Recipient: ${config.recipient_name}
${config.recipient_context ? `Context about recipient: ${config.recipient_context}` : ''}
${config.key_points?.length ? `Key points to include:\n${config.key_points.map(p => `- ${p}`).join('\n')}` : ''}

Return a JSON object with:
- subject: email subject line
- body: email body (HTML formatted)`;

  try {
    const result = await generateText({ prompt, maxTokens: 1000 }, apiKey);
    
    if (result.status === 'completed' && result.output) {
      const output = result.output as { text: string };
      try {
        const email = JSON.parse(output.text);
        return {
          status: 'completed',
          output: email,
        };
      } catch {
        // If not valid JSON, treat the whole response as body
        return {
          status: 'completed',
          output: {
            subject: config.purpose,
            body: output.text,
          },
        };
      }
    }
    
    return result;
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate email',
    };
  }
}
```

---

## 📁 Complete File Structure (Phase B)

```
src/modules/automation/
├── actions/
│   └── workflow-actions.ts        # Server actions (from Phase A)
├── components/
│   ├── workflow-builder/
│   │   ├── workflow-builder.tsx   # Main builder component
│   │   ├── trigger-panel.tsx      # Trigger configuration
│   │   ├── action-palette.tsx     # Draggable action list
│   │   ├── workflow-canvas.tsx    # Visual canvas
│   │   └── step-config-panel.tsx  # Step configuration
│   ├── connections/
│   │   └── connection-setup.tsx   # Integration setup
│   ├── template-gallery.tsx       # Template browser
│   ├── analytics-dashboard.tsx    # Analytics view
│   ├── workflow-list.tsx          # List view
│   └── execution-log.tsx          # Execution history
├── hooks/
│   └── use-workflow-builder.ts    # Builder state management
├── lib/
│   ├── event-types.ts             # Event registry (from Phase A)
│   ├── action-types.ts            # Action registry (from Phase A)
│   └── templates.ts               # Workflow templates
├── services/
│   ├── event-listener.ts          # Event service (from Phase A)
│   ├── execution-engine.ts        # Execution engine (from Phase A)
│   ├── action-executor.ts         # Action executor (from Phase A)
│   └── ai-actions.ts              # AI-powered actions
├── types/
│   └── automation.ts              # TypeScript types
└── pages/
    ├── page.tsx                   # Main automation page
    ├── [workflowId]/
    │   └── page.tsx               # Workflow editor
    ├── templates/
    │   └── page.tsx               # Template gallery
    ├── analytics/
    │   └── page.tsx               # Analytics dashboard
    └── connections/
        └── page.tsx               # Manage connections
```

---

## ✅ Implementation Checklist - Phase B

### Visual Builder
- [ ] Implement `workflow-builder.tsx` with DnD
- [ ] Create `trigger-panel.tsx` with all trigger types
- [ ] Build `action-palette.tsx` with draggable items
- [ ] Implement `workflow-canvas.tsx` with reordering
- [ ] Create `step-config-panel.tsx` with dynamic forms

### Templates
- [ ] Define template data structure
- [ ] Create 10+ workflow templates
- [ ] Build template gallery UI
- [ ] Implement template installation

### Integrations
- [ ] Implement Slack integration
- [ ] Implement Discord integration
- [ ] Implement Twilio SMS
- [ ] Implement SendGrid
- [ ] Implement Google Sheets (OAuth)
- [ ] Implement Airtable
- [ ] Implement Paddle (billing - Zambia-compatible)
- [ ] Build connection management UI

### AI Features
- [ ] Implement text generation action
- [ ] Implement summarization action
- [ ] Implement classification action
- [ ] Implement data extraction action
- [ ] Implement sentiment analysis
- [ ] Implement personalized email generation

### Analytics
- [ ] Build analytics dashboard
- [ ] Implement execution charts
- [ ] Add top workflows view
- [ ] Add failure tracking
- [ ] Add real-time metrics

### Testing
- [ ] Unit tests for all components
- [ ] Integration tests for builder
- [ ] E2E tests for workflow creation
- [ ] Performance testing

---

## 🚀 Deployment & Launch

### Phase B Deployment Steps

1. **Deploy Phase A First** - Ensure all core infrastructure is working
2. **Add UI Components** - Deploy visual builder incrementally
3. **Enable Templates** - Launch with initial template set
4. **Add Integrations** - Roll out integrations one by one
5. **Enable AI Features** - Add AI actions with proper rate limiting
6. **Monitor & Iterate** - Track usage and gather feedback

### Success Metrics

| Metric | Target |
|--------|--------|
| Workflows created (first month) | 500+ |
| Template usage rate | 40%+ |
| Avg. workflow success rate | 95%+ |
| User satisfaction score | 4.5/5 |
| Feature adoption rate | 60%+ |

---

## 🎉 Summary

The Automation Engine (EM-57A + EM-57B) transforms DRAMAC from a collection of tools into an **intelligent, interconnected platform**. Key capabilities:

✅ **Visual Workflow Builder** - Drag-and-drop interface for creating automations
✅ **Event-Driven Architecture** - React to events from ANY installed module
✅ **Pre-Built Templates** - 10+ templates covering common use cases
✅ **External Integrations** - Connect to Slack, Twilio, Paddle, and more
✅ **AI-Powered Actions** - Generate text, classify data, extract information
✅ **Analytics Dashboard** - Track performance and identify issues
✅ **Flexible Pricing** - Free tier to Enterprise with clear upgrade path

This module positions DRAMAC as a true **automation-first platform** that competes with standalone tools like Zapier while providing native module integration that external tools cannot match.

---

**End of Phase EM-57B**

---

## 📋 Quick Reference

**Part A (EM-57A):**
- Database schema
- Event bus system
- Execution engine
- Core triggers/actions
- Server actions

**Part B (EM-57B):**
- Visual workflow builder
- Workflow templates
- External integrations
- AI-powered actions
- Analytics dashboard

**Combined Timeline:** 4-6 weeks for full implementation
