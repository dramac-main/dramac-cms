/**
 * Campaign Creation Wizard
 * Phase MKT-02: Email Campaign Engine (UI)
 *
 * 4-step wizard: Details → Audience → Content → Review & Send
 */
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Users,
  Paintbrush,
  Send,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  createCampaign,
  sendCampaignNow,
} from "../../actions/campaign-actions";
import { MARKETING_LIMITS } from "../../lib/marketing-constants";
import type { CampaignType } from "../../types";

interface CampaignWizardProps {
  siteId: string;
}

type WizardStep = "details" | "audience" | "content" | "review";

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "audience", label: "Audience", icon: Users },
  { id: "content", label: "Content", icon: Paintbrush },
  { id: "review", label: "Review", icon: Send },
];

export function CampaignWizard({ siteId }: CampaignWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStep, setCurrentStep] = useState<WizardStep>("details");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<CampaignType>("email");
  const [subjectLine, setSubjectLine] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [audienceType, setAudienceType] = useState("all_subscribers");
  const [contentHtml, setContentHtml] = useState("");
  const [tags, setTags] = useState("");

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  function goNext() {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case "details":
        return type === "sms" || type === "whatsapp"
          ? name.trim().length > 0
          : name.trim().length > 0 && subjectLine.trim().length > 0;
      case "audience":
        return true; // always valid — defaults to all_subscribers
      case "content":
        return contentHtml.trim().length > 0;
      case "review":
        return true;
      default:
        return false;
    }
  }

  async function handleCreate(sendImmediately?: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        const campaign = await createCampaign(siteId, {
          name: name.trim(),
          type,
          description: description.trim() || undefined,
          subjectLine: subjectLine.trim(),
          previewText: previewText.trim() || undefined,
          fromName: fromName.trim() || undefined,
          fromEmail: fromEmail.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        });

        if (sendImmediately) {
          await sendCampaignNow(siteId, (campaign as any).id);
        }

        router.push(
          `/dashboard/sites/${siteId}/marketing/campaigns/${(campaign as any).id}`,
        );
      } catch (err: any) {
        setError(err.message || "Failed to create campaign");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (index <= currentStepIndex) setCurrentStep(step.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {step.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Details */}
          {currentStep === "details" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Campaign Details</h3>
                <p className="text-sm text-muted-foreground">
                  Set the basic information for your campaign
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., June Newsletter"
                    maxLength={MARKETING_LIMITS.campaignNameMax}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Internal notes about this campaign"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as CampaignType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="multi_channel">
                        Multi-Channel
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    placeholder="e.g., Your monthly update is here!"
                    maxLength={MARKETING_LIMITS.subjectLineMax}
                  />
                </div>
                <div>
                  <Label htmlFor="preview">Preview Text</Label>
                  <Input
                    id="preview"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Shown after the subject in inbox"
                    maxLength={MARKETING_LIMITS.previewTextMax}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Defaults to site settings"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromEmail">From Email</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="Defaults to site settings"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={replyTo}
                    onChange={(e) => setReplyTo(e.target.value)}
                    placeholder="Defaults to from email"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {currentStep === "audience" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Select Audience</h3>
                <p className="text-sm text-muted-foreground">
                  Choose who will receive this campaign
                </p>
              </div>

              <div>
                <Label>Audience Type</Label>
                <Select value={audienceType} onValueChange={setAudienceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_subscribers">
                      All Subscribers
                    </SelectItem>
                    <SelectItem value="all_contacts">All Contacts</SelectItem>
                    <SelectItem value="list">Mailing List</SelectItem>
                    <SelectItem value="segment">Segment</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {audienceType === "all_subscribers" &&
                    "Send to all active subscribers"}
                  {audienceType === "all_contacts" &&
                    "Send to all CRM contacts with email opt-in"}
                  {audienceType === "list" && "Send to a specific mailing list"}
                  {audienceType === "segment" &&
                    "Send to a pre-defined audience segment"}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {currentStep === "content" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {type === "sms"
                    ? "SMS"
                    : type === "whatsapp"
                      ? "WhatsApp"
                      : "Email"}{" "}
                  Content
                </h3>
                <p className="text-sm text-muted-foreground">
                  {type === "sms"
                    ? "Compose your SMS message"
                    : type === "whatsapp"
                      ? "Configure your WhatsApp template message"
                      : "Compose your email content"}
                </p>
              </div>

              {type === "sms" ? (
                <div>
                  <Label htmlFor="smsContent">SMS Message</Label>
                  <Textarea
                    id="smsContent"
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="Type your SMS message... Use {{first_name}} for personalization"
                    rows={5}
                    maxLength={1600}
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      Use {"{{first_name}}"}, {"{{last_name}}"} for merge
                      variables
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contentHtml.length} / 1600 &middot;{" "}
                      {Math.ceil(contentHtml.length / 160) || 1} segment(s)
                    </p>
                  </div>
                </div>
              ) : type === "whatsapp" ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="waTemplate">Template Name</Label>
                    <Input
                      id="waTemplate"
                      value={contentHtml}
                      onChange={(e) => setContentHtml(e.target.value)}
                      placeholder="e.g., welcome_offer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Must match an approved WhatsApp message template
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="contentHtml">Email Body (HTML)</Label>
                  <Textarea
                    id="contentHtml"
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="<h1>Hello {{first_name}}</h1><p>Your content here...</p>"
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{{variable}}"} syntax for merge variables. Available:{" "}
                    {
                      "{{first_name}}, {{last_name}}, {{email}}, {{unsubscribe_url}}"
                    }
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., newsletter, june-2025"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Review & Send</h3>
                <p className="text-sm text-muted-foreground">
                  Review your campaign before sending
                </p>
              </div>

              <div className="space-y-3 bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Campaign Name
                    </p>
                    <p className="text-sm">{name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Type
                    </p>
                    <p className="text-sm capitalize">{type}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Subject Line
                    </p>
                    <p className="text-sm">{subjectLine}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Audience
                    </p>
                    <p className="text-sm capitalize">
                      {audienceType.replace(/_/g, " ")}
                    </p>
                  </div>
                  {fromName && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        From
                      </p>
                      <p className="text-sm">
                        {fromName} {fromEmail ? `<${fromEmail}>` : ""}
                      </p>
                    </div>
                  )}
                  {tags && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {contentHtml && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Content Preview
                  </p>
                  <div className="border rounded-lg p-4 bg-white max-h-48 overflow-y-auto">
                    <div
                      dangerouslySetInnerHTML={{ __html: contentHtml }}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {currentStep === "review" ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleCreate(false)}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save as Draft
              </Button>
              <Button onClick={() => handleCreate(true)} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Send className="mr-2 h-4 w-4" />
                Create & Send
              </Button>
            </>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
