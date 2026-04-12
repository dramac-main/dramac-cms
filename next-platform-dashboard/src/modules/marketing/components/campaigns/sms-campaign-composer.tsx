/**
 * SMS Campaign Component
 * Phase MKT-08: SMS & WhatsApp Channel Foundation
 *
 * Compose and send SMS campaigns with character counting,
 * segment calculation, and personalization preview.
 */
"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Smartphone,
  Users,
  Save,
  Loader2,
  Info,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createCampaign } from "../../actions/campaign-actions";
import { sendSMSCampaignBatch } from "../../actions/sms-actions";
import { MARKETING_LIMITS } from "../../lib/marketing-constants";
import { calculateSMSSegments } from "../../services/sms-utils";

interface SMSCampaignComposerProps {
  siteId: string;
}

export function SMSCampaignComposer({ siteId }: SMSCampaignComposerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [audienceType, setAudienceType] = useState("all_subscribers");
  const [tags, setTags] = useState("");

  const smsInfo = useMemo(() => calculateSMSSegments(message), [message]);

  const charCount = message.length;
  const segments = smsInfo.segments;

  function handleSave() {
    if (!name.trim() || !message.trim()) return;

    setError(null);
    startTransition(async () => {
      try {
        const campaign = await createCampaign(siteId, {
          name: name.trim(),
          type: "sms",
          subjectLine: name.trim(), // Re-use subject as campaign identifier
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });

        router.push(
          `/dashboard/sites/${siteId}/marketing/campaigns/${(campaign as any).id}`,
        );
      } catch (err: any) {
        setError(err.message || "Failed to create SMS campaign");
      }
    });
  }

  const basePath = `/dashboard/sites/${siteId}/marketing`;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`${basePath}/campaigns`}
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center text-sm"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Campaigns
        </Link>
        <div className="flex items-center gap-3">
          <Smartphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            New SMS Campaign
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sms-name">Campaign Name *</Label>
            <Input
              id="sms-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Flash Sale Alert"
              maxLength={MARKETING_LIMITS.campaignNameMax}
            />
          </div>
          <div>
            <Label htmlFor="sms-tags">Tags (comma-separated)</Label>
            <Input
              id="sms-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., promo, sms"
            />
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience</CardTitle>
          <CardDescription>
            Only contacts with valid phone numbers will receive SMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={audienceType} onValueChange={setAudienceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_subscribers">
                All Subscribers with Phone
              </SelectItem>
              <SelectItem value="list">Mailing List</SelectItem>
              <SelectItem value="segment">Segment</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Message Composer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message</CardTitle>
          <CardDescription>
            Use {"{{first_name}}"}, {"{{last_name}}"} for personalization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message..."
              rows={5}
              maxLength={MARKETING_LIMITS.smsBodyMax}
            />
          </div>

          {/* Character & Segment Counter */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {charCount} / {MARKETING_LIMITS.smsBodyMax} characters
              </span>
              <Badge variant="outline" className="text-xs">
                {segments} segment{segments !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>
                GSM-7: 160 chars/segment &middot; Unicode: 70 chars/segment
              </span>
            </div>
          </div>

          {/* Preview */}
          {message && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Preview
              </p>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-3 max-w-[280px]">
                <p className="text-sm">
                  {message
                    .replace(/\{\{first_name\}\}/g, "John")
                    .replace(/\{\{last_name\}\}/g, "Doe")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`${basePath}/campaigns`)}
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isPending || !name.trim() || !message.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
}
