/**
 * TestRunDialog — Industry-standard test run experience.
 *
 * Shows a dialog that collects sample trigger data (customer email, name, etc.)
 * based on the workflow's trigger event type, then executes the workflow with
 * that data so every step (email, chat, notification) fires correctly.
 *
 * Inspired by HubSpot "Test with sample data" and Zapier "Test trigger" flows.
 */

"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, Info, FlaskConical } from "lucide-react";

// ============================================================================
// SAMPLE DATA SCHEMAS PER EVENT TYPE
// ============================================================================

interface SampleField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  required?: boolean;
  type?: "text" | "email" | "number" | "datetime-local";
  hint?: string;
}

/**
 * Returns the relevant sample data fields for a given trigger event type.
 * Each field maps to a {{trigger.xxx}} variable used by workflow steps.
 */
function getSampleFieldsForEvent(eventType?: string): SampleField[] {
  // Common fields shared by most events
  const ownerEmail: SampleField = {
    key: "ownerEmail",
    label: "Site Owner Email",
    placeholder: "owner@example.com",
    defaultValue: "",
    type: "email",
    hint: "Auto-resolved from your account if left blank",
  };

  if (!eventType) {
    return [
      ownerEmail,
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "customer@example.com",
        defaultValue: "test@example.com",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Customer",
      },
    ];
  }

  // ---- BOOKING EVENTS ----
  if (eventType.startsWith("booking.appointment.")) {
    const bookingBase: SampleField[] = [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "customer@example.com",
        defaultValue: "test@example.com",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Customer",
        required: true,
      },
      {
        key: "customerPhone",
        label: "Customer Phone",
        placeholder: "+1 555-0123",
        defaultValue: "",
      },
      {
        key: "serviceName",
        label: "Service Name",
        placeholder: "Deep Tissue Massage",
        defaultValue: "Sample Service",
        required: true,
      },
      {
        key: "servicePrice",
        label: "Service Price",
        placeholder: "50.00",
        defaultValue: "50.00",
        type: "number",
      },
      {
        key: "serviceDuration",
        label: "Duration (minutes)",
        placeholder: "60",
        defaultValue: "60",
        type: "number",
      },
      {
        key: "startTime",
        label: "Appointment Date/Time",
        placeholder: "",
        defaultValue: getDefaultDateTime(),
        type: "datetime-local",
        required: true,
      },
      {
        key: "staffName",
        label: "Staff Name",
        placeholder: "Dr. Sarah",
        defaultValue: "Test Staff",
      },
      {
        key: "status",
        label: "Status",
        placeholder: "confirmed",
        defaultValue:
          eventType === "booking.appointment.created" ? "pending" : "confirmed",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: "USD",
        defaultValue: "USD",
      },
      ownerEmail,
    ];

    if (eventType === "booking.appointment.payment_received") {
      bookingBase.push({
        key: "paymentStatus",
        label: "Payment Status",
        placeholder: "paid",
        defaultValue: "paid",
      });
    }

    return bookingBase;
  }

  // ---- CRM EVENTS ----
  if (eventType.startsWith("crm.contact.")) {
    return [
      {
        key: "email",
        label: "Contact Email",
        placeholder: "contact@example.com",
        defaultValue: "test@example.com",
        type: "email",
        required: true,
      },
      {
        key: "firstName",
        label: "First Name",
        placeholder: "Jane",
        defaultValue: "Test",
      },
      {
        key: "lastName",
        label: "Last Name",
        placeholder: "Smith",
        defaultValue: "Contact",
      },
      {
        key: "phone",
        label: "Phone",
        placeholder: "+1 555-0123",
        defaultValue: "",
      },
      {
        key: "company",
        label: "Company",
        placeholder: "Acme Corp",
        defaultValue: "",
      },
      ownerEmail,
    ];
  }

  if (eventType.startsWith("crm.deal.")) {
    return [
      {
        key: "dealTitle",
        label: "Deal Title",
        placeholder: "Enterprise Package",
        defaultValue: "Test Deal",
        required: true,
      },
      {
        key: "dealValue",
        label: "Deal Value",
        placeholder: "5000",
        defaultValue: "1000",
        type: "number",
      },
      {
        key: "contactEmail",
        label: "Contact Email",
        placeholder: "contact@example.com",
        defaultValue: "test@example.com",
        type: "email",
      },
      {
        key: "stage",
        label: "Deal Stage",
        placeholder: "negotiation",
        defaultValue: "new",
      },
      ownerEmail,
    ];
  }

  // ---- FORM EVENTS ----
  if (eventType.startsWith("form.submission.")) {
    return [
      {
        key: "formName",
        label: "Form Name",
        placeholder: "Contact Us",
        defaultValue: "Test Form",
        required: true,
      },
      {
        key: "submitterEmail",
        label: "Submitter Email",
        placeholder: "visitor@example.com",
        defaultValue: "test@example.com",
        type: "email",
      },
      {
        key: "submitterName",
        label: "Submitter Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Visitor",
      },
      ownerEmail,
    ];
  }

  // ---- E-COMMERCE EVENTS ----
  if (eventType.startsWith("ecommerce.order.")) {
    return [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "buyer@example.com",
        defaultValue: "test@example.com",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Buyer",
        required: true,
      },
      {
        key: "orderNumber",
        label: "Order Number",
        placeholder: "ORD-001",
        defaultValue: "ORD-TEST-001",
      },
      {
        key: "orderTotal",
        label: "Order Total",
        placeholder: "149.99",
        defaultValue: "99.99",
        type: "number",
      },
      {
        key: "currency",
        label: "Currency",
        placeholder: "USD",
        defaultValue: "USD",
      },
      ownerEmail,
    ];
  }

  if (eventType.startsWith("ecommerce.quote.")) {
    return [
      {
        key: "customerEmail",
        label: "Customer Email",
        placeholder: "buyer@example.com",
        defaultValue: "test@example.com",
        type: "email",
        required: true,
      },
      {
        key: "customerName",
        label: "Customer Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Client",
        required: true,
      },
      {
        key: "quoteNumber",
        label: "Quote Number",
        placeholder: "QT-001",
        defaultValue: "QT-TEST-001",
      },
      {
        key: "quoteTotal",
        label: "Quote Total",
        placeholder: "500.00",
        defaultValue: "250.00",
        type: "number",
      },
      ownerEmail,
    ];
  }

  // ---- LIVE CHAT EVENTS ----
  if (eventType.startsWith("live_chat.")) {
    return [
      {
        key: "conversationId",
        label: "Conversation ID",
        placeholder: "leave blank to skip chat steps",
        defaultValue: "",
        hint: "Optional — needed for chat action steps to fire",
      },
      {
        key: "visitorName",
        label: "Visitor Name",
        placeholder: "Jane Smith",
        defaultValue: "Test Visitor",
      },
      {
        key: "visitorEmail",
        label: "Visitor Email",
        placeholder: "visitor@example.com",
        defaultValue: "test@example.com",
        type: "email",
      },
      {
        key: "message",
        label: "Message Text",
        placeholder: "Hello, I need help",
        defaultValue: "Test message from workflow test run",
      },
      ownerEmail,
    ];
  }

  // ---- FALLBACK for unknown event types ----
  return [
    {
      key: "customerEmail",
      label: "Customer Email",
      placeholder: "customer@example.com",
      defaultValue: "test@example.com",
      type: "email",
      required: true,
    },
    {
      key: "customerName",
      label: "Customer Name",
      placeholder: "Jane Smith",
      defaultValue: "Test Customer",
    },
    ownerEmail,
  ];
}

function getDefaultDateTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1); // tomorrow
  d.setHours(10, 0, 0, 0);
  // Format as local datetime-local string: YYYY-MM-DDTHH:mm
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T10:00`;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface TestRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType?: string;
  isRunning: boolean;
  onRunTest: (sampleData: Record<string, unknown>) => void;
}

export function TestRunDialog({
  open,
  onOpenChange,
  eventType,
  isRunning,
  onRunTest,
}: TestRunDialogProps) {
  const fields = useMemo(() => getSampleFieldsForEvent(eventType), [eventType]);

  // Initialize form values from defaults
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = field.defaultValue;
    }
    return initial;
  });

  // Reset form when event type changes
  const [lastEventType, setLastEventType] = useState(eventType);
  if (eventType !== lastEventType) {
    setLastEventType(eventType);
    const initial: Record<string, string> = {};
    for (const field of fields) {
      initial[field.key] = field.defaultValue;
    }
    setFormData(initial);
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = () => {
    // Build trigger data from form, filtering out empty optional fields
    const triggerData: Record<string, unknown> = {
      test: true,
      source: "builder_test_run",
    };
    for (const field of fields) {
      const val = formData[field.key]?.trim();
      if (val) {
        // Convert numbers
        if (field.type === "number") {
          triggerData[field.key] = parseFloat(val) || val;
        } else if (field.type === "datetime-local" && val) {
          // Convert to ISO string for consistent handling
          triggerData[field.key] = new Date(val).toISOString();
        } else {
          triggerData[field.key] = val;
        }
      }
    }
    // Also include the event type so the execution engine can use it
    if (eventType) {
      triggerData.eventType = eventType;
    }
    onRunTest(triggerData);
  };

  const eventLabel = eventType?.replace(/\./g, " → ") || "Manual Trigger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Test Workflow
          </DialogTitle>
          <DialogDescription>
            Provide sample data to test this workflow end-to-end. All steps will
            execute using this data — emails will be sent, notifications
            created, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">Trigger:</span>
          <Badge variant="outline" className="text-xs">
            {eventLabel}
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px] pr-3">
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type={field.type || "text"}
                  value={formData[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-8 text-sm"
                  step={field.type === "number" ? "0.01" : undefined}
                />
                {field.hint && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-2.5 w-2.5 shrink-0" />
                    {field.hint}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <strong>Test mode:</strong> Real emails will be sent to the
            addresses above. Use test email addresses to avoid sending to real
            customers.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button onClick={handleRun} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {isRunning ? "Running..." : "Run Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
