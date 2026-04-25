"use client";

import { useState, useTransition } from "react";
import { Bot, Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  updateChikoAiSettings,
  type ChikoAiSettingsUpdate,
} from "@/lib/portal/actions/live-chat-ai-settings-actions";

interface Props {
  siteId: string;
  initial: ChikoAiSettingsUpdate;
}

export function ChikoAiSettingsForm({ siteId, initial }: Props) {
  const [state, setState] = useState<ChikoAiSettingsUpdate>(initial);
  const [isPending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await updateChikoAiSettings(siteId, state);
      if (result.ok) {
        toast.success(
          state.aiAutoResponseEnabled
            ? "Chiko AI enabled for this site."
            : "Chiko AI disabled for this site.",
        );
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Chiko AI Auto-Response
              </CardTitle>
              <CardDescription>
                When enabled, Chiko automatically responds to new visitor
                messages. When disabled, every conversation waits for a human
                agent. Your customers never see the words &quot;AI&quot; or
                &quot;Chiko&quot; — they just see the assistant name below.
              </CardDescription>
            </div>
            <Badge
              variant={state.aiAutoResponseEnabled ? "default" : "secondary"}
            >
              {state.aiAutoResponseEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="ai-enabled" className="text-base font-medium">
                Enable auto-responses
              </Label>
              <p className="text-sm text-muted-foreground">
                Disable if you want every conversation to wait for a human.
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={state.aiAutoResponseEnabled}
              onCheckedChange={(v) =>
                setState((s) => ({ ...s, aiAutoResponseEnabled: v }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assistant-name">Assistant display name</Label>
              <Input
                id="assistant-name"
                value={state.assistantName}
                onChange={(e) =>
                  setState((s) => ({ ...s, assistantName: e.target.value }))
                }
                placeholder="Chiko"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tone">Response tone</Label>
              <select
                id="tone"
                value={state.responseTone}
                onChange={(e) =>
                  setState((s) => ({ ...s, responseTone: e.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="concise">Concise</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handoff">Hand-off message</Label>
            <Textarea
              id="handoff"
              value={state.handoffMessage}
              onChange={(e) =>
                setState((s) => ({ ...s, handoffMessage: e.target.value }))
              }
              placeholder="An agent will be with you shortly."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Shown when the AI hands off to a human agent. Leave blank for the
              default fallback.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
