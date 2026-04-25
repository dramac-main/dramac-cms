"use client";

/**
 * Scripted Flows Manager — client component.
 *
 * Renders one card per flow with:
 *   - Enable toggle (instant)
 *   - Name + slug + description
 *   - Trigger keywords (comma-separated chips)
 *   - Priority + usage analytics
 *   - "Edit" button that opens an inline JSON editor for steps
 *   - "Delete" button (refuses default flows)
 *
 * Plus a "New flow" button that opens a blank editor.
 */

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import {
  createScriptedFlow,
  updateScriptedFlow,
  toggleScriptedFlow,
  deleteScriptedFlow,
} from "@/lib/portal/actions/live-chat-scripted-flows-actions";

export interface ScriptedFlowRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  trigger_keywords: string[];
  trigger_intents: string[];
  is_enabled: boolean;
  is_default: boolean;
  priority: number;
  steps: unknown[];
  usage_count: number;
  completion_count: number;
  handoff_count: number;
  last_triggered_at: string | null;
  updated_at: string;
}

interface ManagerProps {
  siteId: string;
  flows: ScriptedFlowRow[];
}

interface EditorState {
  mode: "create" | "edit";
  flowId?: string;
  slug: string;
  name: string;
  description: string;
  triggerKeywords: string;
  isEnabled: boolean;
  priority: number;
  stepsJson: string;
}

function emptyEditorState(): EditorState {
  return {
    mode: "create",
    slug: "",
    name: "",
    description: "",
    triggerKeywords: "",
    isEnabled: true,
    priority: 100,
    stepsJson: '[\n  { "type": "message", "text": "Hello!" }\n]',
  };
}

function fromFlow(flow: ScriptedFlowRow): EditorState {
  return {
    mode: "edit",
    flowId: flow.id,
    slug: flow.slug,
    name: flow.name,
    description: flow.description ?? "",
    triggerKeywords: flow.trigger_keywords.join(", "),
    isEnabled: flow.is_enabled,
    priority: flow.priority,
    stepsJson: JSON.stringify(flow.steps, null, 2),
  };
}

export function ScriptedFlowsManager({ siteId, flows }: ManagerProps) {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!editor) return;
    let parsedSteps: unknown[] = [];
    try {
      const parsed = JSON.parse(editor.stepsJson);
      if (!Array.isArray(parsed)) {
        toast.error("Steps must be a JSON array.");
        return;
      }
      parsedSteps = parsed;
    } catch {
      toast.error("Steps is not valid JSON.");
      return;
    }

    const keywords = editor.triggerKeywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    startTransition(async () => {
      const payload = {
        slug: editor.slug,
        name: editor.name,
        description: editor.description || undefined,
        triggerKeywords: keywords,
        isEnabled: editor.isEnabled,
        priority: editor.priority,
        steps: parsedSteps,
      };
      const res =
        editor.mode === "edit" && editor.flowId
          ? await updateScriptedFlow(siteId, editor.flowId, payload)
          : await createScriptedFlow(siteId, payload);
      if (res.ok) {
        toast.success(
          editor.mode === "edit" ? "Flow updated." : "Flow created.",
        );
        setEditor(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const onToggle = (flow: ScriptedFlowRow, next: boolean) => {
    startTransition(async () => {
      const res = await toggleScriptedFlow(siteId, flow.id, next);
      if (res.ok) {
        toast.success(next ? "Flow enabled." : "Flow disabled.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const onDelete = (flow: ScriptedFlowRow) => {
    if (flow.is_default) {
      toast.error("Default flows cannot be deleted. Disable them instead.");
      return;
    }
    if (!confirm(`Delete "${flow.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteScriptedFlow(siteId, flow.id);
      if (res.ok) {
        toast.success("Flow deleted.");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {flows.length} flow{flows.length === 1 ? "" : "s"} configured
        </p>
        <Button
          onClick={() => setEditor(emptyEditorState())}
          disabled={isPending}
        >
          <PlusIcon className="mr-2 size-4" />
          New flow
        </Button>
      </div>

      {flows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No scripted flows yet. Defaults will be seeded automatically the
            next time the widget runs, or click <em>New flow</em> to add one.
          </CardContent>
        </Card>
      ) : (
        flows.map((flow) => (
          <Card key={flow.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  {flow.name}
                  {flow.is_default && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                  {!flow.is_enabled && (
                    <Badge variant="outline">Disabled</Badge>
                  )}
                </CardTitle>
                <p className="font-mono text-xs text-muted-foreground">
                  {flow.slug} · priority {flow.priority}
                </p>
                {flow.description && (
                  <p className="text-sm text-muted-foreground">
                    {flow.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={flow.is_enabled}
                  onCheckedChange={(v) => onToggle(flow, v)}
                  disabled={isPending}
                  aria-label={`Toggle ${flow.name}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditor(fromFlow(flow))}
                  disabled={isPending}
                  aria-label={`Edit ${flow.name}`}
                >
                  <PencilIcon className="size-4" />
                </Button>
                {!flow.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(flow)}
                    disabled={isPending}
                    aria-label={`Delete ${flow.name}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {flow.trigger_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Triggers:
                  </span>
                  {flow.trigger_keywords.map((k) => (
                    <Badge key={k} variant="outline" className="font-mono">
                      {k}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Triggered:</span>{" "}
                  {flow.usage_count}
                </div>
                <div>
                  <span className="font-medium">Completed:</span>{" "}
                  {flow.completion_count}
                </div>
                <div>
                  <span className="font-medium">Handoffs:</span>{" "}
                  {flow.handoff_count}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {editor && (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {editor.mode === "edit" ? "Edit flow" : "New flow"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditor(null)}
              disabled={isPending}
              aria-label="Close editor"
            >
              <XIcon className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="flow-slug">Slug</Label>
                <Input
                  id="flow-slug"
                  value={editor.slug}
                  onChange={(e) =>
                    setEditor({ ...editor, slug: e.target.value })
                  }
                  placeholder="welcome-flow"
                  disabled={editor.mode === "edit" && isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase identifier (a–z, 0–9, dashes, underscores).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flow-name">Name</Label>
                <Input
                  id="flow-name"
                  value={editor.name}
                  onChange={(e) =>
                    setEditor({ ...editor, name: e.target.value })
                  }
                  placeholder="Welcome flow"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flow-desc">Description</Label>
              <Textarea
                id="flow-desc"
                value={editor.description}
                onChange={(e) =>
                  setEditor({ ...editor, description: e.target.value })
                }
                rows={2}
                placeholder="What this flow does and when it fires."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="flow-keywords">
                  Trigger keywords (comma-separated)
                </Label>
                <Input
                  id="flow-keywords"
                  value={editor.triggerKeywords}
                  onChange={(e) =>
                    setEditor({ ...editor, triggerKeywords: e.target.value })
                  }
                  placeholder="hello, hi, hey"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flow-priority">Priority (0–1000)</Label>
                <Input
                  id="flow-priority"
                  type="number"
                  min={0}
                  max={1000}
                  value={editor.priority}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      priority: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="flow-enabled"
                checked={editor.isEnabled}
                onCheckedChange={(v) => setEditor({ ...editor, isEnabled: v })}
              />
              <Label htmlFor="flow-enabled" className="cursor-pointer">
                Enabled
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flow-steps">Steps (JSON array)</Label>
              <Textarea
                id="flow-steps"
                value={editor.stepsJson}
                onChange={(e) =>
                  setEditor({ ...editor, stepsJson: e.target.value })
                }
                rows={12}
                className="font-mono text-xs"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Each step is an object with a <code>type</code> field. See the
                docs for available step types.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setEditor(null)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button onClick={submit} disabled={isPending}>
                {isPending
                  ? "Saving..."
                  : editor.mode === "edit"
                    ? "Save changes"
                    : "Create flow"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
