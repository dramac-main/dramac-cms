"use client";

/**
 * Chat Message Templates Settings
 *
 * Allows site owners to customize proactive AI chat messages.
 * Each message type can be edited with {{merge_variable}} support
 * and can be individually enabled/disabled.
 */

import { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CreditCard,
  Package,
  FileText,
  Calendar,
  Pencil,
  RotateCcw,
  Info,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import {
  CHAT_MESSAGE_TEMPLATE_CONFIGS,
  type ChatMessageEventType,
} from "@/modules/live-chat/lib/chat-template-resolver";
import {
  getChatMessageTemplates,
  saveChatMessageTemplate,
  toggleChatMessageTemplate,
  resetChatMessageTemplate,
  type ChatMessageTemplateRow,
} from "@/modules/live-chat/actions/chat-template-actions";

interface ChatMessageTemplatesProps {
  siteId: string;
}

// Category grouping for the UI
interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  eventTypes: ChatMessageEventType[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    label: "Payment",
    icon: <CreditCard className="h-4 w-4" />,
    eventTypes: ["payment_proof_uploaded", "payment_confirmed"],
  },
  {
    label: "Orders",
    icon: <Package className="h-4 w-4" />,
    eventTypes: [
      "order_confirmed",
      "order_processing",
      "order_shipped",
      "order_delivered",
      "order_cancelled",
      "order_refunded",
      "order_status_generic",
    ],
  },
  {
    label: "Quotes",
    icon: <FileText className="h-4 w-4" />,
    eventTypes: [
      "quote_converted",
      "quote_requested",
      "quote_sent",
      "quote_accepted",
      "quote_rejected",
      "quote_amendment_requested",
    ],
  },
  {
    label: "Bookings",
    icon: <Calendar className="h-4 w-4" />,
    eventTypes: [
      "booking_created",
      "booking_confirmed",
      "booking_cancelled",
      "booking_rescheduled",
      "booking_completed",
      "booking_payment_confirmed",
    ],
  },
];

interface TemplateState {
  message_template: string;
  enabled: boolean;
  isCustom: boolean; // true if saved in DB, false if using default
}

export function ChatMessageTemplates({ siteId }: ChatMessageTemplatesProps) {
  const [templates, setTemplates] = useState<Record<string, TemplateState>>({});
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<ChatMessageEventType | null>(
    null,
  );
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const loadedRef = useRef<boolean | null>(null);

  // Load templates from DB and merge with defaults
  const loadTemplates = useCallback(async () => {
    const { templates: dbTemplates } = await getChatMessageTemplates(siteId);

    const dbMap = new Map<string, ChatMessageTemplateRow>();
    for (const t of dbTemplates) {
      dbMap.set(t.event_type, t);
    }

    const merged: Record<string, TemplateState> = {};
    for (const [eventType, config] of Object.entries(
      CHAT_MESSAGE_TEMPLATE_CONFIGS,
    )) {
      const dbRow = dbMap.get(eventType);
      if (dbRow) {
        merged[eventType] = {
          message_template: dbRow.message_template,
          enabled: dbRow.enabled,
          isCustom: true,
        };
      } else {
        merged[eventType] = {
          message_template: config.defaultMessage,
          enabled: true, // enabled by default
          isCustom: false,
        };
      }
    }

    setTemplates(merged);
    setLoading(false);
  }, [siteId]);

  // Load on first render
  if (loadedRef.current == null) {
    loadedRef.current = true;
    loadTemplates();
  }

  const handleToggle = async (
    eventType: ChatMessageEventType,
    enabled: boolean,
  ) => {
    // Optimistic update
    setTemplates((prev) => ({
      ...prev,
      [eventType]: { ...prev[eventType], enabled },
    }));

    const { error } = await toggleChatMessageTemplate(
      siteId,
      eventType,
      enabled,
    );
    if (error) {
      // Revert on error
      setTemplates((prev) => ({
        ...prev,
        [eventType]: { ...prev[eventType], enabled: !enabled },
      }));
    }
  };

  const handleEdit = (eventType: ChatMessageEventType) => {
    const template = templates[eventType];
    setEditValue(template?.message_template || "");
    setEditingType(eventType);
  };

  const handleSave = async () => {
    if (!editingType) return;
    setSaving(true);

    const { error } = await saveChatMessageTemplate(
      siteId,
      editingType,
      editValue,
      templates[editingType]?.enabled ?? true,
    );

    if (!error) {
      setTemplates((prev) => ({
        ...prev,
        [editingType]: {
          message_template: editValue,
          enabled: prev[editingType]?.enabled ?? true,
          isCustom: true,
        },
      }));
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setEditingType(null);
      }, 1000);
    }
    setSaving(false);
  };

  const handleReset = async (eventType: ChatMessageEventType) => {
    const config = CHAT_MESSAGE_TEMPLATE_CONFIGS[eventType];
    if (!config) return;

    const { error } = await resetChatMessageTemplate(siteId, eventType);
    if (!error) {
      setTemplates((prev) => ({
        ...prev,
        [eventType]: {
          message_template: config.defaultMessage,
          enabled: true,
          isCustom: false,
        },
      }));
    }
  };

  const editingConfig = editingType
    ? CHAT_MESSAGE_TEMPLATE_CONFIGS[editingType]
    : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Chat Message Templates</CardTitle>
          <CardDescription>
            Customize the proactive messages Chiko sends to customers during
            events like payment confirmations, order updates, and booking
            changes. Use {"{{variables}}"} for dynamic content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {CATEGORIES.map((category) => {
              const enabledCount = category.eventTypes.filter(
                (et) => templates[et]?.enabled,
              ).length;
              const customCount = category.eventTypes.filter(
                (et) => templates[et]?.isCustom,
              ).length;

              return (
                <AccordionItem
                  key={category.label}
                  value={category.label}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      {category.icon}
                      <span className="font-medium">{category.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {enabledCount}/{category.eventTypes.length} active
                      </Badge>
                      {customCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {customCount} customized
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {category.eventTypes.map((eventType) => {
                        const config = CHAT_MESSAGE_TEMPLATE_CONFIGS[eventType];
                        const state = templates[eventType];
                        if (!config || !state) return null;

                        return (
                          <div
                            key={eventType}
                            className="flex items-start gap-3 p-3 border rounded-md bg-muted/30"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {config.label}
                                </span>
                                {state.isCustom && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-blue-600"
                                  >
                                    Customized
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {config.description}
                              </p>
                              <p className="text-xs text-muted-foreground/70 line-clamp-2 italic">
                                &ldquo;{state.message_template}&rdquo;
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(eventType)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {state.isCustom && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReset(eventType)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  title="Reset to default"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Switch
                                checked={state.enabled}
                                onCheckedChange={(checked) =>
                                  handleToggle(eventType, checked)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingType}
        onOpenChange={(open) => !open && setEditingType(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit: {editingConfig?.label || "Message Template"}
            </DialogTitle>
            <DialogDescription>{editingConfig?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Message Template</Label>
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={5}
                className="mt-1.5 font-mono text-sm"
                placeholder="Enter your custom message..."
              />
            </div>

            {editingConfig?.variables && editingConfig.variables.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Available Variables
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {editingConfig.variables.map((v) => (
                    <div
                      key={v.key}
                      className="flex items-center gap-2 text-xs"
                    >
                      <code className="px-1.5 py-0.5 bg-background rounded border text-[11px]">
                        {`{{${v.key}}}`}
                      </code>
                      <span className="text-muted-foreground">{v.label}</span>
                      <span className="text-muted-foreground/50">
                        e.g. {v.example}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingType(null)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || saved}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : saved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
