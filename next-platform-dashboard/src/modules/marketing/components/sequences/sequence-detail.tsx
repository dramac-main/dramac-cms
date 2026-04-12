"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Archive,
  GitBranch,
  Users,
  CheckCircle2,
  Target,
  Mail,
  Clock,
  Zap,
  Split,
  Pencil,
} from "lucide-react";
import {
  SEQUENCE_STATUS_LABELS,
  SEQUENCE_STEP_TYPE_LABELS,
  VALID_SEQUENCE_TRANSITIONS,
} from "../../lib/marketing-constants";
import { updateSequenceStatus } from "../../actions/sequence-actions";
import type {
  Sequence,
  SequenceStatus,
  SequenceStep,
  SequenceEnrollment,
} from "../../types/sequence-types";

interface SequenceDetailProps {
  siteId: string;
  sequence: Sequence;
  enrollments: SequenceEnrollment[];
  enrollmentTotal: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  archived: "bg-red-100 text-red-700",
};

const STATUS_ACTION_CONFIG: Record<
  string,
  { icon: React.ReactNode; variant: "default" | "outline" | "destructive" }
> = {
  active: { icon: <Play className="mr-2 h-4 w-4" />, variant: "default" },
  paused: { icon: <Pause className="mr-2 h-4 w-4" />, variant: "outline" },
  archived: {
    icon: <Archive className="mr-2 h-4 w-4" />,
    variant: "destructive",
  },
  draft: {
    icon: <GitBranch className="mr-2 h-4 w-4" />,
    variant: "outline",
  },
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  delay: <Clock className="h-4 w-4" />,
  condition: <GitBranch className="h-4 w-4" />,
  action: <Zap className="h-4 w-4" />,
  split: <Split className="h-4 w-4" />,
};

const STEP_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-700 border-blue-200",
  delay: "bg-amber-100 text-amber-700 border-amber-200",
  condition: "bg-purple-100 text-purple-700 border-purple-200",
  action: "bg-emerald-100 text-emerald-700 border-emerald-200",
  split: "bg-pink-100 text-pink-700 border-pink-200",
};

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function SequenceDetail({
  siteId,
  sequence,
  enrollments,
  enrollmentTotal,
}: SequenceDetailProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("overview");

  const seq = sequence as any;
  const status = (seq.status || "draft") as SequenceStatus;
  const steps = (seq.steps || []) as SequenceStep[];
  const transitions = VALID_SEQUENCE_TRANSITIONS[status] || [];
  const basePath = `/dashboard/sites/${params.siteId}/marketing`;

  const conversionRate =
    seq.total_enrolled > 0
      ? ((seq.total_converted / seq.total_enrolled) * 100).toFixed(1)
      : "0";

  function handleStatusChange(newStatus: SequenceStatus) {
    startTransition(async () => {
      try {
        await updateSequenceStatus(siteId, seq.id, newStatus);
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
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{seq.name}</h1>
              <Badge variant="secondary" className={STATUS_COLORS[status]}>
                {SEQUENCE_STATUS_LABELS[status] || status}
              </Badge>
            </div>
            {seq.description && (
              <p className="text-muted-foreground mt-1">{seq.description}</p>
            )}
            <p className="text-muted-foreground mt-1 text-sm">
              Trigger: {(seq.trigger_type || "manual").replace(/_/g, " ")}
            </p>
          </div>
          <div className="flex gap-2">
            {status === "draft" && (
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`${basePath}/sequences/${seq.id}/edit`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {transitions.map((t) => {
              const config = STATUS_ACTION_CONFIG[t] || {
                icon: null,
                variant: "outline" as const,
              };
              return (
                <Button
                  key={t}
                  variant={config.variant}
                  onClick={() => handleStatusChange(t)}
                  disabled={isPending}
                >
                  {config.icon}
                  {SEQUENCE_STATUS_LABELS[t]}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{seq.total_enrolled || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{seq.total_completed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              Converted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{seq.total_converted || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <GitBranch className="mr-2 h-4 w-4" />
            Steps ({steps.length})
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="mr-2 h-4 w-4" />
            Enrollments ({enrollmentTotal})
          </TabsTrigger>
        </TabsList>

        {/* Steps Timeline */}
        <TabsContent value="overview" className="mt-4">
          {steps.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <GitBranch className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  No steps configured. Edit the sequence to add steps.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {steps
                .sort((a, b) => a.position - b.position)
                .map((step, index) => (
                  <div key={step.id} className="flex items-stretch gap-4">
                    {/* Connector Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${STEP_COLORS[step.type] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                      >
                        {STEP_ICONS[step.type] || <Zap className="h-4 w-4" />}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="bg-border w-0.5 flex-1" />
                      )}
                    </div>

                    {/* Step Content */}
                    <Card className="mb-4 flex-1">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {step.name ||
                              SEQUENCE_STEP_TYPE_LABELS[step.type] ||
                              step.type}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {SEQUENCE_STEP_TYPE_LABELS[step.type]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <StepDetails step={step} />
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        {/* Enrollments */}
        <TabsContent value="enrollments" className="mt-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="text-muted-foreground mb-3 h-10 w-10" />
                <p className="text-muted-foreground text-sm">
                  No subscribers enrolled yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">
                        Subscriber
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Current Step
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Enrolled
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Steps Done
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment: any) => (
                      <tr
                        key={enrollment.id}
                        className="border-b last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {enrollment.subscriber_id?.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {enrollment.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {enrollment.current_step_id
                            ? steps.find(
                                (s) => s.id === enrollment.current_step_id,
                              )?.name || "Step"
                            : "—"}
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">
                          {new Date(enrollment.enrolled_at).toLocaleDateString(
                            "en-ZM",
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {(enrollment.steps_completed || []).length}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StepDetails({ step }: { step: SequenceStep }) {
  switch (step.type) {
    case "email":
      return (
        <p className="text-muted-foreground text-xs">
          {step.templateId
            ? `Template: ${step.templateId.slice(0, 8)}...`
            : "No template selected"}
          {step.config?.subject ? ` — Subject: "${step.config.subject}"` : ""}
        </p>
      );
    case "delay":
      return (
        <p className="text-muted-foreground text-xs">
          Wait {step.delayMinutes ? formatDelay(step.delayMinutes) : "not set"}
        </p>
      );
    case "condition":
      return (
        <p className="text-muted-foreground text-xs">
          If {step.conditionField || "?"} {step.conditionOperator || "?"}{" "}
          {step.conditionValue || "?"}
        </p>
      );
    case "split":
      return (
        <p className="text-muted-foreground text-xs">
          A/B split test
          {step.config?.splitRatio ? ` (${step.config.splitRatio}%)` : ""}
        </p>
      );
    case "action":
      return (
        <p className="text-muted-foreground text-xs">
          {(step.config?.actionType as string) || "Custom action"}
          {step.config?.description ? `: ${step.config.description}` : ""}
        </p>
      );
    default:
      return null;
  }
}
