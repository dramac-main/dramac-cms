"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  GripVertical,
  Mail,
  Clock,
  GitBranch,
  Zap,
  Split,
  ChevronDown,
  ChevronUp,
  Save,
  Smartphone,
  MessageCircle,
} from "lucide-react";
import { SEQUENCE_STEP_TYPE_LABELS } from "../../lib/marketing-constants";
import { createSequence, updateSequence } from "../../actions/sequence-actions";
import type {
  SequenceStep,
  SequenceStepType,
  SequenceTriggerType,
  ConversionGoal,
} from "../../types/sequence-types";

interface SequenceBuilderProps {
  siteId: string;
  existingSequence?: any; // For edit mode
}

const TRIGGER_LABELS: Record<SequenceTriggerType, string> = {
  subscriber_added: "Subscriber Added",
  tag_added: "Tag Added",
  form_submitted: "Form Submitted",
  event: "Custom Event",
  manual: "Manual Enrollment",
};

const STEP_ICONS: Record<SequenceStepType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <Smartphone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  delay: <Clock className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
  action: <Zap className="h-4 w-4" />,
  split: <Split className="h-4 w-4" />,
};

const STEP_COLORS: Record<SequenceStepType, string> = {
  email: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
  sms: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  whatsapp: "border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950",
  delay: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  condition: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
  action: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  split: "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950",
};

function generateId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DELAY_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "4 hours", minutes: 240 },
  { label: "1 day", minutes: 1440 },
  { label: "2 days", minutes: 2880 },
  { label: "3 days", minutes: 4320 },
  { label: "1 week", minutes: 10080 },
];

export function SequenceBuilder({
  siteId,
  existingSequence,
}: SequenceBuilderProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const basePath = `/dashboard/sites/${params.siteId}/marketing/sequences`;

  const isEdit = !!existingSequence;

  // Sequence metadata
  const [name, setName] = useState(existingSequence?.name || "");
  const [description, setDescription] = useState(
    existingSequence?.description || "",
  );
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>(
    existingSequence?.trigger_type || "manual",
  );
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    existingSequence?.trigger_config || {},
  );
  const [enrollmentLimit, setEnrollmentLimit] = useState<string>(
    existingSequence?.enrollment_limit?.toString() || "",
  );
  const [reEnrollment, setReEnrollment] = useState<boolean>(
    existingSequence?.re_enrollment || false,
  );

  // Steps
  const [steps, setSteps] = useState<SequenceStep[]>(
    existingSequence?.steps || [],
  );
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Conversion goal
  const [goalType, setGoalType] = useState(
    existingSequence?.conversion_goal?.type || "",
  );
  const [goalEvent, setGoalEvent] = useState(
    existingSequence?.conversion_goal?.targetEvent || "",
  );
  const [goalHours, setGoalHours] = useState<string>(
    existingSequence?.conversion_goal?.windowHours?.toString() || "72",
  );

  // ============================================================================
  // STEP MANAGEMENT
  // ============================================================================

  const addStep = useCallback(
    (type: SequenceStepType) => {
      const newStep: SequenceStep = {
        id: generateId(),
        type,
        name: SEQUENCE_STEP_TYPE_LABELS[type],
        config: {},
        position: steps.length,
      };

      if (type === "delay") {
        newStep.delayMinutes = 1440; // Default 1 day
      }

      setSteps((prev) => [...prev, newStep]);
      setExpandedStep(newStep.id);
    },
    [steps.length],
  );

  const removeStep = useCallback((stepId: string) => {
    setSteps((prev) =>
      prev
        .filter((s) => s.id !== stepId)
        .map((s, i) => ({ ...s, position: i })),
    );
  }, []);

  const moveStep = useCallback((stepId: string, direction: "up" | "down") => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === stepId);
      if (idx < 0) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const newSteps = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
      return newSteps.map((s, i) => ({ ...s, position: i }));
    });
  }, []);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<SequenceStep>) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  // ============================================================================
  // SAVE
  // ============================================================================

  function handleSave() {
    if (!name.trim()) {
      alert("Please enter a sequence name");
      return;
    }

    const conversionGoal: ConversionGoal | undefined = goalType
      ? {
          type: goalType,
          targetEvent: goalEvent || undefined,
          windowHours: goalHours ? parseInt(goalHours) : undefined,
        }
      : undefined;

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateSequence(siteId, existingSequence.id, {
            name,
            description: description || undefined,
            triggerType,
            triggerConfig,
            steps,
            conversionGoal: conversionGoal || null,
            enrollmentLimit: enrollmentLimit ? parseInt(enrollmentLimit) : null,
            reEnrollment,
          });
        } else {
          await createSequence(siteId, {
            name,
            description: description || undefined,
            triggerType,
            triggerConfig,
            steps,
            conversionGoal,
            enrollmentLimit: enrollmentLimit
              ? parseInt(enrollmentLimit)
              : undefined,
            reEnrollment,
          });
        }
        router.push(basePath);
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? "Edit Sequence" : "New Sequence"}
          </h1>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : isEdit ? "Update" : "Create"} Sequence
          </Button>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Settings */}
        <div className="space-y-6 lg:col-span-1">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sequence Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Welcome Series"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this sequence..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Trigger */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trigger</CardTitle>
              <CardDescription>
                When should subscribers enter this sequence?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Trigger Type</Label>
                <Select
                  value={triggerType}
                  onValueChange={(v) =>
                    setTriggerType(v as SequenceTriggerType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "tag_added" && (
                <div>
                  <Label>Tag Name</Label>
                  <Input
                    value={(triggerConfig.tagName as string) || ""}
                    onChange={(e) =>
                      setTriggerConfig({
                        ...triggerConfig,
                        tagName: e.target.value,
                      })
                    }
                    placeholder="e.g., new-customer"
                  />
                </div>
              )}

              {triggerType === "form_submitted" && (
                <div>
                  <Label>Form ID</Label>
                  <Input
                    value={(triggerConfig.formId as string) || ""}
                    onChange={(e) =>
                      setTriggerConfig({
                        ...triggerConfig,
                        formId: e.target.value,
                      })
                    }
                    placeholder="Form identifier"
                  />
                </div>
              )}

              {triggerType === "event" && (
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={(triggerConfig.eventName as string) || ""}
                    onChange={(e) =>
                      setTriggerConfig({
                        ...triggerConfig,
                        eventName: e.target.value,
                      })
                    }
                    placeholder="e.g., purchase_completed"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="limit">Enrollment Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={enrollmentLimit}
                  onChange={(e) => setEnrollmentLimit(e.target.value)}
                  placeholder="No limit"
                  min={0}
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Max number of subscribers (leave empty for unlimited)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Re-enrollment</Label>
                  <p className="text-muted-foreground text-xs">
                    Can subscribers re-enter this sequence?
                  </p>
                </div>
                <Switch
                  checked={reEnrollment}
                  onCheckedChange={setReEnrollment}
                />
              </div>
            </CardContent>
          </Card>

          {/* Conversion Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Goal</CardTitle>
              <CardDescription>
                Track when subscribers achieve a desired outcome
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Goal Type</Label>
                <Select value={goalType || "none"} onValueChange={(v) => setGoalType(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="signup">Sign Up</SelectItem>
                    <SelectItem value="page_visit">Page Visit</SelectItem>
                    <SelectItem value="event">Custom Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {goalType === "event" && (
                <div>
                  <Label>Event Name</Label>
                  <Input
                    value={goalEvent}
                    onChange={(e) => setGoalEvent(e.target.value)}
                    placeholder="e.g., first_purchase"
                  />
                </div>
              )}
              {goalType && (
                <div>
                  <Label>Window (hours)</Label>
                  <Input
                    type="number"
                    value={goalHours}
                    onChange={(e) => setGoalHours(e.target.value)}
                    placeholder="72"
                    min={1}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    How long after enrollment to track conversions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Step Builder */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Steps ({steps.length})
                  </CardTitle>
                  <CardDescription>
                    Build your automation workflow step by step
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Steps List */}
              {steps.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12">
                  <GitBranch className="text-muted-foreground mb-3 h-10 w-10" />
                  <p className="text-muted-foreground mb-1 text-sm font-medium">
                    No steps yet
                  </p>
                  <p className="text-muted-foreground mb-4 text-xs">
                    Add your first step to start building the sequence
                  </p>
                </div>
              )}

              {steps.map((step, index) => {
                const isExpanded = expandedStep === step.id;
                return (
                  <div
                    key={step.id}
                    className={`rounded-lg border-2 p-4 ${STEP_COLORS[step.type] || "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900"}`}
                  >
                    {/* Step Header */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="text-muted-foreground h-4 w-4 shrink-0 cursor-grab" />
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-muted shadow-sm">
                        {STEP_ICONS[step.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">
                          {index + 1}.{" "}
                          {step.name || SEQUENCE_STEP_TYPE_LABELS[step.type]}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {SEQUENCE_STEP_TYPE_LABELS[step.type]}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStep(step.id, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStep(step.id, "down")}
                          disabled={index === steps.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setExpandedStep(isExpanded ? null : step.id)
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-7 w-7"
                          onClick={() => removeStep(step.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Step Config (Expanded) */}
                    {isExpanded && (
                      <div className="mt-4 space-y-3 rounded-md bg-white dark:bg-muted p-4">
                        <div>
                          <Label>Step Name</Label>
                          <Input
                            value={step.name || ""}
                            onChange={(e) =>
                              updateStep(step.id, { name: e.target.value })
                            }
                            placeholder={SEQUENCE_STEP_TYPE_LABELS[step.type]}
                          />
                        </div>

                        {step.type === "email" && (
                          <EmailStepConfig step={step} onUpdate={updateStep} />
                        )}
                        {step.type === "sms" && (
                          <SmsStepConfig step={step} onUpdate={updateStep} />
                        )}
                        {step.type === "whatsapp" && (
                          <WhatsAppStepConfig
                            step={step}
                            onUpdate={updateStep}
                          />
                        )}
                        {step.type === "delay" && (
                          <DelayStepConfig step={step} onUpdate={updateStep} />
                        )}
                        {step.type === "condition" && (
                          <ConditionStepConfig
                            step={step}
                            onUpdate={updateStep}
                          />
                        )}
                        {step.type === "action" && (
                          <ActionStepConfig step={step} onUpdate={updateStep} />
                        )}
                        {step.type === "split" && (
                          <SplitStepConfig step={step} onUpdate={updateStep} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Step Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {(
                  Object.keys(SEQUENCE_STEP_TYPE_LABELS) as SequenceStepType[]
                ).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addStep(type)}
                    className="gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    {STEP_ICONS[type]}
                    {SEQUENCE_STEP_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STEP CONFIG COMPONENTS
// ============================================================================

function SmsStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  const message = (step.config?.message as string) || "";
  const charCount = message.length;
  return (
    <>
      <div>
        <Label>SMS Message</Label>
        <Textarea
          value={message}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, message: e.target.value },
            })
          }
          placeholder="Type your SMS message... Use {{first_name}} for personalization"
          rows={4}
          maxLength={1600}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          {charCount} / 1600 characters &middot;{" "}
          {Math.ceil(charCount / 160) || 1} segment(s)
        </p>
      </div>
    </>
  );
}

function WhatsAppStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Template Name</Label>
        <Input
          value={(step.config?.templateName as string) || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, templateName: e.target.value },
            })
          }
          placeholder="e.g., welcome_message"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Must match an approved WhatsApp template name
        </p>
      </div>
      <div>
        <Label>Language Code</Label>
        <Input
          value={(step.config?.languageCode as string) || "en_US"}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, languageCode: e.target.value },
            })
          }
          placeholder="en_US"
        />
      </div>
    </>
  );
}

function EmailStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Subject Line</Label>
        <Input
          value={(step.config?.subject as string) || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, subject: e.target.value },
            })
          }
          placeholder="Email subject line"
        />
      </div>
      <div>
        <Label>Preview Text</Label>
        <Input
          value={(step.config?.previewText as string) || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, previewText: e.target.value },
            })
          }
          placeholder="Preview text shown in inbox"
        />
      </div>
      <div>
        <Label>Template ID (optional)</Label>
        <Input
          value={step.templateId || ""}
          onChange={(e) => onUpdate(step.id, { templateId: e.target.value })}
          placeholder="Select or paste template ID"
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Link an existing email template, or leave empty to use inline content
        </p>
      </div>
    </>
  );
}

function DelayStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Delay Duration</Label>
        <div className="flex flex-wrap gap-2">
          {DELAY_PRESETS.map((preset) => (
            <Button
              key={preset.minutes}
              variant={
                step.delayMinutes === preset.minutes ? "default" : "outline"
              }
              size="sm"
              onClick={() =>
                onUpdate(step.id, { delayMinutes: preset.minutes })
              }
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label>Custom (minutes)</Label>
        <Input
          type="number"
          value={step.delayMinutes || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              delayMinutes: parseInt(e.target.value) || 0,
            })
          }
          min={1}
          placeholder="Custom minutes"
        />
      </div>
    </>
  );
}

function ConditionStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Field</Label>
        <Select
          value={step.conditionField || ""}
          onValueChange={(v) => onUpdate(step.id, { conditionField: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email_opened">Email Opened</SelectItem>
            <SelectItem value="email_clicked">Email Clicked</SelectItem>
            <SelectItem value="tag">Has Tag</SelectItem>
            <SelectItem value="custom_field">Custom Field</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Operator</Label>
        <Select
          value={step.conditionOperator || ""}
          onValueChange={(v) => onUpdate(step.id, { conditionOperator: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Not Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="is_true">Is True</SelectItem>
            <SelectItem value="is_false">Is False</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Value</Label>
        <Input
          value={step.conditionValue || ""}
          onChange={(e) =>
            onUpdate(step.id, { conditionValue: e.target.value })
          }
          placeholder="Condition value"
        />
      </div>
    </>
  );
}

function ActionStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Action Type</Label>
        <Select
          value={(step.config?.actionType as string) || ""}
          onValueChange={(v) =>
            onUpdate(step.id, {
              config: { ...step.config, actionType: v },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_tag">Add Tag</SelectItem>
            <SelectItem value="remove_tag">Remove Tag</SelectItem>
            <SelectItem value="add_to_list">Add to List</SelectItem>
            <SelectItem value="remove_from_list">Remove from List</SelectItem>
            <SelectItem value="update_field">Update Field</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="notify_team">Notify Team</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Value</Label>
        <Input
          value={(step.config?.actionValue as string) || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, actionValue: e.target.value },
            })
          }
          placeholder="Action value"
        />
      </div>
    </>
  );
}

function SplitStepConfig({
  step,
  onUpdate,
}: {
  step: SequenceStep;
  onUpdate: (id: string, updates: Partial<SequenceStep>) => void;
}) {
  return (
    <>
      <div>
        <Label>Split Ratio (% for Path A)</Label>
        <Input
          type="number"
          value={(step.config?.splitRatio as number) || 50}
          onChange={(e) =>
            onUpdate(step.id, {
              config: {
                ...step.config,
                splitRatio: parseInt(e.target.value) || 50,
              },
            })
          }
          min={1}
          max={99}
        />
        <p className="text-muted-foreground mt-1 text-xs">
          Path A: {(step.config?.splitRatio as number) || 50}% — Path B:{" "}
          {100 - ((step.config?.splitRatio as number) || 50)}%
        </p>
      </div>
      <div>
        <Label>Split Name</Label>
        <Input
          value={(step.config?.splitName as string) || ""}
          onChange={(e) =>
            onUpdate(step.id, {
              config: { ...step.config, splitName: e.target.value },
            })
          }
          placeholder="e.g., Subject Line Test"
        />
      </div>
    </>
  );
}
